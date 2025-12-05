import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="movie-card" style={{ pointerEvents: 'none' }}>
      <div className="skeleton skeleton-poster"></div>
      <div className="movie-info">
        <div className="skeleton skeleton-text"></div>
        <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
      </div>
    </div>
  );
};

export default SkeletonCard;
