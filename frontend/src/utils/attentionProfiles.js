/**
 * Attention profiles definition and calibration settings
 */
export const ATTENTION_PROFILES = {
  standard: {
    id: 'standard',
    name: 'ריכוז סטנדרטי (Standard)',
    description: 'פרופיל מאוזן המאפשר תנועות ראש קלות ופעימות הסחת דעת קצרות.',
    threshold: 65,
    bufferTimeSeconds: 3.5,
    minFaceDetectionConfidence: 0.6,
    color: '#6366f1',
    badgeClass: 'badge-primary'
  },
  high: {
    id: 'high',
    name: 'ריכוז עמוק וקפדני (Deep Focus)',
    description: 'דריכות גבוהה לפעילויות קריטיות עם סף התראה מהיר ומחמיר.',
    threshold: 80,
    bufferTimeSeconds: 2.0,
    minFaceDetectionConfidence: 0.8,
    color: '#ec4899',
    badgeClass: 'badge-warning'
  },
  relaxed: {
    id: 'relaxed',
    name: 'קשב נינוח (Relaxed)',
    description: 'מתאים לצפייה בסרטוני רקע או פודקאסטים עם סובלנות גבוהה לתנועה.',
    threshold: 50,
    bufferTimeSeconds: 5.0,
    minFaceDetectionConfidence: 0.45,
    color: '#10b981',
    badgeClass: 'badge-success'
  }
};

export const getProfileById = (id = 'standard') => {
  return ATTENTION_PROFILES[id] || ATTENTION_PROFILES.standard;
};
