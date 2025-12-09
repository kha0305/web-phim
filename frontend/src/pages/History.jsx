import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getMovieYear } from '../utils/movieUtils';

const History = () => {
  const [historyGroups, setHistoryGroups] = useState({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const groupHistory = (data) => {
      const groups = {};
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();

      data.forEach(item => {
        const date = new Date(item.watchedAt).toDateString();
        let key = t('older') || 'Cũ hơn';
        if (date === today) key = t('today') || 'Hôm nay';
        else if (date === yesterday) key = t('yesterday') || 'Hôm qua';
        
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      });

      setHistoryGroups(groups);
    };

    const fetchHistory = async () => {
      try {
        const langParam = language === 'vi' ? 'vi-VN' : 'en-US';
        const response = await axios.get(`/history/${user.id}?lang=${langParam}`);
        groupHistory(response.data);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user, navigate, language, t]);

  const clearHistory = async () => {
    if (!window.confirm(t('confirm_clear_history') || "Bạn có chắc chắn muốn xóa toàn bộ lịch sử xem?")) return;
    try {
      await axios.delete('/history');
      setHistoryGroups({});
    } catch (error) {
      console.error("Failed to clear history", error);
    }
  };

  const removeHistoryItem = async (movieId) => {
    try {
      await axios.delete(`/history/${movieId}`);
      // Refresh local state without refetching
      const newGroups = { ...historyGroups };
      for (const key in newGroups) {
        newGroups[key] = newGroups[key].filter(item => (item.id !== movieId && item._id !== movieId && item.slug !== movieId));
        if (newGroups[key].length === 0) delete newGroups[key];
      }
      setHistoryGroups(newGroups);
    } catch (error) {
      console.error("Failed to remove item", error);
    }
  };

  const formatDuration = (totalSeconds) => {
    if (!totalSeconds) return '00m00s';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return hours > 0 ? `${hours}h${minutes}m` : `${minutes}m`;
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  const hasHistory = Object.keys(historyGroups).length > 0;

  return (
    <div className="container" style={{ marginTop: '100px', display: 'flex', gap: '30px' }}>
      
      {/* Main Content */}
      <div style={{ flex: 1 }}>
        <h2 className="section-title">{t('watch_history')}</h2>
        
        {!hasHistory ? (
           <div style={{textAlign: 'center', marginTop: '50px', color: '#888'}}>
             <div style={{fontSize: '4rem', marginBottom: '1rem'}}>📂</div>
             <p>{t('no_history')}</p>
             <Link to="/" className="btn btn-primary" style={{marginTop: '1rem', display: 'inline-block'}}>
               {t('discover_movies') || "Khám phá phim"}
             </Link>
           </div>
        ) : (
          Object.keys(historyGroups).map(group => (
            <div key={group} style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#aaa', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                {group}
              </h3>
              <div className="history-list">
                {historyGroups[group].map((item, index) => {
                   const progressPercent = item.durationTotal ? (item.progress / item.durationTotal) * 100 : 0;
                   return (
                    <div key={`${item._id || item.id}-${index}`} className="history-item-card">
                       <Link to={`/movie/${item.slug || item.id}?episode=${item.episodeSlug}&autoplay=true`} className="history-thumb-link">
                         <div className="history-thumb-wrapper">
                            <img 
                              src={item.poster_url || item.thumb_url} 
                              alt={item.name} 
                              className="history-thumb" 
                            />
                            {/* Progress Bar */}
                            <div className="history-progress-bar-bg">
                              <div 
                                className="history-progress-bar-fill" 
                                style={{ width: `${progressPercent}%` }}
                              ></div>
                            </div>
                            <div className="history-duration-badge">
                              {formatDuration(item.durationTotal || item.durationWatched)}
                            </div>
                         </div>
                       </Link>
                       
                       <div className="history-info">
                         <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                           <Link to={`/movie/${item.slug || item.id}?episode=${item.episodeSlug}&autoplay=true`} className="history-title">
                             {item.name}
                           </Link>
                           <button 
                             onClick={() => removeHistoryItem(item.movieId || item.id)}
                             className="history-remove-btn"
                             title={t('remove_from_history') || "Xóa khỏi lịch sử"}
                           >
                             ✕
                           </button>
                         </div>
                         <div className="history-meta">
                           {item.origin_name || item.original_name} • {getMovieYear(item)}
                         </div>
                         <div className="history-desc">
                           {/* Short description or watched duration */}
                           {progressPercent > 90 ? (
                             <span style={{color: '#4caf50'}}>✓ {t('watched') || "Đã xem"}</span>
                           ) : (
                             <span style={{color: '#ffc107'}}>
                               Stopped at {formatDuration(item.progress)}
                             </span>
                           )}
                         </div>
                       </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sidebar Actions */}
      {hasHistory && (
        <div className="history-sidebar desktop-only" style={{ width: '300px', background: 'var(--surface-color)', padding: '20px', borderRadius: '12px', height: 'fit-content' }}>
          <div className="search-input-wrapper" style={{marginBottom: '20px'}}>
             <input type="text" placeholder={t('search_history') || "Tìm kiếm trong lịch sử..."} className="search-input" style={{width: '100%'}} />
          </div>
          
          <button 
            onClick={clearHistory}
            className="btn btn-outline" 
            style={{ width: '100%', borderColor: '#ff4b55', color: '#ff4b55' }}
            onMouseOver={(e) => { e.target.style.background = '#ff4b55'; e.target.style.color = 'white'; }}
            onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#ff4b55'; }}
          >
            🗑 {t('clear_all_history') || "Xóa tất cả lịch sử xem"}
          </button>

          <div style={{marginTop: '20px', color: '#888', fontSize: '0.9rem'}}>
            <p>{t('history_nav_hint') || "Lịch sử xem giúp bạn dễ dàng tìm lại những bộ phim dở dang."}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
