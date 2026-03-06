import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  classifyImage, 
  saveClassificationResult, 
  checkHealth,
  type CancerType,
  type ClassificationResult 
} from '../../services/classificationService';
import './CancerClassification.css';

const CancerClassification: React.FC = () => {
  const { user, userType } = useAuth();
  const navigate = useNavigate();
  
  const [selectedCancerType, setSelectedCancerType] = useState<CancerType>('brain');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isApiHealthy, setIsApiHealthy] = useState<boolean | null>(null);
  const [showProbabilities, setShowProbabilities] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check API health on component mount
  React.useEffect(() => {
    checkHealth().then(setIsApiHealthy);
  }, []);

  // Cancer type information
  const cancerTypes = {
    brain: {
      name: 'Brain Tumor',
      description: 'Classify brain MRI scans for tumor detection',
      iconClass: 'fas fa-brain',
      classes: ['Glioma', 'Meningioma', 'No Tumor', 'Pituitary']
    },
    lung: {
      name: 'Lung Cancer',
      description: 'Classify lung histopathology images',
      iconClass: 'fas fa-lungs',
      classes: ['Adenocarcinoma', 'Benign Tissue', 'Squamous Cell Carcinoma']
    },
    skin: {
      name: 'Skin Cancer',
      description: 'Classify skin lesion images',
      iconClass: 'fas fa-hand-holding-medical',
      classes: [
        'Actinic Keratoses',
        'Basal Cell Carcinoma',
        'Benign Keratosis',
        'Dermatofibroma',
        'Melanocytic Nevi',
        'Melanoma',
        'Vascular Lesions'
      ]
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setResult(null);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setError(null);
      setResult(null);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleClassify = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    if (!user) {
      setError('You must be logged in to classify images');
      return;
    }

    setIsClassifying(true);
    setError(null);
    setResult(null);

    try {
      const response = await classifyImage(selectedFile, selectedCancerType);

      if (response.success && response.result) {
        setResult(response.result);
        
        // Save result to Firestore
        if (userType) {
          await saveClassificationResult(
            user.uid,
            userType as 'patient' | 'doctor',
            response.result,
            previewUrl || undefined
          );
        }
      } else {
        setError(response.error || 'Classification failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsClassifying(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setShowProbabilities(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return '#4caf50';
    if (confidence >= 60) return '#ff9800';
    return '#f44336';
  };

  if (isApiHealthy === false) {
    return (
      <div className="classification-container">
        <div className="api-error">
          <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem', marginBottom: '1rem' }}></i>
          <h2>API Server Not Available</h2>
          <p>The classification server is not running. Please start it with:</p>
          <code>cd backend && python app.py</code>
        </div>
      </div>
    );
  }

  return (
    <div className="classification-container">
      <div className="classification-header">
        <div className="header-top">
          <button 
            className="back-to-dashboard-btn" 
            onClick={() => navigate(userType === 'doctor' ? '/doctor-dashboard' : '/patient-dashboard')}
          >
            <i className="fas fa-arrow-left"></i> Back to Dashboard
          </button>
        </div>
        <h1><i className="fas fa-microscope"></i> Cancer Classification</h1>
        <p className="subtitle">
          Upload medical images for AI-powered cancer detection and classification
        </p>
      </div>

      {/* Cancer Type Selection */}
      <div className="cancer-type-selector">
        <h2>Select Cancer Type</h2>
        <div className="cancer-type-cards">
          {(Object.keys(cancerTypes) as CancerType[]).map((type) => (
            <div
              key={type}
              className={`cancer-type-card ${selectedCancerType === type ? 'active' : ''}`}
              onClick={() => {
                setSelectedCancerType(type);
                handleReset();
              }}
            >
              <div className="cancer-type-icon">
                <i className={cancerTypes[type].iconClass}></i>
              </div>
              <h3>{cancerTypes[type].name}</h3>
              <p>{cancerTypes[type].description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Image Upload Area */}
      <div className="upload-section">
        <h2>Upload Image</h2>
        
        <div
          className="upload-area"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          {previewUrl ? (
            <div className="image-preview">
              <img src={previewUrl} alt="Preview" />
              <button className="remove-btn" onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}>
                ✕
              </button>
            </div>
          ) : (
            <div className="upload-placeholder">
              <div className="upload-icon">
                <i className="fas fa-cloud-upload-alt"></i>
              </div>
              <p>Click to upload or drag and drop</p>
              <span>PNG, JPG, JPEG, BMP, TIFF (max 16MB)</span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/bmp,image/tiff"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>

        {selectedFile && (
          <div className="file-info">
            <span><i className="fas fa-paperclip"></i> {selectedFile.name}</span>
            <span>{(selectedFile.size / 1024).toFixed(2)} KB</span>
          </div>
        )}

        <button
          className="classify-btn"
          onClick={handleClassify}
          disabled={!selectedFile || isClassifying}
        >
          {isClassifying ? (
            <>
              <span className="spinner"></span>
              Classifying...
            </>
          ) : (
            <>
              <i className="fas fa-search"></i> Classify Image
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="results-section">
          <h2><i className="fas fa-chart-bar"></i> Classification Results</h2>
          
          <div className="result-main">
            <div className="result-header">
              <h3>Predicted: {result.predicted_class}</h3>
            </div>
            
            <div className="cancer-type-badge">
              <i className={cancerTypes[selectedCancerType].iconClass}></i> {result.cancer_type}
            </div>
          </div>

          {!showProbabilities && (
            <div className="show-probabilities-section">
              <button 
                className="show-probabilities-btn"
                onClick={() => setShowProbabilities(true)}
              >
                <i className="fas fa-chart-pie"></i> View Detailed Probability Distribution
              </button>
            </div>
          )}

          {showProbabilities && (
            <div className="probabilities-section">
              <h3>Detailed Probability Distribution</h3>
              
              <div className="confidence-display">
                <span className="confidence-label">Confidence Level:</span>
                <div 
                  className="confidence-badge-inline"
                  style={{ backgroundColor: getConfidenceColor(result.confidence) }}
                >
                  {result.confidence.toFixed(2)}%
                </div>
              </div>

              <div className="probability-bars">
                {Object.entries(result.all_probabilities)
                  .sort((a, b) => b[1] - a[1])
                  .map(([className, probability]) => (
                    <div key={className} className="probability-bar-container">
                      <div className="probability-label">
                        <span>{className}</span>
                        <span>{probability.toFixed(2)}%</span>
                      </div>
                      <div className="probability-bar-bg">
                        <div
                          className="probability-bar-fill"
                          style={{
                            width: `${probability}%`,
                            backgroundColor: className === result.predicted_class
                              ? '#4caf50'
                              : '#e0e0e0'
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
              </div>
              <button 
                className="hide-probabilities-btn"
                onClick={() => setShowProbabilities(false)}
              >
                <i className="fas fa-chevron-up"></i> Hide Probability Distribution
              </button>
            </div>
          )}

          <div className="result-actions">
            <button className="secondary-btn" onClick={handleReset}>
              <i className="fas fa-redo"></i> Classify Another Image
            </button>
          </div>
        </div>
      )}

      {/* Information Panel */}
      <div className="info-panel">
        <h3><i className="fas fa-info-circle"></i> About {cancerTypes[selectedCancerType].name} Classification</h3>
        <p>
          This model can detect the following classes:
        </p>
        <ul>
          {cancerTypes[selectedCancerType].classes.map((cls) => (
            <li key={cls}>{cls}</li>
          ))}
        </ul>
        <div className="disclaimer">
          <i className="fas fa-exclamation-triangle"></i>
          <strong>Disclaimer:</strong> This tool is for educational and research purposes only. 
          It should not be used as a substitute for professional medical advice, diagnosis, or treatment. 
          Always consult with qualified healthcare professionals for medical decisions.
        </div>
      </div>
    </div>
  );
};

export default CancerClassification;
