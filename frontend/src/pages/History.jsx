import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';
import MovieCard from '../components/MovieCard';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const History = () => {
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

    const fetchHistory = async () => {
      try {
        const langParam = language === 'vi' ? 'vi-VN' : 'en-US';
        const response = await axios.get(`/history/${user.id}?lang=${langParam}`);
        setMovies(response.data);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user, navigate, language]);



  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  return (
    <div className="container" style={{ marginTop: '100px' }}>
      <h2 className="section-title">{t('watch_history')}</h2>
      {movies.length === 0 ? (
        <p>{t('no_history')}</p>
      ) : (
        <div className="movie-grid">
          {movies.map((movie, index) => (
            <div key={`${movie._id || movie.id}-${index}`} style={{position: 'relative'}}>
               <MovieCard movie={movie} />
               <div style={{
                 position: 'absolute', 
                 top: '10px', 
                 right: '10px', 
                 background: 'rgba(0, 0, 0, 0.85)', 
                 padding: '6px 10px', 
                 borderRadius: '8px',
                 fontSize: '0.85rem',
                 backdropFilter: 'blur(4px)',
                 border: '1px solid rgba(255, 255, 255, 0.1)',
                 display: 'flex',
                 flexDirection: 'column',
                 alignItems: 'flex-end',
                 zIndex: 10,
                 pointerEvents: 'none' // Allow clicking through to the card
               }}>
                 <div style={{color: '#text-secondary', fontSize: '0.75rem', marginBottom: '2px'}}>{t('watched')}</div>
                 <div style={{fontWeight: '600', marginBottom: '4px'}}>{new Date(movie.watchedAt).toLocaleDateString()}</div>
                 <div style={{
                   borderTop: '1px solid rgba(255, 255, 255, 0.2)', 
                   width: '100%', 
                   paddingTop: '4px', 
                   textAlign: 'right',
                   color: '#ffc107',
                   fontWeight: '500'
                 }}>
                   ⏱ {movie.durationWatched ? `${movie.durationWatched}m ${t('mins_watched')}` : t('just_started')}
                 </div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
