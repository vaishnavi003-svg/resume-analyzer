// App.js
import React, { useState } from 'react';
import axios from 'axios';

// LIVE RENDER BACKEND URL
const API_URL = 'https://resume-analyzer-609s.onrender.com';

function App() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type !== 'application/pdf') {
      setError('Please select a PDF file.');
      setFile(null);
      return;
    }
    setError('');
    setFile(selected || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setReport(null);

    if (!file || !jobDescription.trim()) {
      setError('Please upload a PDF resume and paste a job description.');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobDescription', jobDescription);

    try {
      setLoading(true);
      // Live backend URL use ho raha hai yahan
      const response = await axios.post(`${API_URL}/api/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setReport(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score) => {
    if (score >= 75) return '#16a34a'; 
    if (score >= 50) return '#d97706'; 
    return '#dc2626';                  
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>AI Resume Analyzer</h1>
        <p style={styles.subtitle}>
          Upload your resume and paste a job description to see how well you match.
        </p>

        <form onSubmit={handleSubmit} style={styles.card}>
          <label style={styles.label}>Resume (PDF only)</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            style={styles.input}
          />

          <label style={styles.label}>Job Description</label>
          <textarea
            rows={10}
            placeholder="Paste the full job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            style={{ ...styles.input, resize: 'vertical' }}
          />

          <button type="submit" disabled={loading} style={styles.button(loading)}>
            {loading ? 'Analyzing... (this can take a few seconds)' : 'Analyze Resume'}
          </button>

          {error && <div style={styles.error}>{error}</div>}
        </form>

        {report && (
          <div style={{ ...styles.card, marginTop: 24 }}>
            <h2 style={{ marginTop: 0 }}>Analysis Report</h2>
            <p style={styles.filename}>File: {report.filename}</p>

            <div style={styles.scoreWrap}>
              <div style={{ ...styles.scoreCircle, borderColor: scoreColor(report.matchScore) }}>
                <span style={{ ...styles.scoreNumber, color: scoreColor(report.matchScore) }}>
                  {report.matchScore}
                </span>
                <span style={styles.scoreLabel}>/ 100</span>
              </div>
              <div>
                <h3 style={{ margin: 0 }}>Match Score</h3>
                <p style={{ margin: '4px 0 0', color: '#6b7280' }}>
                  How closely your resume matches this role
                </p>
              </div>
            </div>

            <h3>Summary</h3>
            <p style={styles.text}>{report.summary}</p>

            <h3>Missing Skills</h3>
            {report.missingSkills.length > 0 ? (
              <div style={styles.tagWrap}>
                {report.missingSkills.map((skill, i) => (
                  <span key={i} style={styles.tag}>{skill}</span>
                ))}
              </div>
            ) : (
              <p style={styles.text}>No major skill gaps found. 🎉</p>
            )}

            <h3>Suggestions</h3>
            {report.suggestions.length > 0 ? (
              <ul style={styles.list}>
                {report.suggestions.map((s, i) => (
                  <li key={i} style={styles.listItem}>{s}</li>
                ))}
              </ul>
            ) : (
              <p style={styles.text}>No suggestions.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f3f4f6', padding: '40px 16px', fontFamily: 'system-ui, sans-serif' },
  container: { maxWidth: 760, margin: '0 auto' },
  title: { textAlign: 'center', marginBottom: 4, color: '#111827' },
  subtitle: { textAlign: 'center', color: '#6b7280', marginBottom: 24 },
  card: { background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.08)' },
  label: { display: 'block', fontWeight: 600, margin: '16px 0 6px', color: '#374151' },
  input: { width: '100%', padding: 10, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' },
  button: (loading) => ({
    marginTop: 20, width: '100%', padding: 12, border: 'none', borderRadius: 8,
    background: loading ? '#9ca3af' : '#4f46e5', color: '#fff', fontSize: 16, fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer',
  }),
  error: { marginTop: 16, padding: 12, background: '#fee2e2', color: '#991b1b', borderRadius: 8 },
  filename: { color: '#6b7280', marginTop: -8 },
  scoreWrap: { display: 'flex', alignItems: 'center', gap: 20, margin: '16px 0 8px' },
  scoreCircle: { width: 100, height: 100, borderRadius: '50%', border: '8px solid', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  scoreNumber: { fontSize: 32, fontWeight: 700, lineHeight: 1 },
  scoreLabel: { fontSize: 12, color: '#6b7280' },
  text: { color: '#374151', lineHeight: 1.6 },
  tagWrap: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  tag: { background: '#fee2e2', color: '#991b1b', padding: '4px 12px', borderRadius: 999, fontSize: 14 },
  list: { paddingLeft: 20, margin: 0 },
  listItem: { marginBottom: 8, color: '#374151', lineHeight: 1.5 },
};

export default App;