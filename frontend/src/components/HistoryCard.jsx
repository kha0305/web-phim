import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const HistoryCard = ({ movie }) => {
  const { t } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);

  // Calculate percentage
  const duration = movie.durationTotal || 1;
  const progress = movie.progress || 0;
  const percent = Math.min(100, Math.max(0, (progress / duration) * 100));

  // Determine label
  let timeLeftLabel = '';
  if (duration > 0 && progress > 0) {
    const leftSeconds = duration - progress;
    if (leftSeconds < 60) {
      timeLeftLabel = t('just_started') || "< 1m left";
    } else {
      const leftMins = Math.ceil(leftSeconds / 60);
      timeLeftLabel = `${leftMins}m left`;
    }
  }

  return (
    <div 
      className="history-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/movie/${movie.slug}`} className="history-card-link">
        <div className="history-card-poster-wrapper">
          <img 
            src={movie.thumb_url || movie.poster_url} 
            alt={movie.name} 
            className="history-card-poster"
            loading="lazy"
          />
          {/* Progress Overlay */}
          <div className="history-progress-container">
            <div className="history-progress-bar" style={{ width: `${percent}%` }}></div>
          </div>
          
          {/* Play Icon Overlay */}
          <div className={`history-play-overlay ${isHovered ? 'visible' : ''}`}>
            <svg viewBox="0 0 24 24" fill="white" width="48" height="48">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
        
        <div className="history-card-info">
          <h4 className="history-card-title" title={movie.name}>{movie.name}</h4>
          <div className="history-card-meta">
            {movie.lastEpisodeName ? (
               <span className="episode-badge">{movie.lastEpisodeName}</span>
            ) : null}
            <span className="time-left">{timeLeftLabel}</span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default HistoryCard;
