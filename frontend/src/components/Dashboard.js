import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/problems', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProblems(response.data.problems || []);
    } catch (error) {
      console.error('Error fetching problems:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* PROBLEMS LIST - CLEAN */}
      <div style={styles.problemsSection}>
        <h2 style={styles.sectionTitle}>📋 Problems</h2>

        <div style={styles.problemList}>
          {loading ? (
            <div style={styles.loadingText}>Loading...</div>
          ) : problems.length === 0 ? (
            <div style={styles.emptyState}>No problems available</div>
          ) : (
            problems.map((problem, index) => (
              <div
                key={problem._id}
                style={styles.problemRow}
                onClick={() => navigate(`/problems/${problem._id}`)}
              >
                <div style={styles.rowContent}>
                  <div style={styles.leftSection}>
                    <span style={styles.problemId}>#{index + 1}</span>
                    <span style={styles.problemTitle}>{problem.title}</span>
                  </div>
                  <div style={styles.rightSection}>
                    <span style={{
                      ...styles.difficultyBadge,
                      background:
                        problem.difficulty === 'Easy'
                          ? '#28a745'
                          : problem.difficulty === 'Medium'
                          ? '#ffc107'
                          : '#dc3545',
                      color: problem.difficulty === 'Medium' ? '#333' : 'white',
                    }}>
                      {problem.difficulty || 'Easy'}
                    </span>
                    <button style={styles.solveBtn}>Solve →</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f0f2f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },

  problemsSection: {
    padding: '24px 24px 24px 24px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#1a1a2e',
    marginBottom: '16px',
  },

  problemList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },

  problemRow: {
    background: 'white',
    borderRadius: '10px',
    padding: '14px 20px',
    border: '1px solid #e8e8e8',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
  },
  rowContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  problemId: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#aaa',
    minWidth: '40px',
  },
  problemTitle: {
    fontSize: '16px',
    fontWeight: 500,
    color: '#1a1a2e',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  difficultyBadge: {
    padding: '3px 14px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 600,
    color: 'white',
  },
  solveBtn: {
    padding: '6px 20px',
    background: '#FF8C00',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  loadingText: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
  },
};

export default Dashboard;