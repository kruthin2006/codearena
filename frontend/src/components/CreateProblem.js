import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const CreateProblem = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [problem, setProblem] = useState({
    title: '',
    description: '',
    sampleInput: '',
    sampleOutput: '',
    constraints: '',
    difficulty: 'Easy',
    testCases: [{ input: '', output: '' }]
  });

  const handleChange = (e) => {
    setProblem({ ...problem, [e.target.name]: e.target.value });
    setError('');
  };

  const handleTestCaseChange = (index, field, value) => {
    const newTestCases = [...problem.testCases];
    newTestCases[index][field] = value;
    setProblem({ ...problem, testCases: newTestCases });
    setError('');
  };

  const addTestCase = () => {
    setProblem({
      ...problem,
      testCases: [...problem.testCases, { input: '', output: '' }]
    });
  };

  const removeTestCase = (index) => {
    if (problem.testCases.length <= 1) {
      setError('Must have at least one test case');
      return;
    }
    const newTestCases = problem.testCases.filter((_, i) => i !== index);
    setProblem({ ...problem, testCases: newTestCases });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate
    if (!problem.title.trim()) {
      setError('Title is required');
      setLoading(false);
      return;
    }
    if (!problem.description.trim()) {
      setError('Description is required');
      setLoading(false);
      return;
    }
    if (!problem.sampleInput.trim()) {
      setError('Sample input is required');
      setLoading(false);
      return;
    }
    if (!problem.sampleOutput.trim()) {
      setError('Sample output is required');
      setLoading(false);
      return;
    }
    if (!problem.constraints.trim()) {
      setError('Constraints are required');
      setLoading(false);
      return;
    }

    // Validate test cases
    for (let i = 0; i < problem.testCases.length; i++) {
      if (!problem.testCases[i].input.trim() || !problem.testCases[i].output.trim()) {
        setError(`Test case ${i + 1} has empty input or output`);
        setLoading(false);
        return;
      }
    }

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/admin/problems`, problem, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert('✅ Problem created successfully!');
        navigate('/problems');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating problem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Navigation */}
      <nav style={styles.nav}>
        <div style={styles.navLeft}>
          <h1 style={styles.logo}>⚡ CodeArena</h1>
          <span style={styles.navSubtitle}>Create Problem</span>
        </div>
        <div style={styles.navRight}>
          <button onClick={() => navigate('/problems')} style={styles.navButton}>
            📚 Problems
          </button>
          <button onClick={() => navigate('/')} style={styles.navButton}>
            🏠 Dashboard
          </button>
        </div>
      </nav>

      <div style={styles.formContainer}>
        <div style={styles.header}>
          <h1 style={styles.title}>➕ Create New Problem</h1>
          <p style={styles.subtitle}>Fill in the details to add a new coding problem</p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Basic Information */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>📋 Basic Information</h3>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Problem Title *</label>
              <input
                type="text"
                name="title"
                value={problem.title}
                onChange={handleChange}
                placeholder="Enter problem title"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description *</label>
              <textarea
                name="description"
                value={problem.description}
                onChange={handleChange}
                placeholder="Describe the problem in detail"
                style={styles.textarea}
                rows={5}
                required
              />
            </div>

            <div style={styles.row}>
              <div style={{...styles.formGroup, flex: 1}}>
                <label style={styles.label}>Sample Input *</label>
                <textarea
                  name="sampleInput"
                  value={problem.sampleInput}
                  onChange={handleChange}
                  placeholder="Sample input"
                  style={styles.textarea}
                  rows={3}
                  required
                />
              </div>
              <div style={{...styles.formGroup, flex: 1}}>
                <label style={styles.label}>Sample Output *</label>
                <textarea
                  name="sampleOutput"
                  value={problem.sampleOutput}
                  onChange={handleChange}
                  placeholder="Sample output"
                  style={styles.textarea}
                  rows={3}
                  required
                />
              </div>
            </div>

            <div style={styles.row}>
              <div style={{...styles.formGroup, flex: 2}}>
                <label style={styles.label}>Constraints *</label>
                <textarea
                  name="constraints"
                  value={problem.constraints}
                  onChange={handleChange}
                  placeholder="e.g., 1 <= n <= 10^5, time limit: 2s"
                  style={styles.textarea}
                  rows={2}
                  required
                />
              </div>
              <div style={{...styles.formGroup, flex: 1}}>
                <label style={styles.label}>Difficulty *</label>
                <select
                  name="difficulty"
                  value={problem.difficulty}
                  onChange={handleChange}
                  style={styles.select}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>
          </div>

          {/* Test Cases */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>🧪 Test Cases</h3>
            <p style={styles.sectionSubtitle}>Add test cases to validate solutions</p>

            {problem.testCases.map((testCase, index) => (
              <div key={index} style={styles.testCaseCard}>
                <div style={styles.testCaseHeader}>
                  <h4 style={styles.testCaseTitle}>Test Case {index + 1}</h4>
                  {problem.testCases.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTestCase(index)}
                      style={styles.removeButton}
                    >
                      ✕ Remove
                    </button>
                  )}
                </div>
                <div style={styles.row}>
                  <div style={{...styles.formGroup, flex: 1}}>
                    <label style={styles.label}>Input</label>
                    <textarea
                      value={testCase.input}
                      onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                      placeholder={`Input for test case ${index + 1}`}
                      style={styles.textarea}
                      rows={2}
                      required
                    />
                  </div>
                  <div style={{...styles.formGroup, flex: 1}}>
                    <label style={styles.label}>Expected Output</label>
                    <textarea
                      value={testCase.output}
                      onChange={(e) => handleTestCaseChange(index, 'output', e.target.value)}
                      placeholder={`Output for test case ${index + 1}`}
                      style={styles.textarea}
                      rows={2}
                      required
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addTestCase}
              style={styles.addButton}
            >
              ➕ Add Test Case
            </button>
          </div>

          {/* Submit */}
          <div style={styles.actions}>
            <button
              type="button"
              onClick={() => navigate('/problems')}
              style={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={styles.submitButton}
            >
              {loading ? 'Creating...' : '🚀 Create Problem'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f7fa'
  },
  nav: {
    background: 'white',
    padding: '15px 30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  logo: {
    color: '#1a73e8',
    fontSize: '24px',
    margin: 0
  },
  navSubtitle: {
    color: '#666',
    fontSize: '16px'
  },
  navRight: {
    display: 'flex',
    gap: '10px'
  },
  navButton: {
    padding: '8px 16px',
    background: '#f0f2f5',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  formContainer: {
    maxWidth: '900px',
    margin: '20px auto',
    padding: '0 20px'
  },
  header: {
    padding: '25px 30px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
    marginBottom: '20px'
  },
  title: {
    fontSize: '28px',
    marginBottom: '5px'
  },
  subtitle: {
    color: '#666',
    fontSize: '14px'
  },
  form: {
    background: 'white',
    borderRadius: '12px',
    padding: '30px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
  },
  section: {
    marginBottom: '30px'
  },
  sectionTitle: {
    fontSize: '18px',
    marginBottom: '5px',
    color: '#333'
  },
  sectionSubtitle: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '15px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    marginBottom: '15px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333'
  },
  input: {
    padding: '10px 15px',
    border: '2px solid #e1e5e9',
    borderRadius: '6px',
    fontSize: '14px',
    transition: 'border-color 0.3s'
  },
  textarea: {
    padding: '10px 15px',
    border: '2px solid #e1e5e9',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'monospace',
    resize: 'vertical',
    transition: 'border-color 0.3s'
  },
  select: {
    padding: '10px 15px',
    border: '2px solid #e1e5e9',
    borderRadius: '6px',
    fontSize: '14px',
    background: 'white'
  },
  row: {
    display: 'flex',
    gap: '15px',
    flexWrap: 'wrap'
  },
  testCaseCard: {
    background: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '12px',
    border: '1px solid #e9ecef'
  },
  testCaseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  testCaseTitle: {
    margin: 0,
    fontSize: '14px',
    color: '#333'
  },
  removeButton: {
    padding: '4px 12px',
    background: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  addButton: {
    padding: '10px 20px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    marginTop: '10px'
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '15px',
    paddingTop: '20px',
    borderTop: '2px solid #e9ecef',
    marginTop: '20px'
  },
  cancelButton: {
    padding: '10px 25px',
    background: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  submitButton: {
    padding: '10px 30px',
    background: '#1a73e8',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  error: {
    color: '#dc3545',
    padding: '12px',
    background: '#f8d7da',
    borderRadius: '6px',
    marginBottom: '15px',
    fontSize: '14px'
  }
};

export default CreateProblem;