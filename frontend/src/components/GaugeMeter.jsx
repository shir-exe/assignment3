import React from 'react';
import { Activity, ShieldCheck, AlertCircle, AlertTriangle } from 'lucide-react';

export const GaugeMeter = ({ score = 1.0, threshold = 0.4, label = 'מד ערנות נהג (HUD)' }) => {
  // Normalize score to 0.0 - 1.0
  const normalized = Math.max(0.0, Math.min(1.0, score > 1.0 ? score / 100.0 : score));
  const percentage = Math.round(normalized * 100);

  // Determine state colors and descriptors
  let statusColor = '#10b981'; // Green
  let statusText = 'ערני וממוקד';
  let statusClass = 'badge-success';
  let IconComponent = ShieldCheck;

  if (normalized < threshold) {
    statusColor = '#ef4444'; // Red
    statusText = 'סכנה: עייפות / הסחת דעת!';
    statusClass = 'badge-danger';
    IconComponent = AlertTriangle;
  } else if (normalized < 0.7) {
    statusColor = '#f59e0b'; // Amber
    statusText = 'זהירות: ירידה בריכוז';
    statusClass = 'badge-warning';
    IconComponent = AlertCircle;
  }

  // SVG Gauge Calculations (Semi-circle 180 degrees)
  const radius = 80;
  const strokeWidth = 14;
  const circumference = Math.PI * radius; // Half-circle perimeter
  const strokeDashoffset = circumference - normalized * circumference;

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.4rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        border: normalized < threshold ? '1px solid rgba(239, 68, 68, 0.6)' : undefined,
        boxShadow: normalized < threshold ? '0 0 25px rgba(239, 68, 68, 0.35)' : undefined,
      }}
    >
      {/* Header */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.8rem',
        }}
      >
        <span
          style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <Activity size={16} color={statusColor} />
          {label}
        </span>
        <span className={`badge ${statusClass}`} style={{ fontSize: '0.7rem' }}>
          <IconComponent size={12} />
          {statusText}
        </span>
      </div>

      {/* SVG Arc Gauge */}
      <div style={{ position: 'relative', width: '200px', height: '115px' }}>
        <svg
          width="200"
          height="120"
          viewBox="0 0 200 120"
          style={{ overflow: 'visible' }}
        >
          {/* Background Track Arc */}
          <path
            d="M 20 105 A 80 80 0 0 1 180 105"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Danger Zone marker (< 0.4) */}
          <path
            d="M 20 105 A 80 80 0 0 1 84 37"
            fill="none"
            stroke="rgba(239, 68, 68, 0.25)"
            strokeWidth={strokeWidth - 4}
            strokeLinecap="round"
          />

          {/* Value Progress Arc */}
          <path
            d="M 20 105 A 80 80 0 0 1 180 105"
            fill="none"
            stroke={statusColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.4s ease, stroke 0.4s ease',
              filter: `drop-shadow(0 0 8px ${statusColor})`,
            }}
          />
        </svg>

        {/* Digital Readout in center of gauge */}
        <div
          style={{
            position: 'absolute',
            bottom: '2px',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '2rem',
              fontWeight: 900,
              fontFamily: 'var(--font-mono, monospace)',
              lineHeight: 1,
              color: statusColor,
              textShadow: `0 0 15px ${statusColor}`,
            }}
          >
            {normalized.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {percentage}% ערנות
          </div>
        </div>
      </div>

      {/* Threshold Reference Indicator */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '0.8rem',
          padding: '0.4rem 0.6rem',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.75rem',
        }}
      >
        <span style={{ color: 'var(--text-muted)' }}>0.00 (ישנוני)</span>
        <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
          סף סכנה: {threshold.toFixed(2)}
        </span>
        <span style={{ color: 'var(--text-muted)' }}>1.00 (שיא)</span>
      </div>
    </div>
  );
};

export default GaugeMeter;
