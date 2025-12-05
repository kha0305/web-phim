import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../api/axios';
import MovieCard from '../components/MovieCard';
import VideoPlayer from '../components/VideoPlayer';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const MovieDetail = () => {
  const { id } = useParams(); // This is now the slug
  const [movie, setMovie] = useState(null);
  const [relatedMovies, setRelatedMovies] = useState([]);
  const [topMovies, setTopMovies] = useState([]);

  const [currentEpisode, setCurrentEpisode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const startTimeRef = useRef(null);
  const progressRef = useRef(0);
  const totalDurationRef = useRef(0);
  const [initialProgress, setInitialProgress] = useState(0);

  const saveHistory = React.useCallback(async () => {
    if (startTimeRef.current) {
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000); // seconds
      // Only save if watched for at least 1 minute (60s) OR if progress > 10s (to capture resume point)
      if (duration < 60 && progressRef.current < 10) return; 
      
      if (user) {
        try {
          await axios.post('/history', { 
            userId: user.id, 
            movieId: id,
            duration: duration,
            progress: Math.floor(progressRef.current),
            durationTotal: Math.floor(totalDurationRef.current)
          });
        } catch (error) {
          console.error("Failed to save history:", error);
        }
      } else {
        // Save to localStorage for non-logged in users
        const localHistory = JSON.parse(localStorage.getItem('watchHistory') || '[]');
        const existingIndex = localHistory.findIndex(h => h.movieId === id || h.slug === id);
        
        const historyItem = {
          movieId: id,
          slug: movie?.slug || id,
          name: movie?.name,
          poster_url: movie?.poster_url || movie?.thumb_url,
          durationWatched: duration, // approximate total seconds watched this session
          progress: Math.floor(progressRef.current), // resume point in seconds
          durationTotal: Math.floor(totalDurationRef.current), // total video length in seconds
          timestamp: Date.now(),
          // Store minimal movie data for display
          year: movie?.year,
          time: movie?.time,
          episode_current: movie?.episode_current,
          quality: movie?.quality,
          lang: movie?.lang
        };

        if (existingIndex !== -1) {
          // Update existing, keep the max duration if we want cumulative, but usually we just want "last watched" status
          // For resume point (progress), we always update.
          // For durationWatched, we might want to add up? For now let's just update the "last watched" info.
          localHistory[existingIndex] = {
             ...localHistory[existingIndex],
             ...historyItem,
             durationWatched: (localHistory[existingIndex].durationWatched || 0) + duration
          };
        } else {
          localHistory.unshift(historyItem);
        }
        
        // Limit to 20 items
        const trimmedHistory = localHistory.slice(0, 20);
        localStorage.setItem('watchHistory', JSON.stringify(trimmedHistory));
      }
    }
  }, [user, id, movie]);

  const handleClosePlayer = React.useCallback(async () => {
    await saveHistory();
    setShowPlayer(false);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.log(err));
    }
    startTimeRef.current = null;
    progressRef.current = 0;
  }, [saveHistory]);

  // Auto-save history every 5 minutes and on unmount
  useEffect(() => {
    let interval;
    if (showPlayer) {
      interval = setInterval(() => {
        saveHistory();
      }, 5 * 60 * 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
      if (showPlayer) saveHistory();
    };
  }, [showPlayer, saveHistory]);

  useEffect(() => {
    const fetchMovieDetail = async () => {
      try {
        const response = await axios.get(`/movies/${id}`);
        setMovie(response.data);
      } catch (error) {
        console.error("Error fetching movie detail:", error);
      } finally {
        setLoading(false);
      }
    };

    const checkWatchlist = async () => {
      if (user) {
        try {
          const response = await axios.get(`/watchlist/check/${id}`);
          setInWatchlist(response.data.inWatchlist);
        } catch (error) {
          console.error("Error checking watchlist:", error);
        }
      }
    };

    if (id) {
      fetchMovieDetail();
      checkWatchlist();
      
      // Fetch Top Movies for Sidebar
      const fetchTopMovies = async () => {
        try {
          const response = await axios.get('/movies/top-viewed');
          setTopMovies(response.data);
        } catch (error) {
          console.error("Error fetching top movies:", error);
        }
      };
      fetchTopMovies();
    }
  }, [id, language, user]);

  // Fetch related movies when movie data is available
  useEffect(() => {
    if (movie && movie.category && movie.category.length > 0) {
      const fetchRelated = async () => {
        try {
          const genreSlug = movie.category[0].slug;
          const response = await axios.get(`/movies/genre/${genreSlug}`);
          // Filter out current movie
          const related = (response.data.items || [])
            .filter(m => m.slug !== movie.slug && m._id !== movie._id)
            .slice(0, 6);
          setRelatedMovies(related);
        } catch (error) {
          console.error("Error fetching related movies:", error);
        }
      };
      fetchRelated();
    }
  }, [movie]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'f' || e.key === 'F') {
        if (showPlayer) {
          const playerSection = document.getElementById('player-section');
          if (!document.fullscreenElement) {
            playerSection?.requestFullscreen().catch(err => console.log(err));
          } else {
            document.exitFullscreen().catch(err => console.log(err));
          }
        }
      }
      if (e.key === 'Escape') {
        if (!document.fullscreenElement && showPlayer) {
          handleClosePlayer();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPlayer, handleClosePlayer]);

  useEffect(() => {
    if (showPlayer && currentEpisode) {
      // Small timeout to ensure DOM is ready
      setTimeout(() => {
        const playerElement = document.getElementById('player-section');
        if (playerElement) {
          playerElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [showPlayer, currentEpisode]);

  const handleWatch = async (episode, serverName) => {
    // Fetch saved progress
    let savedProgress = 0;
    if (user) {
      try {
        const res = await axios.get(`/history/progress/${id}`);
        savedProgress = res.data.progress || 0;
      } catch (e) {
        console.error("Failed to fetch progress", e);
      }
    } else {
      // Fetch from localStorage
      try {
        const localHistory = JSON.parse(localStorage.getItem('watchHistory') || '[]');
        const item = localHistory.find(h => h.movieId === id || h.slug === id);
        if (item) {
          savedProgress = item.progress || 0;
        }
      } catch (e) {
        console.error("Failed to read local history", e);
      }
    }
    
    setInitialProgress(savedProgress);
    setCurrentEpisode({ ...episode, server_name: serverName });
    setShowPlayer(true);
    startTimeRef.current = Date.now();
    progressRef.current = savedProgress;
  };

  const toggleWatchlist = async () => {
    if (!user) {
      alert(t('login_required') || "Please login to use this feature");
      return;
    }

    try {
      if (inWatchlist) {
        await axios.delete(`/watchlist/${id}`);
        setInWatchlist(false);
      } else {
        await axios.post('/watchlist', { movieId: id });
        setInWatchlist(true);
      }
    } catch (error) {
      console.error("Error updating watchlist:", error);
    }
  };

  if (loading) {
    return (
      <div className="detail-container" style={{ paddingTop: '100px' }}>
        <div className="container detail-content">
          <div className="skeleton skeleton-poster"></div>
          <div className="detail-info">
            <div className="skeleton skeleton-text" style={{ height: '3rem', width: '70%', marginBottom: '1rem' }}></div>
            <div className="skeleton skeleton-text" style={{ height: '1.5rem', width: '40%', marginBottom: '2rem' }}></div>
            <div className="stats" style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
              <div className="skeleton" style={{ width: '80px', height: '40px' }}></div>
              <div className="skeleton" style={{ width: '80px', height: '40px' }}></div>
              <div className="skeleton" style={{ width: '80px', height: '40px' }}></div>
            </div>
            <div className="skeleton skeleton-text" style={{ height: '100px', marginBottom: '2rem' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="container" style={{ paddingTop: '120px', textAlign: 'center' }}>
        <h2>{t('movie_not_found')}</h2>
        <p style={{ color: '#aaa', marginTop: '1rem' }}>
          Could not find movie with ID: {id}. 
          <br/>
          Please try searching again.
        </p>
      </div>
    );
  }

  // Use poster_url as background if backdrop is missing (phimapi doesn't always have backdrop)
  const backdropUrl = movie.poster_url || movie.thumb_url;

  return (
    <div 
      className="detail-container"
      style={{
        background: backdropUrl 
          ? `linear-gradient(to top, #0f1014 10%, rgba(15, 16, 20, 0.9) 100%), url(${backdropUrl}) no-repeat top center / cover`
          : 'var(--background-color)'
      }}
    >
      <div className="container detail-content">
        <img 
          src={movie.poster_url || movie.thumb_url} 
          alt={movie.name} 
          className="detail-poster"
        />
        
        <div className="detail-info">
          <h1>{movie.name}</h1>
          <h3 style={{color: '#aaa', marginTop: '-10px', marginBottom: '20px'}}>{movie.origin_name}</h3>
          
          <div className="stats">
            <div className="stat-item">
              <span className="stat-label">{t('rating')}</span>
              <span className="stat-value" style={{color: '#ffc107'}}>★ {movie.tmdb?.vote_average || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">{t('runtime')}</span>
              <span className="stat-value">{movie.time}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">{t('release')}</span>
              <span className="stat-value">{movie.year}</span>
            </div>
             <div className="stat-item">
              <span className="stat-label">{t('quality')}</span>
              <span className="stat-value">{movie.quality} - {movie.lang}</span>
            </div>
          </div>

          <div className="genres">
            {movie.category && movie.category.map(cat => (
              <span key={cat.id} className="genre-pill">{t(cat.slug) !== cat.slug ? t(cat.slug) : cat.name}</span>
            ))}
          </div>

          <h3>{t('overview')}</h3>
          <div className="overview" dangerouslySetInnerHTML={{ __html: movie.content }}></div>

          <div className="actions">
            {movie.episodes && movie.episodes.length > 0 ? (
               <button className="btn btn-primary" onClick={() => handleWatch(movie.episodes[0].server_data[0], movie.episodes[0].server_name)}>
                ▶ {t('watch_now')}
              </button>
            ) : (
               <button className="btn btn-primary" disabled>
                {t('coming_soon')}
              </button>
            )}
           
            <button 
              className={`btn ${inWatchlist ? 'btn-primary' : 'btn-outline'}`} 
              style={{
                marginLeft: '1rem', 
                background: inWatchlist ? '#4caf50' : 'transparent',
                borderColor: inWatchlist ? '#4caf50' : 'rgba(255,255,255,0.3)'
              }} 
              onClick={toggleWatchlist}
            >
              {inWatchlist ? '✓ ' + t('added_to_list') : '+ ' + t('add_to_list')}
            </button>
          </div>
          
          {/* Episode List */}
          {movie.episodes && movie.episodes.length > 0 && (
            <div className="episodes-section" style={{marginTop: '2rem'}}>
              <h3>{t('episodes')}</h3>
              {movie.episodes.map((server, idx) => (
                <div key={idx} style={{marginBottom: '1rem'}}>
                  <h4 style={{color: '#aaa', marginBottom: '0.5rem'}}>{server.server_name}</h4>
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px'}}>
                    {server.server_data.map((ep) => {
                      // Create a unique ID for comparison that includes server info if possible, 
                      // or just rely on the fact that we need to match the specific episode object.
                      // However, since we are iterating, let's check if the currentEpisode matches this specific episode's link or slug AND belongs to this server group if we tracked it.
                      // A simpler way is to check if the link_embed matches, as that should be unique per server/episode combo.
                      const isActive = currentEpisode?.slug === ep.slug && currentEpisode?.server_name === server.server_name;
                      
                      return (
                        <button 
                          key={`${server.server_name}-${ep.slug}`}
                          className={`btn btn-outline ${isActive ? 'active' : ''}`}
                          style={{
                            minWidth: '60px', 
                            padding: '5px 10px',
                            background: isActive ? 'var(--primary-color)' : 'transparent',
                            borderColor: isActive ? 'var(--primary-color)' : 'rgba(255,255,255,0.2)'
                          }}
                          onClick={() => handleWatch(ep, server.server_name)}
                        >
                          {ep.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {showPlayer && currentEpisode && (
        <div className="player-section" id="player-section">
          <div className="container">
            <div className="player-header">
              <h2>{t('now_watching')}: {movie.name} - {currentEpisode.name}</h2>
            </div>
            <div className={`video-wrapper ${!currentEpisode.link_m3u8 ? 'embed' : ''}`}>
              {currentEpisode.link_m3u8 ? (
                <VideoPlayer 
                  src={currentEpisode.link_m3u8} 
                  poster={movie.poster_url || movie.thumb_url} 
                  initialTime={initialProgress}
                  onProgress={(time, totalDuration) => {
                    progressRef.current = time;
                    if (totalDuration) totalDurationRef.current = totalDuration;
                  }}
                />
              ) : (
                <iframe
                  src={currentEpisode.link_embed}
                  className="video-iframe-embedded"
                  allowFullScreen
                  title="Movie Player"
                  allow="autoplay; encrypted-media"
                ></iframe>
              )}
            </div>
            <div className="player-note">
              <p>{t('note_slow')}</p>
              <p style={{fontSize: '0.8rem', marginTop: '0.5rem'}}>{t('theater_mode_hint')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content with Sidebar Layout */}
      <div className="container" style={{ marginTop: '2rem' }}>
        <div className="home-layout">
          <div className="main-content">
            {/* Related Movies */}
            {relatedMovies.length > 0 && (
              <div className="related-movies-section">
                <h3 className="section-title">{t('related_movies')}</h3>
                <div className="movie-grid">
                  {relatedMovies.map((m, index) => (
                    <MovieCard key={m._id || m.id} movie={m} priority={index < 5} />
                  ))}
                </div>
              </div>
            )}
            
            {/* Comments Section (Placeholder) */}
            <div className="comments-section" style={{ marginTop: '3rem' }}>
              <h3 className="section-title">{t('comments')}</h3>
              <div style={{ background: 'var(--surface-color)', padding: '2rem', borderRadius: '8px', textAlign: 'center', color: '#aaa' }}>
                {t('comments_feature_coming_soon')}
              </div>
            </div>
          </div>

          <div className="sidebar">
            <div className="sidebar-section">
              <h3 className="sidebar-title">{t('top_viewed')}</h3>
              <div className="sidebar-list">
                {topMovies.map(movie => (
                  <div 
                    key={movie._id || movie.id} 
                    className="sidebar-item"
                    onClick={() => {
                      // Navigate to new movie
                      window.location.href = `/movie/${movie.slug || movie.id}`;
                    }}
                  >
                    <img 
                      src={movie.thumb_url || movie.poster_url} 
                      alt={movie.name} 
                      className="sidebar-thumb"
                    />
                    <div className="sidebar-info">
                      <h4 className="sidebar-movie-title">{movie.name}</h4>
                      <div className="sidebar-movie-meta">
                        {movie.year || (movie.release_date ? new Date(movie.release_date).getFullYear() : (movie.name && movie.name.match(/\((\d{4})\)/) ? movie.name.match(/\((\d{4})\)/)[1] : (movie.time || new Date().getFullYear())))}
                      </div>
                      <div className="sidebar-views">
                        <span>👁</span> {movie.viewCount || 0}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;
