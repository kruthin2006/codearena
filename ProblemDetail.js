import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';

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

  const fetchProblem = useCallback(async () => {
    try {
      const response = await api.get(`/problems/${id}`);
      setProblem(response.data.problem);
    } catch (error) {
      console.error('Error fetching problem:', error);
      navigate('/problems');
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchProblem();
    setCode(templates[language]);
  }, [language, fetchProblem]);

  const handleRun = async () => {
    setRunLoading(true);
    setOutput('');
    setError('');
    setSubmissionResult(null);

    try {
      const response = await api.post('/submissions/run', {
        problemId: id,
        code,
        language,
        input: customInput || problem?.sampleInput
      });

      if (response.data.error) {
        setError(response.data.error);
      } else {
        setOutput(response.data.output || '✅ Program executed successfully');
      }
    } catch (error) {
      console.error('Run error:', error);
      if (error.response?.status === 401) {
        setError('❌ Session expired. Please logout and login again.');
      } else {
        setError(error.response?.data?.message || 'Error running code');
      }
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
      const response = await api.post('/submissions/submit', {
        problemId: id,
        code,
        language
      });
      
      setSubmissionResult(response.data);
      
      if (response.data.status === 'accepted') {
        setOutput('🎉 All test cases passed!');
      } else {
        setOutput(`⚠️ ${response.data.passedTestCases}/${response.data.totalTestCases} passed`);
      }
    } catch (error) {
      console.error('Submit error:', error);
      if (error.response?.status === 401) {
        setError('❌ Session expired. Please logout and login again.');
      } else {
        setError(error.response?.data?.message || 'Error submitting code');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  if (!problem) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>{problem.title}</h1>
        <button onClick={() => navigate('/problems')} style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          ← Back
        </button>
      </div>

      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
        <p>{problem.description}</p>
        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '4px', margin: '10px 0' }}>
          <h4>Sample Input:</h4>
          <pre>{problem.sampleInput}</pre>
          <h4>Sample Output:</h4>
          <pre>{problem.sampleOutput}</pre>
        </div>
        <p><strong>Constraints:</strong> {problem.constraints}</p>
      </div>

      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <select value={language} onChange={(e) => { setLanguage(e.target.value); setCode(templates[e.target.value]); }} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
          <button onClick={handleRun} disabled={runLoading} style={{ padding: '8px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            {runLoading ? 'Running...' : '▶ Run'}
          </button>
          <button onClick={handleSubmit} disabled={submitLoading} style={{ padding: '8px 20px', background: '#1a73e8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            {submitLoading ? 'Submitting...' : '📤 Submit'}
          </button>
        </div>

        <textarea value={code} onChange={(e) => setCode(e.target.value)} style={{ width: '100%', fontFamily: 'monospace', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', minHeight: '200px' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '10px' }}>
          <div>
            <h4>Custom Input:</h4>
            <textarea value={customInput} onChange={(e) => setCustomInput(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} rows={3} />
          </div>
          <div>
            <h4>Output:</h4>
            <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', minHeight: '60px' }}>
              {error ? <span style={{ color: 'red' }}>{error}</span> : output || 'Run your code to see output'}
            </pre>
          </div>
        </div>

        {submissionResult && (
          <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
            <h3>Results</h3>
            <div>Score: <strong>{submissionResult.score.toFixed(1)}%</strong></div>
            <div>{submissionResult.passedTestCases} / {submissionResult.totalTestCases} passed</div>
            <div style={{ color: submissionResult.status === 'accepted' ? 'green' : 'red' }}>
              {submissionResult.status === 'accepted' ? '✅ Accepted' : '❌ Wrong Answer'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemDetail;