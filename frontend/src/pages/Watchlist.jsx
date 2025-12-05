import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';
import MovieCard from '../components/MovieCard';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const Watchlist = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchWatchlist = async () => {
      try {
        const langParam = language === 'vi' ? 'vi-VN' : 'en-US';
        const response = await axios.get(`/watchlist/${user.id}?lang=${langParam}`);
        setMovies(response.data);
      } catch (error) {
        console.error("Error fetching watchlist:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlist();
  }, [user, navigate, language]);

  const removeFromWatchlist = async (e, movieId) => {
    e.stopPropagation();
    e.preventDefault();
    if (window.confirm(t('confirm_remove') || "Remove from watchlist?")) {
      try {
        await axios.delete(`/watchlist/${movieId}`);
        setMovies(movies.filter(m => m.slug !== movieId));
      } catch (error) {
        console.error("Error removing from watchlist:", error);
      }
    }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  return (
    <div className="container" style={{ marginTop: '100px' }}>
      <h2 className="section-title">{t('my_watchlist') || "My Watchlist"}</h2>
      {movies.length === 0 ? (
        <p>{t('no_watchlist') || "Your watchlist is empty."}</p>
      ) : (
        <div className="movie-grid">
          {movies.map((movie, index) => (
            <div key={`${movie.slug || movie._id}-${index}`} style={{position: 'relative'}}>
               <MovieCard movie={movie} />
               <button 
                 onClick={(e) => removeFromWatchlist(e, movie.slug)}
                 className="btn-remove-watchlist"
                 style={{
                   position: 'absolute', 
                   top: '10px', 
                   right: '10px', 
                   background: 'rgba(0, 0, 0, 0.6)', 
                   color: 'white',
                   border: '1px solid rgba(255,255,255,0.3)',
                   borderRadius: '50%',
                   width: '32px',
                   height: '32px',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   cursor: 'pointer',
                   zIndex: 20,
                   transition: 'all 0.2s ease',
                   backdropFilter: 'blur(4px)'
                 }}
                 onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(229, 9, 20, 0.9)';
                    e.currentTarget.style.transform = 'scale(1.1)';
                 }}
                 onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
                    e.currentTarget.style.transform = 'scale(1)';
                 }}
                 title={t('remove_from_list') || "Remove"}
               >
                 ✕
               </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Watchlist;
