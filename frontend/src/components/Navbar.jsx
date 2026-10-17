import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, BookOpen, History as HistoryIcon, LogOut, User } from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAuthenticated) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(16px)',
      backgroundColor: 'rgba(9, 13, 22, 0.85)',
      borderBottom: '1px solid var(--border-subtle)'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Logo */}
        <Link to="/library" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'var(--accent-gradient)',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--accent-glow)'
          }}>
            <Activity size={22} color="#ffffff" />
          </div>
          <div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Focus<span className="text-gradient">Flow</span>
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link
            to="/library"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.9rem',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: '0.9rem',
              color: isActive('/library') ? '#ffffff' : 'var(--text-secondary)',
              backgroundColor: isActive('/library') ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              border: isActive('/library') ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
              transition: 'var(--transition-smooth)'
            }}
          >
            <BookOpen size={17} />
            <span>ספריית תכנים</span>
          </Link>

          <Link
            to="/history"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.9rem',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: '0.9rem',
              color: isActive('/history') ? '#ffffff' : 'var(--text-secondary)',
              backgroundColor: isActive('/history') ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              border: isActive('/history') ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
              transition: 'var(--transition-smooth)'
            }}
          >
            <HistoryIcon size={17} />
            <span>היסטוריה וציונים</span>
          </Link>
        </nav>

        {/* User Info & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '0.35rem 0.8rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)'
          }}>
            <User size={15} color="var(--accent-secondary)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.username}</span>
            <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
              {user?.preferred_profile || 'standard'}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="btn-secondary"
            style={{ padding: '0.45rem 0.8rem', fontSize: '0.85rem' }}
            title="התנתקות"
          >
            <LogOut size={16} />
            <span>יציאה</span>
          </button>
        </div>
      </div>
    </header>
  );
};
