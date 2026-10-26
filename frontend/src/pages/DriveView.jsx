import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { contentService, sessionService } from '../services/api';
import { useDriverMonitor } from '../hooks/useDriverMonitor';
import { AlertBanner } from '../components/AlertBanner';
import { GaugeMeter } from '../components/GaugeMeter';
import {
  Camera,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Activity,
  ChevronLeft,
  Lock,
  Volume2,
  VolumeX,
} from 'lucide-react';

export const DriveView = () => {
  const { id: routeId } = useParams();
  const [searchParams] = useSearchParams();
  const profileId = searchParams.get('profile') || 'standard';
  const navigate = useNavigate();

  const [route, setRoute] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [driveReadings, setDriveReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [videoElapsedSec, setVideoElapsedSec] = useState(0);

  const roadVideoRef = useRef(null);

  // Driver monitor custom hook (Face Mesh, ONNX, Web Audio alarm, 0.0 - 1.0 score)
  const {
    videoRef: webcamRef,
    hasConsent,
    isCameraActive,
    cameraError,
    attentionScore,
    faceDetected,
    isDrowsy,
    gazeState,
    isMuted,
    requestCameraAccess,
    stopCamera,
    toggleMute,
  } = useDriverMonitor(0.4);

  // Initialize Route & Backend Drive Session
  useEffect(() => {
    const initDrive = async () => {
      try {
        setLoading(true);
        const routeData = await contentService.getById(routeId);
        setRoute(routeData);

        const newSession = await sessionService.startSession({
          content_id: routeData.id,
          content_title: routeData.title,
          attention_profile: profileId,
        });
        setActiveSession(newSession);
      } catch (err) {
        console.error('Drive session initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initDrive();

    return () => {
      stopCamera();
    };
  }, [routeId, profileId, stopCamera]);

  // Periodic Telemetry Logger (saves score & position)
  useEffect(() => {
    if (!activeSession) return;

    const interval = setInterval(async () => {
      if (roadVideoRef.current && !roadVideoRef.current.paused) {
        const currentSec = Math.round(roadVideoRef.current.currentTime);
        setVideoElapsedSec(currentSec);

        const reading = {
          position: currentSec,
          timestamp_sec: currentSec,
          score: Number(attentionScore.toFixed(2)),
          attention_score: Number(attentionScore.toFixed(2)),
          face_detected: faceDetected,
          gaze_state: gazeState,
          is_drowsy: isDrowsy,
        };

        setDriveReadings((prev) => [...prev, reading]);

        // Non-blocking sync with backend readings
        try {
          await sessionService.sendReadings(activeSession.id, reading);
        } catch (e) {
          // Keep local buffer if offline
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession, attentionScore, faceDetected, gazeState, isDrowsy]);

  // Finalize Drive Session
  const handleCompleteDrive = async (completed = true) => {
    if (!activeSession) {
      stopCamera();
      navigate('/history');
      return;
    }

    try {
      const avg =
        driveReadings.length > 0
          ? Number((driveReadings.reduce((acc, r) => acc + r.score, 0) / driveReadings.length).toFixed(2))
          : attentionScore;

      await sessionService.updateSession(activeSession.id, {
        readings: driveReadings,
        average_score: avg,
        duration_watched_sec: videoElapsedSec,
        is_completed: completed,
      });

      stopCamera();
      navigate('/history');
    } catch (err) {
      console.error('Failed to finalize drive session:', err);
      stopCamera();
      navigate('/history');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--text-secondary)' }}>
        מכין את מערכות ה-AI ומתחבר למסלול הנהיגה...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.25rem' }}>
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <button
            onClick={() => handleCompleteDrive(false)}
            className="btn-secondary"
            style={{ padding: '0.45rem 0.8rem' }}
          >
            <ChevronLeft size={18} />
            <span>סיום וחזרה</span>
          </button>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{route?.title}</h2>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginTop: '0.2rem' }}>
              <span className="badge badge-primary">{route?.category || 'כביש מהיר'}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                סף התרעת עייפות: 0.40
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={toggleMute}
            className="btn-secondary"
            style={{ padding: '0.45rem 0.8rem' }}
            title={isMuted ? 'הפעל צפצוף התרעה' : 'השתק צפצוף'}
          >
            {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
            <span>{isMuted ? 'צפצוף מושתק' : 'צפצוף פעיל'}</span>
          </button>

          <button
            onClick={() => handleCompleteDrive(true)}
            className="btn-primary"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
          >
            <CheckCircle size={18} />
            <span>סיום נסיעה ושמירת דוח</span>
          </button>
        </div>
      </div>

      {/* Prominent Fatigue/Distraction Alert Banner (< 0.4 or Face Missing) */}
      <div style={{ marginBottom: '1.25rem' }}>
        <AlertBanner
          score={attentionScore}
          faceDetected={faceDetected}
          threshold={0.4}
          isMuted={isMuted}
          onToggleMute={toggleMute}
        />
      </div>

      {/* Main Grid: Road View (Left) & Driver Cockpit Monitor HUD (Right) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 390px',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Road Driving Video Player */}
        <div className="glass-panel" style={{ padding: '1rem', borderRadius: 'var(--radius-md)' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16/9',
              background: '#020617',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
              boxShadow: isDrowsy ? '0 0 30px rgba(239, 68, 68, 0.4)' : undefined,
              border: isDrowsy ? '2px solid #ef4444' : '1px solid var(--border-subtle)',
            }}
          >
            <video
              ref={roadVideoRef}
              src={route?.video_url}
              controls
              autoPlay
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onEnded={() => handleCompleteDrive(true)}
            />

            {/* In-cockpit Heads-Up Alert Indicator */}
            {isDrowsy && (
              <div
                style={{
                  position: 'absolute',
                  top: '18px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(239, 68, 68, 0.95)',
                  color: '#ffffff',
                  padding: '0.6rem 1.4rem',
                  borderRadius: 'var(--radius-full)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  boxShadow: '0 4px 25px rgba(239, 68, 68, 0.7)',
                  animation: 'pulseGlow 1.2s infinite',
                  pointerEvents: 'none',
                }}
              >
                <AlertTriangle size={20} />
                <span>התרעה: ירידה בריכוז / הסחת דעת מהכביש!</span>
              </div>
            )}
          </div>

          <div style={{ marginTop: '1rem', padding: '0 0.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.3rem' }}>
              תנאי הדרך ומטרת הניטור
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              {route?.description}
            </p>
          </div>
        </div>

        {/* Right Column: Driver Monitoring Camera & Telemetry HUD */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Driver Camera Box - Explicit Consent Handling */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem',
              }}
            >
              <span
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <Camera size={16} color="#38bdf8" />
                מצלמת ניטור פני נהג
              </span>
              <span className={isCameraActive ? 'badge badge-success' : 'badge badge-warning'}>
                {isCameraActive ? 'ניטור פעיל' : 'ממתין להסכמה'}
              </span>
            </div>

            {/* Camera Viewport or Explicit Consent Prompt */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '4/3',
                background: '#090d16',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                border: `2px solid ${
                  !faceDetected
                    ? '#ef4444'
                    : attentionScore < 0.4
                    ? '#ef4444'
                    : attentionScore < 0.7
                    ? '#f59e0b'
                    : '#10b981'
                }`,
              }}
            >
              {!hasConsent ? (
                /* Explicit Consent Card */
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.5rem',
                    textAlign: 'center',
                    background: 'rgba(15, 23, 42, 0.95)',
                  }}
                >
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: 'rgba(99, 102, 241, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <Lock size={22} color="#818cf8" />
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                    אישור הפעלת מצלמת בטיחות
                  </h4>
                  <p
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.45',
                      marginBottom: '1rem',
                    }}
                  >
                    הזרמת הווידאו משמשת לניתוח מקומי בדפדפן (MediaPipe & ONNX) לזיהוי עייפות והסחת דעת, ואינה נשמרת או משודרת לשרת.
                  </p>
                  <button
                    onClick={requestCameraAccess}
                    className="btn-primary"
                    style={{
                      fontSize: '0.85rem',
                      padding: '0.55rem 1rem',
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    }}
                  >
                    <Camera size={16} />
                    <span>אני מסכים/ה – הפעל מצלמה</span>
                  </button>
                </div>
              ) : (
                /* Live Camera Feed */
                <>
                  <video
                    ref={webcamRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transform: 'scaleX(-1)', // Mirror view for natural driver HUD
                    }}
                  />

                  {/* Face Mesh Landmark Overlay Box */}
                  {isCameraActive && faceDetected && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: '16%',
                        border: `1.5px dashed ${attentionScore < 0.4 ? '#ef4444' : '#10b981'}`,
                        borderRadius: '16px',
                        pointerEvents: 'none',
                        opacity: 0.75,
                      }}
                    />
                  )}

                  {/* Warning overlay if face is missing */}
                  {!faceDetected && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(239, 68, 68, 0.4)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        backdropFilter: 'blur(2px)',
                      }}
                    >
                      <EyeOff size={32} />
                      <span>לא זוהו פני נהג!</span>
                    </div>
                  )}

                  {/* Bottom pill in camera preview */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      background: 'rgba(0, 0, 0, 0.75)',
                      padding: '0.25rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.72rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    {faceDetected ? <Eye size={12} color="#10b981" /> : <EyeOff size={12} color="#ef4444" />}
                    <span>
                      {faceDetected
                        ? gazeState === 'focused'
                          ? 'מבט: ממוקד בכביש'
                          : 'מבט: מוסח / צידי'
                        : 'פנים לא זוהו'}
                    </span>
                  </div>
                </>
              )}
            </div>

            {cameraError && (
              <p style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '0.6rem' }}>
                {cameraError}
              </p>
            )}
          </div>

          {/* Alertness Gauge Meter (0.0 to 1.0, 0.4 Danger Threshold) */}
          <GaugeMeter score={attentionScore} threshold={0.4} label="מד ערנות נהג (HUD)" />

          {/* Drive Telemetry KPI Panel */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h4
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '0.75rem',
              }}
            >
              נתוני סשן נהיגה חיים
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '0.6rem',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>זמן נסיעה</div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{videoElapsedSec} שניות</div>
              </div>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '0.6rem',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>דגימות רשומות</div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{driveReadings.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriveView;
