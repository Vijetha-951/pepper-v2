import React, { useState, useEffect, useRef } from 'react';
import diseaseDetectionService from '../services/diseaseDetectionService';
import './DiseaseDetection.css';

const DiseaseDetection = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [diseasesInfo, setDiseasesInfo] = useState([]);
  const [showInfo, setShowInfo] = useState(false);
  const [metadata, setMetadata] = useState({
    plantAge: '',
    variety: '',
    notes: ''
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadHistory();
    loadDiseasesInfo();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await diseaseDetectionService.getHistory(10);
      if (response.success) {
        setHistory(response.detections || []);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const loadDiseasesInfo = async () => {
    try {
      const response = await diseaseDetectionService.getDiseasesInfo();
      if (response.success) {
        setDiseasesInfo(response.diseases || []);
      }
    } catch (error) {
      console.error('Failed to load diseases info:', error);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setPrediction(null);
      setError(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setPrediction(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await diseaseDetectionService.predictFromImage(selectedImage, metadata);

      if (result.success) {
        setPrediction(result.prediction);
        loadHistory(); // Refresh history
      } else {
        setError(result.error || 'Prediction failed');
      }
    } catch (error) {
      setError('Failed to analyze image. Please try again.');
      console.error('Analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setPrediction(null);
    setError(null);
    setMetadata({
      plantAge: '',
      variety: '',
      notes: ''
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getSeverityColor = (severity) => {
    const severityMap = {
      'None': 'green',
      'Low': 'lightgreen',
      'Low to Moderate': 'yellow',
      'Moderate': 'orange',
      'Moderate to High': 'darkorange',
      'High': 'red'
    };
    return severityMap[severity] || 'gray';
  };

  return (
    <div className="disease-detection-container">
      <div className="disease-detection-header">
        <h1>🌿 Pepper Leaves Disease Detection</h1>
        <p>Upload a photo of your pepper plant leaf to detect diseases and get treatment recommendations</p>
      </div>

      <div className="disease-detection-content">
        {/* Left Column - Upload & Analysis */}
        <div className="detection-main">
          {/* Upload Area */}
          <div 
            className="upload-area"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <div className="image-preview">
                <img src={imagePreview} alt="Leaf preview" />
              </div>
            ) : (
              <div className="upload-placeholder">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p>Click or drag image here</p>
                <span>Supports: JPG, PNG, GIF, BMP</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />
          </div>

          {/* Metadata Form */}
          {selectedImage && !prediction && (
            <div className="metadata-form">
              <h3>Additional Information (Optional)</h3>
              <div className="form-group">
                <label>Plant Age:</label>
                <input
                  type="text"
                  placeholder="e.g., 6 months"
                  value={metadata.plantAge}
                  onChange={(e) => setMetadata({ ...metadata, plantAge: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Variety:</label>
                <select
                  value={metadata.variety}
                  onChange={(e) => setMetadata({ ...metadata, variety: e.target.value })}
                >
                  <option value="">Select variety</option>
                  <option value="Panniyur 1">Panniyur 1</option>
                  <option value="Panniyur 5">Panniyur 5</option>
                  <option value="Karimunda">Karimunda</option>
                  <option value="Subhakara">Subhakara</option>
                  <option value="IISR Shakthi">IISR Shakthi</option>
                  <option value="IISR Thevam">IISR Thevam</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Notes:</label>
                <textarea
                  placeholder="Any additional observations..."
                  value={metadata.notes}
                  onChange={(e) => setMetadata({ ...metadata, notes: e.target.value })}
                  rows="3"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="action-buttons">
            {selectedImage && !prediction && (
              <>
                <button 
                  className="btn btn-primary"
                  onClick={handleAnalyze}
                  disabled={loading}
                >
                  {loading ? 'Analyzing...' : '🔬 Analyze Image'}
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={handleReset}
                  disabled={loading}
                >
                  Reset
                </button>
              </>
            )}
            {prediction && (
              <button 
                className="btn btn-primary"
                onClick={handleReset}
              >
                ➕ Analyze Another Image
              </button>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Analyzing your image...</p>
            </div>
          )}

          {/* Prediction Results */}
          {prediction && (
            <div className="prediction-results">
              <h2>🔬 Analysis Results</h2>
              
              <div className="result-summary">
                <div className="result-item">
                  <span className="result-label">Disease:</span>
                  <span className="result-value disease-name">{prediction.disease_info?.name}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">Confidence:</span>
                  <span className="result-value confidence">
                    {prediction.confidence.toFixed(1)}%
                  </span>
                </div>
                <div className="result-item">
                  <span className="result-label">Severity:</span>
                  <span 
                    className="result-value severity"
                    style={{ color: getSeverityColor(prediction.disease_info?.severity) }}
                  >
                    {prediction.disease_info?.severity}
                  </span>
                </div>
              </div>

              <div className="result-description">
                <h3>Description</h3>
                <p>{prediction.disease_info?.description}</p>
              </div>

              {prediction.disease_info?.treatment && prediction.disease_info.treatment.length > 0 && (
                <div className="result-section">
                  <h3>💊 Treatment Recommendations</h3>
                  <ul>
                    {prediction.disease_info.treatment.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {prediction.disease_info?.prevention && prediction.disease_info.prevention.length > 0 && (
                <div className="result-section">
                  <h3>🛡️ Prevention Tips</h3>
                  <ul>
                    {prediction.disease_info.prevention.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {prediction.all_predictions && (
                <div className="result-section">
                  <h3>📊 All Predictions</h3>
                  <div className="probability-bars">
                    {prediction.all_predictions.map((pred, index) => (
                      <div key={index} className="probability-item">
                        <span className="prob-label">{pred.disease}</span>
                        <div className="prob-bar-container">
                          <div 
                            className="prob-bar"
                            style={{ width: `${pred.probability}%` }}
                          />
                        </div>
                        <span className="prob-value">{pred.probability.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Info & History */}
        <div className="detection-sidebar">
          {/* Disease Info */}
          <div className="info-section">
            <h3 onClick={() => setShowInfo(!showInfo)} style={{ cursor: 'pointer' }}>
              ℹ️ About Disease Detection {showInfo ? '▼' : '▶'}
            </h3>
            {showInfo && (
              <div className="info-content">
                <p>Our AI-powered system can detect the following conditions:</p>
                <ul>
                  {diseasesInfo.map((disease, index) => (
                    <li key={index}>
                      <strong>{disease.name}</strong>
                      <br />
                      <small>{disease.description}</small>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Detection History */}
          {history.length > 0 && (
            <div className="history-section">
              <h3>📜 Recent Detections</h3>
              <div className="history-list">
                {history.slice(0, 5).map((item, index) => (
                  <div key={index} className="history-item">
                    <div className="history-header">
                      <span className="history-disease">{item.prediction}</span>
                      <span className="history-confidence">{item.confidence}%</span>
                    </div>
                    <div className="history-date">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiseaseDetection;
