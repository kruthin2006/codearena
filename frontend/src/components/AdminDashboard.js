import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [problemStats, setProblemStats] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      const [usersRes, subsRes, statsRes, onlineRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/admin/submissions', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/admin/problem-stats', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/admin/online-users', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setUsers(usersRes.data.users || []);
      setSubmissions(subsRes.data.submissions || []);
      setProblemStats(statsRes.data.stats || []);
      setOnlineUsers(onlineRes.data.online || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'accepted') return '#28a745';
    return '#dc3545';
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div className="spinner"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📊 Admin Dashboard</h1>
      <p style={styles.subtitle}>Monitor users, submissions, and platform activity</p>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={styles.statNumber}>{users.length}</span>
          <span style={styles.statLabel}>Total Users</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statNumber}>{submissions.length}</span>
          <span style={styles.statLabel}>Total Submissions</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statNumber}>{onlineUsers.length}</span>
          <span style={styles.statLabel}>🟢 Online Now</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statNumber}>
            {problemStats.filter(p => p.acceptedSubmissions > 0).length}
          </span>
          <span style={styles.statLabel}>Problems Solved</span>
        </div>
      </div>

      {/* Tabs - Only these 3 buttons */}
      <div style={styles.tabs}>
        <button 
          style={{ ...styles.tab, ...(activeTab === 'users' ? styles.tabActive : {}) }} 
          onClick={() => setActiveTab('users')}
        >
          👥 Users
        </button>
        <button 
          style={{ ...styles.tab, ...(activeTab === 'submissions' ? styles.tabActive : {}) }} 
          onClick={() => setActiveTab('submissions')}
        >
          📝 All Submissions
        </button>
        <button 
          style={{ ...styles.tab, ...(activeTab === 'problems' ? styles.tabActive : {}) }} 
          onClick={() => setActiveTab('problems')}
        >
          📚 Problem Stats
        </button>
      </div>

      {/* ===== USERS TAB ===== */}
      {activeTab === 'users' && (
        <div style={styles.tableContainer}>
          <h3 style={styles.tableTitle}>👥 Registered Users</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Username</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Solved</th>
                <th style={styles.th}>Attempts</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => {
                const isOnline = onlineUsers.some(u => u._id === user._id);
                return (
                  <tr key={user._id} style={styles.tr}>
                    <td style={styles.td}>{index + 1}</td>
                    <td style={styles.td}><strong>{user.username}</strong></td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.roleBadge,
                        background: user.role === 'admin' ? '#6C63FF' :
                                   user.role === 'setter' ? '#FF8C00' : '#28a745'
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={styles.td}>{user.stats?.problemsSolved || 0}</td>
                    <td style={styles.td}>{user.stats?.totalAttempts || 0}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusDot,
                        background: isOnline ? '#28a745' : '#ccc'
                      }}>
                        {isOnline ? '🟢 Online' : '⚪ Offline'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== SUBMISSIONS TAB ===== */}
      {activeTab === 'submissions' && (
        <div style={styles.tableContainer}>
          <h3 style={styles.tableTitle}>📝 All Submissions</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>User</th>
                <th style={styles.th}>Problem</th>
                <th style={styles.th}>Language</th>
                <th style={styles.th}>Score</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {submissions.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No submissions yet</td></tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub._id} style={styles.tr}>
                    <td style={styles.td}><strong>{sub.username}</strong></td>
                    <td style={styles.td}>{sub.problemTitle || 'Unknown Problem'}</td>
                    <td style={styles.td}>
                      <span style={styles.languageBadge}>
                        {sub.language?.toUpperCase() || 'N/A'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.scoreValue}>
                        {sub.score?.toFixed(1) || '0.0'}%
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        background: sub.status === 'accepted' ? '#d4edda' : '#f8d7da',
                        color: sub.status === 'accepted' ? '#155724' : '#721c24'
                      }}>
                        {sub.status === 'accepted' ? '✅ Accepted' : '❌ Wrong Answer'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== PROBLEM STATS TAB ===== */}
      {activeTab === 'problems' && (
        <div style={styles.tableContainer}>
          <h3 style={styles.tableTitle}>📚 Problem Statistics</h3>
          {problemStats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              No problems created yet
            </div>
          ) : (
            problemStats.map((problem) => (
              <div key={problem.problemId} style={styles.problemCard}>
                <div style={styles.problemHeader}>
                  <span style={styles.problemName}>{problem.title}</span>
                  <span style={styles.problemStats}>
                    {problem.totalSubmissions} submissions · {problem.uniqueSolvers} solvers
                  </span>
                </div>
                
                {/* Show who solved this problem */}
                <div style={styles.solverList}>
                  {problem.submissions.length === 0 ? (
                    <span style={styles.noSolvers}>No submissions yet</span>
                  ) : (
                    problem.submissions.map((s, i) => (
                      <span key={i} style={{
                        ...styles.solverTag,
                        background: s.status === 'accepted' ? '#d4edda' : '#f8d7da',
                        color: s.status === 'accepted' ? '#155724' : '#721c24'
                      }}>
                        {s.username} 
                        {s.status === 'accepted' ? ' ✅' : ' ❌'} 
                        ({s.score?.toFixed(0)}%)
                      </span>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '30px',
    maxWidth: '1200px',
    margin: '0 auto',
    minHeight: '100vh',
    background: '#f5f7fa',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#1a1a2e',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#888',
    marginBottom: '30px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '30px',
  },
  statCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    textAlign: 'center',
    border: '1px solid #eef0f2',
  },
  statNumber: {
    display: 'block',
    fontSize: '32px',
    fontWeight: 700,
    color: '#1a1a2e',
  },
  statLabel: {
    fontSize: '14px',
    color: '#888',
    marginTop: '4px',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  tab: {
    padding: '10px 24px',
    background: 'white',
    border: '1px solid #eef0f2',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    color: '#666',
    transition: 'all 0.3s',
  },
  tabActive: {
    background: '#6C63FF',
    color: 'white',
    borderColor: '#6C63FF',
  },
  tableContainer: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #eef0f2',
    overflow: 'auto',
  },
  tableTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1a1a2e',
    marginBottom: '16px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    background: '#f8f9fa',
    fontWeight: 600,
    color: '#555',
    fontSize: '13px',
    borderBottom: '2px solid #eef0f2',
  },
  td: {
    padding: '10px 16px',
    borderBottom: '1px solid #f0f0f0',
    fontSize: '14px',
  },
  tr: {
    transition: 'background 0.2s',
  },
  roleBadge: {
    padding: '2px 12px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 600,
    color: 'white',
  },
  statusDot: {
    padding: '2px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
    color: 'white',
  },
  statusBadge: {
    padding: '3px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
  },
  languageBadge: {
    padding: '2px 10px',
    background: '#eef0f2',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 500,
  },
  scoreValue: {
    fontWeight: 600,
    color: '#6C63FF',
  },
  problemCard: {
    background: '#f8f9fa',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '12px',
  },
  problemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    flexWrap: 'wrap',
  },
  problemName: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1a1a2e',
  },
  problemStats: {
    fontSize: '13px',
    color: '#888',
  },
  solverList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  solverTag: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
  },
  noSolvers: {
    fontSize: '13px',
    color: '#999',
  },
};

export default AdminDashboard;