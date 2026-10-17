import React, { useState, useEffect } from 'react';
import { sessionService, userService } from '../services/api';
import { History as HistoryIcon, Award, Clock, Calendar, CheckCircle2, AlertCircle, BarChart2, Eye } from 'lucide-react';
import { getProfileById } from '../utils/attentionProfiles';

export const History = () => {
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSessionDetail, setSelectedSessionDetail] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const [sessionsData, statsData] = await Promise.all([
          sessionService.getAllSessions(),
          userService.getStats()
        ]);
        setSessions(sessionsData);
        setStats(statsData);
      } catch (err) {
        console.error('Error fetching history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const viewSessionTimeline = async (sessionId) => {
    try {
      const detail = await sessionService.getSessionDetail(sessionId);
      setSelectedSessionDetail(detail);
    } catch (err) {
      console.error('Failed to load session timeline:', err);
    }
  };

  const formatScoreBadge = (score) => {
    if (score >= 75) return <span className="badge badge-success">{score}% - ריכוז מצוין</span>;
    if (score >= 60) return <span className="badge badge-warning">{score}% - ריכוז סביר</span>;
    return <span className="badge badge-danger">{score}% - נדרש שיפור</span>;
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.4rem' }}>
          היסטוריית סשנים וציוני <span className="text-gradient">קשב</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          מעקב אחר ההתקדמות הקוגניטיבית וציוני הריכוז שלך לאורך זמן
        </p>
      </div>

      {/* Summary KPI Cards */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2.5rem'
        }}>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>
              <HistoryIcon size={20} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>סה״כ סשנים</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.total_sessions}</div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--success)', marginBottom: '0.5rem' }}>
              <Award size={20} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>ציון ריכוז ממוצע</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.overall_avg_score}%</div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--accent-secondary)', marginBottom: '0.5rem' }}>
              <Clock size={20} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>זמן למידה כולל</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>
              {Math.floor(stats.total_watch_seconds / 60)} דק׳
            </div>
          </div>
        </div>
      )}

      {/* Sessions List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          טוען היסטוריה...
        </div>
      ) : sessions.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>טרם נרשמו סשנים. התחל/י לצפות בסרטון מהספרייה!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {sessions.map((s) => {
            const prof = getProfileById(s.attention_profile);
            const dateStr = new Date(s.start_time).toLocaleDateString('he-IL', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={s.id}
                className="glass-panel"
                style={{
                  padding: '1.25rem 1.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                    {s.content_title}
                  </h3>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Calendar size={14} />
                      {dateStr}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={14} />
                      {Math.round(s.duration_watched_sec)} שניות
                    </span>
                    <span className={`badge ${prof.badgeClass}`}>{prof.name}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  {formatScoreBadge(s.average_score)}
                  <button
                    onClick={() => viewSessionTimeline(s.id)}
                    className="btn-secondary"
                    style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
                  >
                    <BarChart2 size={16} />
                    <span>גרף דגימות</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal / Drilldown Detail with Timeline */}
      {selectedSessionDetail && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          zIndex: 100
        }}>
          <div className="glass-panel" style={{
            maxWidth: '750px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            borderRadius: 'var(--radius-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                ניתוח דגימות בזמן אמת: {selectedSessionDetail.content_title}
              </h2>
              <button
                onClick={() => setSelectedSessionDetail(null)}
                className="btn-secondary"
                style={{ padding: '0.3rem 0.7rem' }}
              >
                סגור
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                התפלגות מדד הקשב (כל נקודה מייצגת שניה בסשן):
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '4px',
                height: '140px',
                padding: '0.75rem',
                background: 'rgba(15, 23, 42, 0.7)',
                borderRadius: 'var(--radius-sm)',
                overflowX: 'auto'
              }}>
                {selectedSessionDetail.samples?.map((s, idx) => (
                  <div
                    key={idx}
                    title={`שנייה ${s.timestamp_sec}: ציון ${s.attention_score}% (${s.gaze_state})`}
                    style={{
                      flex: '0 0 10px',
                      height: `${s.attention_score}%`,
                      background: s.attention_score >= 70 ? '#10b981' : s.attention_score >= 50 ? '#f59e0b' : '#ef4444',
                      borderRadius: '2px',
                      transition: 'height 0.2s'
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedSessionDetail(null)}
                className="btn-primary"
              >
                הבנתי, תודה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
