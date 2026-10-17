import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { contentService, userService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Play, Clock, Sparkles, Filter, Award, CheckCircle } from 'lucide-react';
import { ATTENTION_PROFILES } from '../utils/attentionProfiles';

export const Library = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contentList, setContentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(user?.preferred_profile || 'standard');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [contentData, statsData] = await Promise.all([
          contentService.getAll(selectedCategory),
          userService.getStats()
        ]);
        setContentList(contentData);
        setStats(statsData);
      } catch (err) {
        console.error('Error fetching library data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory]);

  const handleStartSession = (contentId) => {
    navigate(`/session/${contentId}?profile=${selectedProfile}`);
  };

  const categories = ['הכל', 'Neuroscience', 'Productivity', 'Artificial Intelligence'];

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Hero / Welcome Banner */}
      <div className="glass-panel" style={{
        padding: '2.5rem',
        marginBottom: '2.5rem',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)'
      }}>
        <div style={{ maxWidth: '700px' }}>
          <div className="badge badge-primary" style={{ marginBottom: '0.8rem' }}>
            <Sparkles size={14} />
            <span>סביבת למידה אדפטיבית מבוססת ראייה ממוחשבת</span>
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '0.8rem' }}>
            שלום, <span className="text-gradient">{user?.full_name || user?.username}</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '1.5rem' }}>
            בחרו תוכן לצפייה והתחילו סשן מנוטר. מודל ה-AI ימדוד את רמת המיקוד, מנח הראש ותנועות העיניים שלכם בזמן אמת.
          </p>

          {/* User Quick Stats */}
          {stats && (
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>סשנים שהושלמו</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>
                  {stats.completed_sessions} / {stats.total_sessions}
                </div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ציון ריכוז ממוצע</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--success)' }}>
                  {stats.overall_avg_score > 0 ? `${stats.overall_avg_score}%` : 'טרם נמדד'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Control Bar: Profiles Selector & Category Filters */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Profile Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            פרופיל קשב לסשן:
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
                  border: selectedProfile === prof.id ? `1px solid ${prof.color}` : '1px solid var(--border-subtle)',
                  background: selectedProfile === prof.id ? 'rgba(99, 102, 241, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                  color: selectedProfile === prof.id ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'var(--transition-smooth)'
                }}
              >
                {prof.name.split(' ')[0]} ({prof.threshold}%)
              </button>
            ))}
          </div>
        </div>

        {/* Category Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="var(--text-muted)" />
          {categories.map((cat) => {
            const val = cat === 'הכל' ? '' : cat;
            const isSel = selectedCategory === val;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(val)}
                className={isSel ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          טוען תכנים זמינים...
        </div>
      ) : contentList.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>לא נמצאו תכנים בקטגוריה זו.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '1.75rem'
        }}>
          {contentList.map((item) => (
            <div
              key={item.id}
              className="glass-panel"
              style={{
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                borderRadius: 'var(--radius-md)'
              }}
            >
              {/* Thumbnail / Header */}
              <div style={{ position: 'relative', height: '190px', background: '#0b1120' }}>
                <img
                  src={item.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80'}
                  alt={item.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  display: 'flex',
                  gap: '0.5rem'
                }}>
                  <span className="badge badge-primary">{item.category}</span>
                  <span className="badge badge-warning">{item.difficulty}</span>
                </div>
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '12px',
                  background: 'rgba(0,0,0,0.7)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}>
                  <Clock size={13} />
                  <span>{Math.floor(item.duration_seconds / 60)} דקות</span>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.6rem' }}>
                  {item.title}
                </h3>
                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  marginBottom: '1.25rem',
                  flex: 1
                }}>
                  {item.description}
                </p>

                {/* Tags */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                  {item.tags?.map((t) => (
                    <span key={t} style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      background: 'rgba(255,255,255,0.03)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-sm)'
                    }}>
                      #{t}
                    </span>
                  ))}
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleStartSession(item.id)}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Play size={16} fill="currentColor" />
                  <span>התחלת סשן מנוטר</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
