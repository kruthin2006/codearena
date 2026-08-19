import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Submissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/submissions/user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // ✅ Fetch problem details for each submission
      const submissionsWithTitles = await Promise.all(
        (response.data.submissions || []).map(async (sub) => {
          try {
            const problemRes = await axios.get(`http://localhost:5000/api/problems/${sub.problem}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            return { ...sub, problemTitle: problemRes.data.problem?.title || 'Unknown Problem' };
          } catch {
            return { ...sub, problemTitle: 'Unknown Problem' };
          }
        })
      );
      
      setSubmissions(submissionsWithTitles);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const totalSubmissions = submissions.length;
  const accepted = submissions.filter(s => s.status === 'accepted').length;
  const successRate = totalSubmissions > 0 ? Math.round((accepted / totalSubmissions) * 100) : 0;

  const getStatusBadge = (status) => {
    if (status === 'accepted') {
      return { text: '✅ Accepted', style: styles.statusAccepted };
    }
    return { text: '❌ Wrong Answer', style: styles.statusFailed };
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div className="spinner"></div>
        <p>Loading submissions...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📊 My Submissions</h1>
        <p style={styles.subtitle}>Track your progress and coding journey</p>
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <span style={styles.statNumber}>{totalSubmissions}</span>
          <span style={styles.statLabel}>Total Submissions</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statNumber}>{accepted}</span>
          <span style={styles.statLabel}>Accepted</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statNumber}>{successRate}%</span>
          <span style={styles.statLabel}>Success Rate</span>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>📝</span>
          <h3>No submissions yet</h3>
          <p>Start solving problems to see your submissions here</p>
          <button onClick={() => navigate('/problems')} style={styles.startButton}>
            Browse Problems
          </button>
        </div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Problem</th>
                <th style={styles.th}>Language</th>
                <th style={styles.th}>Score</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => {
                const status = getStatusBadge(sub.status);
                return (
                  <tr key={sub._id} style={styles.tr}>
                    <td style={styles.td}>
                      <span 
                        style={styles.problemTitle}
                        onClick={() => navigate(`/problems/${sub.problem}`)}
                      >
                        {sub.problemTitle || 'Unknown Problem'}
                      </span>
                    </td>
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
                      <span style={status.style}>
                        {status.text}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
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
    fontFamily: 'Inter, -apple-system, sans-serif',
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
  statsRow: {
    display: 'flex',
    gap: '20px',
    marginBottom: '30px',
    flexWrap: 'wrap',
  },
  statCard: {
    background: 'white',
    padding: '20px 30px',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
    flex: 1,
    minWidth: '150px',
    textAlign: 'center',
    border: '1px solid #eef0f2',
  },
  statNumber: {
    display: 'block',
    fontSize: '28px',
    fontWeight: 700,
    color: '#1a1a2e',
  },
  statLabel: {
    fontSize: '14px',
    color: '#888',
    marginTop: '4px',
  },
  tableContainer: {
    background: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
    border: '1px solid #eef0f2',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '14px 20px',
    textAlign: 'left',
    background: '#f8f9fa',
    fontWeight: 600,
    color: '#555',
    fontSize: '13px',
    borderBottom: '2px solid #eef0f2',
  },
  td: {
    padding: '12px 20px',
    borderBottom: '1px solid #f0f0f0',
    fontSize: '14px',
  },
  tr: {
    transition: 'background 0.2s',
  },
  problemTitle: {
    fontWeight: 500,
    color: '#1a1a2e',
    cursor: 'pointer',
  },
  languageBadge: {
    padding: '3px 12px',
    background: '#eef0f2',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
  },
  scoreValue: {
    fontWeight: 600,
    color: '#6C63FF',
  },
  statusAccepted: {
    padding: '3px 12px',
    background: '#d4edda',
    color: '#155724',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
  },
  statusFailed: {
    padding: '3px 12px',
    background: '#f8d7da',
    color: '#721c24',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
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
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #eef0f2',
  },
  emptyIcon: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '12px',
  },
  startButton: {
    padding: '10px 30px',
    background: '#6C63FF',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '15px',
  },
};

export default Submissions;