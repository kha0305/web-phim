import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import MovieCard from '../components/MovieCard';
import { useLanguage } from '../context/LanguageContext';
import useDocumentTitle from '../hooks/useDocumentTitle';

const Schedule = () => {
  const { t } = useLanguage();
  useDocumentTitle(`${t('schedule')} - PhimChill`);
  
  const [loading, setLoading] = useState(true);
  const [movies, setMovies] = useState([]);
  
  // Hardcoded mapping of Vietnamese days for grouping if we parse strings
  const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        // We'll fetch "Phim bộ" (Series) as they are the ones usually having schedules
        // Since we don't have a direct schedule API, we fetch recent updated series
        const response = await axios.get('/movies/list/phim-bo?page=1');
        
        if (response.data && response.data.items) {
           // We need to fetch details for each to get the 'notify' or 'showtimes' field effectively
           // BUT that is too heavy (N requests). 
           // Strategy: Just filter items that might have "Tập" in their name or just list recent ones.
           // However, for a "Schedule" page, ideally we want to see what airs TODAY or THIS WEEK.
           // Without a proper backend schedule endpoint, we will simulate it by showing "Phim Bộ Mới Cập Nhật" 
           // and visually highlighting their status.
           setMovies(response.data.items);
        }
      } catch (error) {
        console.error("Failed to fetch schedule movies", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '100px', minHeight: '80vh' }}>
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '100px', minHeight: '100vh', paddingBottom: '4rem' }}>
      <h1 className="section-title" style={{marginBottom: '2rem'}}>
        {t('schedule')}
      </h1>
      
      <div style={{
        background: '#1a1a1a', 
        padding: '20px', 
        borderRadius: '12px', 
        marginBottom: '2rem',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
         <p style={{color: '#aaa', margin: 0}}>
           {t('schedule_note') || "Danh sách các phim bộ đang được cập nhật liên tục. Lịch chiếu có thể thay đổi tùy thuộc vào nhà phát hành."}
         </p>
      </div>

      {movies.length > 0 ? (
        <div className="movie-grid">
          {movies.map((movie, index) => (
            <MovieCard key={movie._id || movie.id} movie={movie} priority={index < 4} />
          ))}
        </div>
      ) : (
        <div style={{textAlign: 'center', padding: '4rem', color: '#666'}}>
           <h3>{t('no_schedule') || "Hiện chưa có lịch chiếu."}</h3>
        </div>
      )}
    </div>
  );
};

export default Schedule;
