import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Mail, Lock, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { ATTENTION_PROFILES } from '../utils/attentionProfiles';

export const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    preferred_profile: 'standard',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);
      navigate('/library');
    } catch (err) {
      setError(err.response?.data?.detail || 'שגיאה ביצירת החשבון. אנא בדקי/בדוק את הנתונים.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2.5rem 1rem'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '520px',
        width: '100%',
        padding: '2.5rem 2rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
            boxShadow: 'var(--accent-glow)'
          }}>
            <Activity size={32} color="#ffffff" />
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.4rem' }}>
            יצירת חשבון חדש ב-<span className="text-gradient">FocusFlow</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            הצטרפו לחוויית למידה מותאמת אישית מבוססת בינה מלאכותית
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            padding: '0.75rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.25rem'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">שם מלא</label>
            <input
              type="text"
              name="full_name"
              className="form-input"
              placeholder="ישראל ישראלי"
              value={formData.full_name}
              onChange={handleChange}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">שם משתמש *</label>
              <input
                type="text"
                required
                name="username"
                className="form-input"
                placeholder="israel12"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">כתובת אימייל *</label>
              <input
                type="email"
                required
                name="email"
                className="form-input"
                placeholder="user@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">סיסמה (לפחות 6 תווים) *</label>
            <input
              type="password"
              required
              name="password"
              minLength={6}
              className="form-input"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          {/* Attention Profile Selection */}
          <div className="form-group" style={{ marginTop: '0.5rem' }}>
            <label className="form-label">פרופיל קשב מועדף</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {Object.values(ATTENTION_PROFILES).map((prof) => (
                <label
                  key={prof.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.8rem',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: formData.preferred_profile === prof.id
                      ? '1px solid var(--accent-primary)'
                      : '1px solid var(--border-subtle)',
                    background: formData.preferred_profile === prof.id
                      ? 'rgba(99, 102, 241, 0.12)'
                      : 'rgba(15, 23, 42, 0.4)',
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <input
                    type="radio"
                    name="preferred_profile"
                    value={prof.id}
                    checked={formData.preferred_profile === prof.id}
                    onChange={handleChange}
                    style={{ accentColor: 'var(--accent-primary)' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#ffffff' }}>
                      {prof.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {prof.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '1.25rem', padding: '0.8rem' }}
          >
            <span>{loading ? 'יוצר חשבון...' : 'סיום והרשמה'}</span>
            <CheckCircle2 size={18} />
          </button>
        </form>

        <div style={{ marginTop: '1.75rem', textAlign: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            כבר יש לך חשבון?{' '}
            <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
              התחברות כאן
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
