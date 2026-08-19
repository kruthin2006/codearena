import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const ProblemList = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/problems', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProblems(response.data.problems || []);
    } catch (error) {
      console.error('Error fetching problems:', error);
      toast.error('Failed to load problems');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': 
        return { bg: '#d4edda', color: '#155724', border: '#28a745', icon: '🟢' };
      case 'Medium': 
        return { bg: '#fff3cd', color: '#856404', border: '#ffc107', icon: '🟡' };
      case 'Hard': 
        return { bg: '#f8d7da', color: '#721c24', border: '#dc3545', icon: '🔴' };
      default: 
        return { bg: '#e2e3e5', color: '#383d41', border: '#6c757d', icon: '⚪' };
    }
  };

  const handleProblemClick = (problemId) => {
    navigate(`/problems/${problemId}`);
  };

  const handleDelete = async (e, problemId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this problem?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/problems/${problemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Problem deleted!');
      fetchProblems();
    } catch (error) {
      toast.error('Failed to delete problem');
    }
  };

  const canDelete = user?.role === 'admin' || user?.role === 'setter';

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div className="spinner"></div>
        <p>Loading problems...</p>
      </div>
    );
  }

  const cardColors = [
    { gradient: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', shadow: 'rgba(30, 60, 114, 0.4)' },
    { gradient: 'linear-gradient(135deg, #0f3443 0%, #34e89e 100%)', shadow: 'rgba(52, 232, 158, 0.3)' },
    { gradient: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)', shadow: 'rgba(241, 39, 17, 0.3)' },
    { gradient: 'linear-gradient(135deg, #0c3483 0%, #a2b6df 100%)', shadow: 'rgba(12, 52, 131, 0.3)' },
    { gradient: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)', shadow: 'rgba(52, 152, 219, 0.3)' },
    { gradient: 'linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%)', shadow: 'rgba(74, 0, 224, 0.3)' },
    { gradient: 'linear-gradient(135deg, #00b09b 0%, #96c93d 100%)', shadow: 'rgba(0, 176, 155, 0.3)' },
    { gradient: 'linear-gradient(135deg, #ff6a00 0%, #ee0979 100%)', shadow: 'rgba(238, 9, 121, 0.3)' },
    { gradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 0%, #24243e 100%)', shadow: 'rgba(48, 43, 99, 0.3)' },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📚 Problems</h1>
        <p style={styles.subtitle}>Solve coding problems and improve your skills</p>
      </div>

      <div style={styles.list}>
        {problems.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>📭</span>
            <p>No problems available</p>
          </div>
        ) : (
          problems.map((problem, index) => {
            const diff = getDifficultyColor(problem.difficulty);
            const color = cardColors[index % cardColors.length];

            return (
              <div
                key={problem._id}
                style={{
                  ...styles.problemRow,
                  background: color.gradient,
                  boxShadow: `0 8px 32px ${color.shadow}`,
                }}
                onClick={() => handleProblemClick(problem._id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.01)';
                  e.currentTarget.style.boxShadow = `0 16px 48px ${color.shadow}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = `0 8px 32px ${color.shadow}`;
                }}
              >
                <div style={styles.cardContent}>
                  <div style={styles.leftSection}>
                    <div style={styles.problemNumber}>#{index + 1}</div>
                    <div style={styles.problemInfo}>
                      <div style={styles.problemTitle}>{problem.title}</div>
                      <div style={styles.problemMeta}>
                        <span style={{
                          ...styles.difficultyBadge,
                          background: diff.bg,
                          color: diff.color,
                          border: `1px solid ${diff.border}`,
                        }}>
                          {diff.icon} {problem.difficulty || 'Easy'}
                        </span>
                        <span style={styles.problemId}>📌 ID: {problem._id}</span>
                        <span style={styles.problemDate}>
                          📅 {new Date(problem.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={styles.rightSection}>
                    {canDelete && (
                      <button
                        style={styles.deleteBtn}
                        onClick={(e) => handleDelete(e, problem._id)}
                        title="Delete Problem"
                      >
                        🗑️
                      </button>
                    )}
                    <button style={styles.solveButton}>
                      Solve →
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '30px',
    maxWidth: '1000px',
    margin: '0 auto',
    minHeight: '100vh',
    background: '#f5f7fa',
  },
  header: {
    marginBottom: '30px',
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
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  problemRow: {
    borderRadius: '18px',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    border: '1px solid rgba(255,255,255,0.2)',
    position: 'relative',
  },
  cardContent: {
    padding: '24px 28px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.12)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '18px',
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '22px',
    flex: 1,
  },
  problemNumber: {
    fontSize: '16px',
    fontWeight: 700,
    color: 'white',
    background: 'rgba(255,255,255,0.2)',
    padding: '6px 18px',
    borderRadius: '24px',
    textAlign: 'center',
    backdropFilter: 'blur(5px)',
    border: '1px solid rgba(255,255,255,0.2)',
    minWidth: '55px',
  },
  problemInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  problemTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: 'white',
    textShadow: '0 2px 4px rgba(0,0,0,0.15)',
  },
  problemMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flexWrap: 'wrap',
  },
  difficultyBadge: {
    padding: '3px 16px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
    backdropFilter: 'blur(5px)',
  },
  problemId: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.85)',
    fontWeight: 500,
  },
  problemDate: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.75)',
    fontWeight: 400,
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  deleteBtn: {
    background: 'rgba(255,255,255,0.15)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.2)',
    padding: '8px 14px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(5px)',
  },
  solveButton: {
    padding: '10px 32px',
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(5px)',
    letterSpacing: '0.5px',
    textShadow: '0 1px 2px rgba(0,0,0,0.1)',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#999',
    background: 'white',
    borderRadius: '14px',
  },
  emptyIcon: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '12px',
  },
};

const style = document.createElement('style');
style.textContent = `
  .problem-row:hover .solve-button {
    transform: scale(1.05);
    background: rgba(255,255,255,0.3);
  }
  .problem-row:hover .delete-btn {
    background: rgba(255,255,255,0.25);
  }
`;
document.head.appendChild(style);

export default ProblemList;