import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const ProblemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('java');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [submissionResult, setSubmissionResult] = useState(null);
  const [runLoading, setRunLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [loading, setLoading] = useState(true);

  const templates = {
    java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Write your code here
        
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    // Write your code here
    
    return 0;
}`
  };

  useEffect(() => {
    if (!id) {
      navigate('/problems');
      return;
    }

    const fetchProblem = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/problems/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProblem(response.data.problem);
        setCode(templates[language]);
      } catch (error) {
        console.error('❌ Error:', error);
        toast.error('Problem not found');
        navigate('/problems');
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
  }, [id]);

  const handleRun = async () => {
    setRunLoading(true);
    setOutput('');
    setError('');
    setSubmissionResult(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/submissions/run',
        {
          problemId: id,
          code,
          language,
          input: customInput || problem?.sampleInput
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.error) {
        setError(response.data.error);
      } else {
        setOutput(response.data.output || '✅ Program executed successfully');
      }
    } catch (error) {
      console.error('❌ Run error:', error);
      setError(error.response?.data?.message || 'Error running code');
    } finally {
      setRunLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitLoading(true);
    setOutput('');
    setError('');
    setSubmissionResult(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/submissions/submit',
        {
          problemId: id,
          code,
          language
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      console.log('📊 Submit response:', response.data);
      
      // ✅ Check if response has data before setting
      if (response.data && response.data.success) {
        setSubmissionResult(response.data);
        
        if (response.data.status === 'accepted') {
          setOutput('🎉 All test cases passed!');
          toast.success('🎉 All test cases passed!');
        } else {
          setOutput(`⚠️ ${response.data.passedTestCases || 0}/${response.data.totalTestCases || 0} passed`);
          toast.error(`❌ ${response.data.passedTestCases || 0}/${response.data.totalTestCases || 0} passed`);
        }
      } else {
        setError('Invalid response from server');
        toast.error('Submission failed');
      }
    } catch (error) {
      console.error('❌ Submit error:', error);
      setError(error.response?.data?.message || 'Error submitting code');
      toast.error('Error submitting code');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div className="spinner"></div>
        <p>Loading problem...</p>
      </div>
    );
  }

  if (!problem) {
    return (
      <div style={styles.loadingContainer}>
        <p>Problem not found</p>
        <button onClick={() => navigate('/problems')} style={styles.backButton}>
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.problemTitle}>{problem.title}</h1>
          <div style={styles.problemMeta}>
            <span style={{
              ...styles.difficultyBadge,
              backgroundColor: problem.difficulty === 'Easy' ? '#28a745' :
                             problem.difficulty === 'Medium' ? '#ffc107' : '#dc3545',
              color: problem.difficulty === 'Medium' ? '#333' : 'white'
            }}>
              {problem.difficulty || 'Easy'}
            </span>
            <span style={styles.problemId}>ID: {problem._id}</span>
          </div>
        </div>
        <button onClick={() => navigate('/problems')} style={styles.backButton}>
          ← Back
        </button>
      </div>

      <div style={styles.descriptionCard}>
        <h3>📖 Problem Statement</h3>
        <p>{problem.description}</p>
        <div style={styles.sampleSection}>
          <div>
            <h4>Sample Input:</h4>
            <pre>{problem.sampleInput}</pre>
          </div>
          <div>
            <h4>Sample Output:</h4>
            <pre>{problem.sampleOutput}</pre>
          </div>
        </div>
        <div style={styles.constraints}>
          <h4>Constraints:</h4>
          <p>{problem.constraints}</p>
        </div>
      </div>

      <div style={styles.editorCard}>
        <div style={styles.editorControls}>
          <select
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              setCode(templates[e.target.value]);
            }}
            style={styles.select}
          >
            <option value="java">☕ Java</option>
            <option value="cpp">⚡ C++</option>
          </select>
          <div>
            <button onClick={handleRun} disabled={runLoading} style={styles.runButton}>
              {runLoading ? '⏳ Running...' : '▶ Run'}
            </button>
            <button onClick={handleSubmit} disabled={submitLoading} style={styles.submitButton}>
              {submitLoading ? '⏳ Submitting...' : '📤 Submit'}
            </button>
          </div>
        </div>

        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={styles.editor}
          spellCheck={false}
        />

        <div style={styles.inputOutputSection}>
          <div>
            <h4>📝 Custom Input:</h4>
            <textarea
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              style={styles.customInput}
              rows={3}
            />
          </div>
          <div>
            <h4>📤 Output:</h4>
            <div style={styles.outputBox}>
              {error ? (
                <pre style={{ color: 'red' }}>{error}</pre>
              ) : (
                <pre>{output || 'Run your code to see output'}</pre>
              )}
            </div>
          </div>
        </div>

        {submissionResult && submissionResult.results && (
          <div style={styles.resultSection}>
            <h3>📊 Results</h3>
            <div style={{
              ...styles.resultSummary,
              ...(submissionResult.status === 'accepted' ? styles.resultAccepted : styles.resultFailed)
            }}>
              <div>Score: <strong>{submissionResult.score ? submissionResult.score.toFixed(1) : 0}%</strong></div>
              <div>{submissionResult.passedTestCases || 0} / {submissionResult.totalTestCases || 0} passed</div>
              <div>Status: {submissionResult.status === 'accepted' ? '✅ Accepted' : '❌ Wrong Answer'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f0f2f5',
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh'
  },
  header: {
    background: 'white',
    padding: '20px 30px',
    borderRadius: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
  },
  problemTitle: {
    fontSize: '24px',
    marginBottom: '8px',
    color: '#1a1a2e'
  },
  problemMeta: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center'
  },
  difficultyBadge: {
    padding: '4px 14px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600'
  },
  problemId: {
    color: '#999',
    fontSize: '14px'
  },
  backButton: {
    padding: '8px 20px',
    background: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  descriptionCard: {
    background: 'white',
    padding: '25px 30px',
    borderRadius: '12px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
  },
  sampleSection: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    margin: '15px 0'
  },
  constraints: {
    background: '#fff3cd',
    padding: '15px',
    borderRadius: '8px'
  },
  editorCard: {
    background: 'white',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
  },
  editorControls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    flexWrap: 'wrap',
    gap: '10px'
  },
  select: {
    padding: '8px 15px',
    border: '2px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    background: 'white'
  },
  runButton: {
    padding: '8px 20px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    marginRight: '10px'
  },
  submitButton: {
    padding: '8px 20px',
    background: '#1a73e8',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  editor: {
    width: '100%',
    minHeight: '300px',
    fontFamily: 'monospace',
    fontSize: '14px',
    padding: '15px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    background: '#1e1e1e',
    color: '#d4d4d4',
    resize: 'vertical'
  },
  inputOutputSection: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginTop: '20px'
  },
  customInput: {
    width: '100%',
    padding: '10px',
    border: '2px solid #ddd',
    borderRadius: '6px',
    fontFamily: 'monospace',
    fontSize: '14px',
    resize: 'vertical'
  },
  outputBox: {
    padding: '10px',
    border: '2px solid #ddd',
    borderRadius: '6px',
    minHeight: '80px',
    background: '#f8f9fa'
  },
  resultSection: {
    marginTop: '20px',
    padding: '20px',
    border: '2px solid #ddd',
    borderRadius: '8px'
  },
  resultSummary: {
    padding: '15px',
    borderRadius: '6px'
  },
  resultAccepted: {
    background: '#d4edda',
    border: '1px solid #c3e6cb'
  },
  resultFailed: {
    background: '#f8d7da',
    border: '1px solid #f5c6cb'
  }
};

export default ProblemDetail;