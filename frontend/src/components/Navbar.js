import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.navLeft}>
        <div style={styles.logo} onClick={() => navigate('/')}>
          <span style={styles.logoIcon}>⚡</span>
          <span style={styles.logoText}>CodeArena</span>
        </div>
        <div style={styles.navLinks}>
          <button onClick={() => navigate('/problems')} style={styles.navLink}>
            📚 Problems
          </button>
          
          {/* ✅ Hide Submissions button for Admin - they have it in Admin Dashboard */}
          {user?.role !== 'admin' && (
            <button onClick={() => navigate('/submissions')} style={styles.navLink}>
              📊 Submissions
            </button>
          )}

          {(user?.role === 'admin' || user?.role === 'setter') && (
            <button onClick={() => navigate('/create-problem')} style={styles.navLinkCreate}>
              ➕ Create
            </button>
          )}
          
          {user?.role === 'admin' && (
            <button onClick={() => navigate('/admin')} style={styles.navLinkAdmin}>
              📊 Admin
            </button>
          )}
        </div>
      </div>
      <div style={styles.navRight}>
        <div style={styles.userInfo}>
          <span style={styles.userAvatar}>👤</span>
          <span style={styles.userName}>{user?.username}</span>
          <span style={styles.userRole}>{user?.role}</span>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          🚪 Logout
        </button>
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    padding: '12px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    borderBottom: '2px solid rgba(108, 99, 255, 0.3)',
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '30px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  logoIcon: {
    fontSize: '24px',
  },
  logoText: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#ffffff',
    letterSpacing: '0.5px',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  navLink: {
    background: 'transparent',
    color: 'rgba(255,255,255,0.7)',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.3s ease',
  },
  navLinkCreate: {
    background: '#6C63FF',
    color: 'white',
    border: 'none',
    padding: '8px 18px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    transition: 'all 0.3s ease',
  },
  navLinkAdmin: {
    background: '#FF8C00',
    color: 'white',
    border: 'none',
    padding: '8px 18px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    transition: 'all 0.3s ease',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 14px',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  userAvatar: {
    fontSize: '16px',
  },
  userName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#ffffff',
  },
  userRole: {
    fontSize: '11px',
    fontWeight: 400,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'capitalize',
    background: 'rgba(108, 99, 255, 0.2)',
    padding: '2px 10px',
    borderRadius: '12px',
  },
  logoutBtn: {
    background: 'rgba(244, 67, 54, 0.15)',
    color: '#ef5350',
    border: '1px solid rgba(244, 67, 54, 0.2)',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'all 0.3s ease',
  },
};

export default Navbar;