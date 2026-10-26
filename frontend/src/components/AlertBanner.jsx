import React from 'react';
import { AlertTriangle, EyeOff, BellRing, ShieldAlert, Volume2, VolumeX } from 'lucide-react';

export const AlertBanner = ({
  score = 1.0,
  faceDetected = true,
  threshold = 0.4,
  isMuted = false,
  onToggleMute,
}) => {
  // Score is between 0.0 and 1.0
  const normalizedScore = score > 1.0 ? score / 100.0 : score;
  const isCriticalAlert = normalizedScore < threshold;
  const isFaceMissing = !faceDetected;

  if (!isCriticalAlert && !isFaceMissing) {
    return null;
  }

  return (
    <div
      role="alert"
      style={{
        position: 'relative',
        width: '100%',
        padding: '0.85rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        background: isCriticalAlert
          ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.95) 0%, rgba(185, 28, 28, 0.95) 100%)'
          : 'linear-gradient(90deg, rgba(245, 158, 11, 0.95) 0%, rgba(217, 119, 6, 0.95) 100%)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        boxShadow: isCriticalAlert
          ? '0 0 30px rgba(239, 68, 68, 0.65)'
          : '0 0 25px rgba(245, 158, 11, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        animation: 'pulseGlow 1.2s infinite ease-in-out',
        zIndex: 30,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '0.5rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isFaceMissing ? (
            <EyeOff size={26} color="#ffffff" />
          ) : (
            <ShieldAlert size={26} color="#ffffff" />
          )}
        </div>

        <div>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
            {isFaceMissing
              ? 'אזהרה קריטית: לא זוהו פני נהג!'
              : 'התרעת עייפות / הסחת דעת קריטית! סכנת תאונה!'}
          </div>
          <div style={{ fontSize: '0.85rem', opacity: 0.95, marginTop: '0.1rem' }}>
            {isFaceMissing
              ? 'המצלמה אינה מזהה את מבט הנהג. אנא שמור על קשר עין עם הכביש והפנה את הראש לפנים.'
              : `ציון הערנות ירד ל-${normalizedScore.toFixed(2)} (מתחת לסף הבטיחות של ${threshold.toFixed(2)}). מומלץ לעצור להתרעננות מיידית!`}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {onToggleMute && (
          <button
            onClick={onToggleMute}
            style={{
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#ffffff',
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'var(--transition-smooth)',
            }}
            title={isMuted ? 'הפעל צפצוף התרעה' : 'השתק צפצוף'}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            <span>{isMuted ? 'מושתק' : 'צפצוף פעיל'}</span>
          </button>
        )}

        <div
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-mono, monospace)',
            fontWeight: 800,
            fontSize: '0.95rem',
          }}
        >
          {isFaceMissing ? 'NO FACE' : `ALERT: ${normalizedScore.toFixed(2)}`}
        </div>
      </div>
    </div>
  );
};

export default AlertBanner;
