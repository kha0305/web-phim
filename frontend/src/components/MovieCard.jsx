
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

const MovieCard = React.memo(({ movie, priority = false }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const { favorites, toggleFavorite } = useAuth();
  const imageUrl = movie.poster_url || movie.thumb_url || 'https://via.placeholder.com/500x750?text=No+Image';
  const title = movie.name || movie.title;
  let year = movie.year;
  
  const originName = movie.origin_name || '';

  // Check category for year if missing
  if (!year && movie.category) {
    // Look for category containing a year (e.g., "Năm 2024" or just "2024")
    const yearCat = movie.category.find(cat => cat.name && /\b\d{4}\b/.test(cat.name));
    if (yearCat) {
      const match = yearCat.name.match(/(\d{4})/);
      if (match) year = match[1];
    }
  }

  const getYearFromDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date.getFullYear();
  };

  if (!year) year = getYearFromDate(movie.publish_date);
  if (!year) year = getYearFromDate(movie.release_date);

  // Regex from title/slug/originName (Higher priority than update times)
  if (!year) {
    const titleYearMatch = title ? title.match(/\((\d{4})\)/) : null;
    const slugYearMatch = movie.slug ? movie.slug.match(/-(\d{4})/) : null;
    const originYearMatch = originName ? originName.match(/\b(\d{4})\b/) : null;
    
    if (titleYearMatch) {
      year = titleYearMatch[1];
    } else if (slugYearMatch) {
      year = slugYearMatch[1];
    } else if (originYearMatch) {
      year = originYearMatch[1];
    } else if (title) {
      // Last resort regex: try to find any 4-digit year in title
      const looseMatch = title.match(/\b(19\d{2}|20\d{2})\b/);
      if (looseMatch) year = looseMatch[1];
    }
  }

  if (!year) year = getYearFromDate(movie.created_time);
  if (!year) year = getYearFromDate(movie.created);
  if (!year) year = getYearFromDate(movie.createdAt);
  
  // Update times as last resort
  if (!year) year = getYearFromDate(movie.updated_time);
  if (!year && movie.modified && movie.modified.time) year = getYearFromDate(movie.modified.time);
  
  // Fallback to empty string if no year found
  if (!year) year = '';

  const duration = movie.time && movie.time !== '0' ? movie.time.replace(' phút', 'p') : '';
  const episode = movie.episode_current || '';
  const metaText = [episode, duration].filter(Boolean).join(' • ');


  
  // Use slug if available, otherwise fallback to _id or id
  const identifier = movie.slug || movie._id || movie.id;
  const link = `/movie/${identifier}`;
  const isFavorite = favorites.includes(identifier);

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(identifier);
  };



  return (
    <div className="movie-card-wrapper" style={{position: 'relative'}}>
      <Link to={link} className="movie-card">
        <div className="image-container" style={{ position: 'relative', width: '100%', aspectRatio: '2/3', background: '#2a2a2a', borderRadius: '8px', overflow: 'hidden' }}>
          {!isLoaded && (
            <div className="skeleton" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
          )}
          <img 
            src={imageUrl} 
            alt={title} 
            className="movie-poster" 
            loading={priority ? "eager" : "lazy"}
            onLoad={() => setIsLoaded(true)}
            style={{ 
              opacity: isLoaded ? 1 : 0, 
              transition: 'opacity 0.3s ease',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }} 
          />
          {/* Year Badge */}
          {year && (
            <div style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              background: '#ffc107',
              color: '#000',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              zIndex: 5,
              boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}>
              {year}
            </div>
          )}
        </div>
        
        <div className="movie-info" style={{ padding: '12px' }}>
          <h3 className="movie-title" style={{ 
            fontSize: '1rem', 
            fontWeight: '600', 
            marginBottom: '0.2rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: 'white'
          }}>{title}</h3>
          
          <div className="movie-origin-name" style={{
            fontSize: '0.85rem',
            color: '#888',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {[originName, metaText, year].filter(Boolean).join(' • ')}
          </div>
        </div>
      </Link>
      <button 
        onClick={handleFavoriteClick}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.6)',
          border: 'none',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: isFavorite ? '#e50914' : 'white',
          fontSize: '1.2rem',
          zIndex: 10,
          transition: 'transform 0.2s',
          backdropFilter: 'blur(4px)'
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
      >
        {isFavorite ? '♥' : '♡'}
      </button>
    </div>
  );
});

export default MovieCard;
