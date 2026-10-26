/**
 * DriveAlert Audio Notification System
 * Synthesizes real-time automotive warning chimes and fatigue danger alerts using Web Audio API.
 * Does not require external audio assets and runs completely in the browser.
 */

let audioCtx = null;
let activeOscillator = null;
let activeGainNode = null;
let isAlertPlaying = false;
let pulseTimer = null;

const getAudioContext = () => {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

/**
 * Play a single short warning beep
 * @param {number} freq - Frequency in Hz (default: 800)
 * @param {number} duration - Duration in seconds (default: 0.15)
 */
export const playWarningBeep = (freq = 800, duration = 0.15) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (err) {
    console.warn('Audio warning beep notice:', err);
  }
};

/**
 * Start high-priority fatigue/distraction danger alarm sequence
 * Alternates frequencies (880Hz / 587Hz) to grab the driver's attention immediately
 */
export const startDangerAlarm = () => {
  if (isAlertPlaying) return;
  isAlertPlaying = true;

  const playPulse = () => {
    if (!isAlertPlaying) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(587, ctx.currentTime + 0.22);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } catch (e) {
      // Audio autoplay restriction handling
    }

    pulseTimer = setTimeout(playPulse, 450);
  };

  playPulse();
};

/**
 * Silence any active danger alarms
 */
export const stopDangerAlarm = () => {
  isAlertPlaying = false;
  if (pulseTimer) {
    clearTimeout(pulseTimer);
    pulseTimer = null;
  }
  if (activeOscillator) {
    try {
      activeOscillator.stop();
    } catch (e) {}
    activeOscillator = null;
  }
};

export default {
  playWarningBeep,
  startDangerAlarm,
  stopDangerAlarm,
};
