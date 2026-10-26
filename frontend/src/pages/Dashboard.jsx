import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { contentService, userService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Play, Clock, Compass, Filter, ShieldCheck, Car } from 'lucide-react';
import { ATTENTION_PROFILES } from '../utils/attentionProfiles';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [routesList, setRoutesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(user?.preferred_profile || 'standard');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [routesData, statsData] = await Promise.all([
          contentService.getAll(selectedCategory),
          userService.getStats(),
        ]);
        setRoutesList(routesData);
        setStats(statsData);
      } catch (err) {
        console.error('Error fetching driving routes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory]);

  const handleStartDrive = (routeId) => {
    navigate(`/drive/${routeId}?profile=${selectedProfile}`);
  };

  const categories = ['הכל', 'Highway', 'Desert Cruise', 'Urban Traffic', 'Mountain Pass'];

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Hero / HUD Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '2.5rem',
          marginBottom: '2.5rem',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.75) 0%, rgba(15, 23, 42, 0.85) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
        }}
      >
        <div style={{ maxWidth: '750px' }}>
          <div
            className="badge"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              marginBottom: '0.8rem',
            }}
          >
            <ShieldCheck size={14} />
            <span>DriveAlert • מערכת בטיחות וניטור נהג בזמן אמת</span>
          </div>
          <h1 style={{ fontSize: '2.3rem', fontWeight: 900, lineHeight: 1.2, marginBottom: '0.8rem' }}>
            שלום, <span style={{ color: '#f87171' }}>{user?.full_name || user?.username}</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '1.5rem' }}>
            בחר/י מסלול נהיגה והפעל/י סשן מנוטר. מערכת ה-AI עוקבת אחר עצימת עיניים, תנועות ראש והסחות דעת באמצעות מצלמת הדפדפן ומודל ONNX.
          </p>

          {/* Quick Telemetry KPI Badges */}
          {stats && (
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '0.7rem 1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>נסיעות שהושלמו</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>
                  {stats.completed_sessions} / {stats.total_sessions}
                </div>
              </div>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '0.7rem 1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ציון ערנות ממוצע</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)' }}>
                  {stats.overall_avg_score > 0
                    ? `${stats.overall_avg_score <= 1.0 ? stats.overall_avg_score : (stats.overall_avg_score / 100).toFixed(2)} (${stats.overall_avg_score > 1.0 ? stats.overall_avg_score : Math.round(stats.overall_avg_score * 100)}%)`
                    : 'טרם נמדד'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Control Bar: Profiles & Filters */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        {/* Profile Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            רגישות התרעות:
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {Object.values(ATTENTION_PROFILES).map((prof) => (
              <button
                key={prof.id}
                onClick={() => setSelectedProfile(prof.id)}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border:
                    selectedProfile === prof.id
                      ? '1px solid #ef4444'
                      : '1px solid var(--border-subtle)',
                  background:
                    selectedProfile === prof.id
                      ? 'rgba(239, 68, 68, 0.2)'
                      : 'rgba(15, 23, 42, 0.6)',
                  color: selectedProfile === prof.id ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'var(--transition-smooth)',
                }}
              >
                {prof.name.split(' ')[0]} (סף 0.40)
              </button>
            ))}
          </div>
        </div>

        {/* Category Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Filter size={16} color="var(--text-muted)" />
          {categories.map((cat) => {
            const val = cat === 'הכל' ? '' : cat;
            const isSel = selectedCategory === val;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(val)}
                className={isSel ? 'btn-primary' : 'btn-secondary'}
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.8rem',
                  background: isSel ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : undefined,
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Routes Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          טוען מסלולי נהיגה זמינים...
        </div>
      ) : routesList.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>לא נמצאו מסלולים בקטגוריה זו.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '1.75rem',
          }}
        >
          {routesList.map((item) => (
            <div
              key={item.id}
              className="glass-panel"
              style={{
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                borderRadius: 'var(--radius-md)',
              }}
            >
              {/* Thumbnail / Header */}
              <div style={{ position: 'relative', height: '200px', background: '#0b1120' }}>
                <img
                  src={
                    item.thumbnail_url ||
                    'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=600&q=80'
                  }
                  alt={item.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    display: 'flex',
                    gap: '0.5rem',
                  }}
                >
                  <span className="badge badge-primary">{item.category}</span>
                  <span className="badge badge-warning">{item.difficulty}</span>
                </div>
                <div
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '12px',
                    background: 'rgba(0,0,0,0.75)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Clock size={13} />
                  <span>{Math.floor(item.duration_seconds / 60)} דקות</span>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.6rem' }}>
                  {item.title}
                </h3>
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.88rem',
                    lineHeight: '1.55',
                    marginBottom: '1.25rem',
                    flex: 1,
                  }}
                >
                  {item.description}
                </p>

                {/* Tags */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                  {item.tags?.map((t) => (
                    <span
                      key={t}
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        background: 'rgba(255,255,255,0.03)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      #{t}
                    </span>
                  ))}
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleStartDrive(item.id)}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  }}
                >
                  <Car size={18} />
                  <span>התחלת נסיעה מנוטרת</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
