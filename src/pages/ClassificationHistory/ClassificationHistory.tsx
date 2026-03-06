import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getClassificationHistory } from '../../services/classificationService';
import './ClassificationHistory.css';

interface Classification {
  id: string;
  cancerType: string;
  predictedClass: string;
  confidence: number;
  timestamp: any;
  createdAt: string;
}

const ClassificationHistory: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<Classification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getClassificationHistory(user.uid);
      setHistory(data as Classification[]);
      setError(null);
    } catch (err) {
      setError('Failed to load classification history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    try {
      // Handle Firestore timestamp
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleString();
      }
      // Handle ISO string
      return new Date(timestamp).toLocaleString();
    } catch {
      return 'N/A';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return '#4caf50';
    if (confidence >= 60) return '#ff9800';
    return '#f44336';
  };

  const getCancerIcon = (cancerType: string) => {
    if (cancerType.includes('Brain')) return 'fas fa-brain';
    if (cancerType.includes('Lung')) return 'fas fa-lungs';
    if (cancerType.includes('Skin')) return 'fas fa-hand-holding-medical';
    return 'fas fa-microscope';
  };

  if (loading) {
    return (
      <div className="history-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-container">
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i>
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="history-container">
      <div className="history-header">
        <h1><i className="fas fa-history"></i> Classification History</h1>
        <p className="subtitle">View your previous cancer classification results</p>
      </div>

      {history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="fas fa-folder-open" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
          </div>
          <h3>No classifications yet</h3>
          <p>Upload an image in the classification page to get started</p>
          <button 
            className="primary-btn"
            onClick={() => window.location.href = '/classification'}
          >
            <i className="fas fa-microscope"></i> Go to Classification
          </button>
        </div>
      ) : (
        <div className="history-list">
          {history.map((item) => (
            <div key={item.id} className="history-card">
              <div className="history-card-header">
                <div className="cancer-type-badge">
                  <i className={getCancerIcon(item.cancerType)}></i> {item.cancerType}
                </div>
                <div className="timestamp">{formatDate(item.timestamp)}</div>
              </div>

              <div className="history-card-body">
                <div className="result-info">
                  <h3>Predicted: {item.predictedClass}</h3>
                  <div 
                    className="confidence-badge"
                    style={{ backgroundColor: getConfidenceColor(item.confidence) }}
                  >
                    {item.confidence.toFixed(2)}% Confidence
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassificationHistory;
