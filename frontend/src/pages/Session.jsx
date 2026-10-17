import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { contentService, sessionService } from '../services/api';
import { useCamera } from '../hooks/useCamera';
import { useAttentionModel } from '../hooks/useAttentionModel';
import {
  Camera,
  CameraOff,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Activity,
  Award,
  ChevronLeft
} from 'lucide-react';

export const Session = () => {
  const { id: contentId } = useParams();
  const [searchParams] = useSearchParams();
  const profileId = searchParams.get('profile') || 'standard';
  const navigate = useNavigate();

  const [content, setContent] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [sessionSamples, setSessionSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [videoElapsedSec, setVideoElapsedSec] = useState(0);

  const learningVideoRef = useRef(null);

  // Custom Hooks for camera and attention model
  const { videoRef: webcamRef, isReady: isCameraReady, error: cameraError, startCamera, stopCamera } = useCamera();
  const { attentionScore, gazeState, faceDetected, isDistracted, profile } = useAttentionModel(webcamRef, isCameraReady, profileId);

  // Initialize Session & Fetch Content
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const item = await contentService.getById(contentId);
        setContent(item);

        const newSession = await sessionService.startSession({
          content_id: item.id,
          content_title: item.title,
          attention_profile: profileId
        });
        setActiveSession(newSession);

        // Automatically activate camera
        await startCamera();
      } catch (err) {
        console.error('Session initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      stopCamera();
    };
  }, [contentId, profileId]);

  // Periodic metric sampler while video is playing
  useEffect(() => {
    if (!activeSession) return;

    const interval = setInterval(() => {
      if (learningVideoRef.current && !learningVideoRef.current.paused) {
        const currentSec = Math.round(learningVideoRef.current.currentTime);
        setVideoElapsedSec(currentSec);

        const newSample = {
          timestamp_sec: currentSec,
          attention_score: attentionScore,
          face_detected: faceDetected,
          gaze_state: gazeState
        };

        setSessionSamples((prev) => [...prev, newSample]);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession, attentionScore, faceDetected, gazeState]);

  // Finish or exit session
  const handleCompleteSession = async (completed = true) => {
    if (!activeSession) return;

    try {
      const avg = sessionSamples.length > 0
        ? Math.round(sessionSamples.reduce((acc, s) => acc + s.attention_score, 0) / sessionSamples.length)
        : attentionScore;

      await sessionService.updateSession(activeSession.id, {
        samples: sessionSamples,
        average_score: avg,
        duration_watched_sec: videoElapsedSec,
        is_completed: completed
      });

      stopCamera();
      navigate('/history');
    } catch (err) {
      console.error('Failed to save session:', err);
      navigate('/history');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 75) return '#10b981'; // Green
    if (score >= profile.threshold) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--text-secondary)' }}>
        מכין את סביבת הלמידה ומפעיל חיבורי AI...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.5rem' }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.25rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => handleCompleteSession(false)}
            className="btn-secondary"
            style={{ padding: '0.45rem 0.8rem' }}
          >
            <ChevronLeft size={18} />
            <span>סיום וחזרה</span>
          </button>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{content?.title}</h2>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginTop: '0.2rem' }}>
              <span className={`badge ${profile.badgeClass}`}>{profile.name}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                סף התראה: {profile.threshold}%
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={() => handleCompleteSession(true)}
            className="btn-primary"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
          >
            <CheckCircle size={18} />
            <span>סיום סשן ושמירה</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Video Player (Left/Center) + Real-time AI Monitor (Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 380px',
        gap: '1.75rem',
        alignItems: 'start'
      }}>
        {/* Left Column: Learning Video Player */}
        <div className="glass-panel" style={{ padding: '1rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16/9',
            background: '#020617',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden'
          }}>
            <video
              ref={learningVideoRef}
              src={content?.video_url}
              controls
              autoPlay
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onEnded={() => handleCompleteSession(true)}
            />

            {/* In-video Distraction Warning Overlay */}
            {isDistracted && (
              <div style={{
                position: 'absolute',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(239, 68, 68, 0.9)',
                color: '#ffffff',
                padding: '0.6rem 1.4rem',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                fontWeight: 700,
                fontSize: '0.95rem',
                boxShadow: '0 4px 20px rgba(239, 68, 68, 0.6)',
                animation: 'pulseGlow 1.5s infinite',
                zIndex: 20
              }}>
                <AlertTriangle size={20} />
                <span>שים/י לב: זוהתה הסחת דעת / מבט מחוץ למסך!</span>
              </div>
            )}
          </div>

          <div style={{ marginTop: '1rem', padding: '0 0.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.3rem' }}>
              תיאור התוכן הנלמד
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              {content?.description}
            </p>
          </div>
        </div>

        {/* Right Column: AI Face & Attention Tracking Monitor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Webcam Preview Card */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.75rem'
            }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Camera size={16} color="var(--accent-secondary)" />
                מצלמת מעקב קשב
              </span>
              <span className={isCameraReady ? 'badge badge-success' : 'badge badge-warning'}>
                {isCameraReady ? 'פעיל ומנתח' : 'ממתין להרשאה'}
              </span>
            </div>

            <div style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '4/3',
              background: '#0f172a',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
              border: `2px solid ${getScoreColor(attentionScore)}`
            }}>
              <video
                ref={webcamRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)' // Mirror view
                }}
              />

              {/* Bounding Box / Face Tracking Simulation Grid */}
              {isCameraReady && (
                <div style={{
                  position: 'absolute',
                  inset: '15%',
                  border: `1px dashed ${getScoreColor(attentionScore)}`,
                  borderRadius: '12px',
                  pointerEvents: 'none',
                  opacity: 0.7
                }} />
              )}

              {/* Status pill in webcam feed */}
              <div style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.75)',
                padding: '0.25rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <Eye size={13} color={getScoreColor(attentionScore)} />
                <span>מצב מבט: {gazeState === 'focused' ? 'ממוקד במסך' : 'מוסח / צידי'}</span>
              </div>
            </div>

            {cameraError && (
              <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.6rem' }}>
                {cameraError}
              </p>
            )}
          </div>

          {/* Attention Score Gauge Card */}
          <div className="glass-panel" style={{ padding: '1.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Activity size={16} color="var(--accent-primary)" />
                מדד קשב נוכחי
              </span>
              <span style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: getScoreColor(attentionScore)
              }}>
                {attentionScore}%
              </span>
            </div>

            {/* Score Progress Bar */}
            <div style={{
              width: '100%',
              height: '12px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
              marginBottom: '1rem'
            }}>
              <div style={{
                width: `${attentionScore}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${getScoreColor(attentionScore)} 0%, #6366f1 100%)`,
                borderRadius: 'var(--radius-full)',
                transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
              }} />
            </div>

            {/* Real-time Session telemetry metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
              fontSize: '0.8rem'
            }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ color: 'var(--text-muted)' }}>זמן שנצפה</div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{videoElapsedSec} שניות</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ color: 'var(--text-muted)' }}>דגימות שנאספו</div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{sessionSamples.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
