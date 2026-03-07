import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './GeminiConsult.css';

const GeminiConsult: React.FC = () => {
  const navigate = useNavigate();
  const [symptoms, setSymptoms] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!symptoms.trim()) return;

    setLoading(true);
    setError('');
    setResult('');

    try {
      const response = await fetch('http://localhost:5001/gemini-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symptoms: symptoms.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI feedback. Please try again.');
      }

      const data = await response.json();
      setResult(data.result);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Make sure the Gemini server is running on port 5001.');
    } finally {
      setLoading(false);
    }
  };

  // Simple markdown-to-HTML converter for the response
  const formatResult = (text: string) => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
      .replace(/<\/ul>\s*<ul>/g, '')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="gemini-consult-page">
      {/* Header */}
      <div className="gemini-header">
        <div className="gemini-header-left">
          <button className="gemini-back-btn" onClick={() => navigate('/doctor-dashboard')}>
            <i className="fas fa-arrow-left"></i>
            Back to Dashboard
          </button>
          <div className="gemini-header-title">
            <div className="gemini-icon-wrapper">
              <i className="fas fa-robot"></i>
            </div>
            <h1>Consult with Gemini</h1>
          </div>
        </div>
        <span className="gemini-badge">AI-Powered</span>
      </div>

      {/* Main Content */}
      <div className="gemini-content">
        {/* Hero */}
        <div className="gemini-hero">
          <h2>
            AI-Powered <span className="gradient-text">Diagnosis Assistant</span>
          </h2>
          <p>
            Enter patient symptoms below and Gemini AI will suggest possible diagnoses,
            recommended tests, and risk levels to support your clinical decisions.
          </p>
        </div>

        {/* Symptoms Input */}
        <div className="gemini-input-card">
          <label className="gemini-input-label">
            <i className="fas fa-stethoscope"></i>
            Patient Symptoms
          </label>
          <textarea
            className="gemini-textarea"
            placeholder="Describe the patient's symptoms in detail...&#10;&#10;Example: Persistent headache for 3 days, nausea, mild fever (99.5°F), sensitivity to light, stiff neck"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            disabled={loading}
          />
          <div className="gemini-input-footer">
            <span className="gemini-hint">
              <i className="fas fa-info-circle"></i>
              More detailed symptoms lead to better suggestions
            </span>
            <button
              className="gemini-submit-btn"
              onClick={handleSubmit}
              disabled={loading || !symptoms.trim()}
            >
              {loading ? (
                <>
                  <div className="gemini-loading-spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i>
                  Get AI Diagnosis
                </>
              )}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="gemini-loading">
            <div className="gemini-loading-spinner"></div>
            <p>
              Gemini AI is analyzing the symptoms
              <span className="gemini-loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="gemini-error">
            <i className="fas fa-exclamation-circle"></i>
            <p>{error}</p>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="gemini-results-card">
            <div className="gemini-results-header">
              <div className="gemini-results-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <div>
                <h3>AI Diagnosis Suggestions</h3>
                <span>Powered by Llama 3.2 (Ollama)</span>
              </div>
            </div>
            <div
              className="gemini-results-body"
              dangerouslySetInnerHTML={{ __html: formatResult(result) }}
            />
            <div className="gemini-disclaimer">
              <i className="fas fa-exclamation-triangle"></i>
              <p>
                <strong>Disclaimer:</strong> This AI-generated analysis is for informational purposes only
                and should not replace professional medical judgment. Always verify suggestions with
                clinical examination and diagnostic tests.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeminiConsult;
