// Example React Component for Product Page
// Copy this pattern to your actual product detail component

import React, { useState, useEffect } from 'react';
import SeasonalSuitabilityHelper from '../utils/seasonalSuitability';

const ProductSeasonalRecommendation = ({ product, userLocation }) => {
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const helper = new SeasonalSuitabilityHelper();

  useEffect(() => {
    loadRecommendation();
  }, [product._id]);

  const loadRecommendation = async () => {
    setLoading(true);
    const data = await helper.getRecommendation(product, userLocation);
    setRecommendation(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="seasonal-recommendation-loading">
        <div className="spinner-border" role="status">
          <span className="sr-only">Loading recommendation...</span>
        </div>
      </div>
    );
  }

  if (!recommendation) {
    return null;
  }

  const getBadgeClass = () => {
    const classes = {
      success: 'alert-success',
      warning: 'alert-warning',
      danger: 'alert-danger'
    };
    return classes[recommendation.badge] || 'alert-info';
  };

  return (
    <div className={`seasonal-recommendation alert ${getBadgeClass()}`}>
      <div className="d-flex justify-content-between align-items-start">
        <div>
          <h5 className="alert-heading">
            <span className="me-2">{recommendation.icon}</span>
            {recommendation.title}
          </h5>
          <span className="badge bg-secondary">{recommendation.confidence} Confidence</span>
        </div>
      </div>
      
      <p className="mt-3">{recommendation.description}</p>
      
      <div className="mt-3">
        <h6>Growing Tips:</h6>
        <ul className="mb-0">
          {recommendation.tips.map((tip, index) => (
            <li key={index}>{tip}</li>
          ))}
        </ul>
      </div>

      <small className="text-muted d-block mt-2">
        Recommendation for {recommendation.technicalData.month} in {recommendation.technicalData.district}
      </small>
    </div>
  );
};

export default ProductSeasonalRecommendation;

// Usage in ProductDetail component:
// <ProductSeasonalRecommendation 
//   product={product} 
//   userLocation={{ district: 'Kottayam', pincode: 686001 }}
// />
