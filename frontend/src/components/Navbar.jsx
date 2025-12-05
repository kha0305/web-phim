import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

import axios from '../api/axios';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchHistory, setSearchHistory] = useState(() => {
    const history = localStorage.getItem('searchHistory');
    return history ? JSON.parse(history) : [];
  });
  const [showHistory, setShowHistory] = useState(false);
  const [isIncognito, setIsIncognito] = useState(() => localStorage.getItem('isIncognito') === 'true');
  
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef(null);
  const { user, logout } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
      try {
          const response = await axios.get('/notifications');
          const data = response.data || [];
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.isRead).length);
      } catch (error) {
          console.error("Failed to fetch notifications");
      }
  };

  const markAsRead = async (id) => {
      try {
          await axios.put(`/notifications/${id}/read`);
          setNotifications(prev => prev.map(n => n.id === id ? {...n, isRead: true} : n));
          setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
          console.error("Failed to mark read");
      }
  };

  const markAllRead = async () => {
    try {
        await axios.put('/notifications/read-all');
        setNotifications(prev => prev.map(n => ({...n, isRead: true})));
        setUnreadCount(0);
    } catch (error) {
        console.error("Failed to mark all as read");
    }
  };

  useEffect(() => {
    if (user) {
        fetchNotifications();
        // Poll for notifications every 60 seconds
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    // Reset UI state on navigation
    const timeout = setTimeout(() => {
      setShowSuggestions(false);
      setShowHistory(false);
      setShowUserMenu(false);
      setShowNotifications(false);
      setMobileMenuOpen(false);

      if (location.pathname === '/' && !location.search) {
        setQuery('');
      }
    }, 0);
    return () => clearTimeout(timeout);
  }, [location]);

  // ... (keep existing scroll effect)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await axios.get('/movies/search', {
          params: { query }
        });
        setSuggestions((response.data.items || []).slice(0, 5)); // Limit to 5 suggestions
        
        // Only show suggestions if the input is still focused
        if (document.activeElement === inputRef.current) {
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300); // Debounce 300ms
    return () => clearTimeout(timeoutId);
  }, [query]);

  const saveToHistory = (searchTerm) => {
    if (isIncognito) return; // Don't save search history in incognito mode
    const newHistory = [searchTerm, ...searchHistory.filter(h => h !== searchTerm)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  const removeFromHistory = (e, termToRemove) => {
    e.stopPropagation(); // Prevent clicking the item itself
    const newHistory = searchHistory.filter(term => term !== termToRemove);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  const toggleIncognito = () => {
    const newState = !isIncognito;
    setIsIncognito(newState);
    localStorage.setItem('isIncognito', newState);
    // Ideally trigger an event so other tabs/components know, but for now local changes are enough for page reloads or local checks
    window.dispatchEvent(new Event('storage')); 
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      saveToHistory(query.trim());
      navigate(`/?search=${query}`);
      setShowSuggestions(false);
      setShowHistory(false);
      if (inputRef.current) {
        inputRef.current.blur();
      }
      setMobileMenuOpen(false);
    }
  };

  const handleHomeClick = (e) => {
    // If currently on home page (without search), force reload
    if (location.pathname === '/' && !location.search) {
      e.preventDefault();
      window.location.reload();
    }
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container nav-content">
        <div style={{display: 'flex', alignItems: 'center'}}>
            <button 
                className="mobile-menu-btn" 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    marginRight: '1rem',
                    display: 'none' // Hidden by default, shown in CSS for mobile
                }}
            >
                {mobileMenuOpen ? '✕' : '☰'}
            </button>
            <Link to="/" className="logo" onClick={handleHomeClick}>
            PhimChill
            </Link>
        </div>
        
        <div className="search-container desktop-only">

          <form onSubmit={handleSearch}>
            <input 
              ref={inputRef}
              type="text" 
              className="search-input" 
              placeholder={t('search_placeholder')} 
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
              }}
              onFocus={() => {
                if (query.length > 1) setShowSuggestions(true);
                else setShowHistory(true);
              }}
              onBlur={() => setTimeout(() => {
                setShowSuggestions(false);
                setShowHistory(false);
              }, 200)}
            />
          </form>
          
          {/* Search Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="search-suggestions">
              {suggestions.map(movie => {
                 const identifier = movie.slug || movie._id || movie.id;
                 return (
                  <Link 
                    to={`/movie/${identifier}`}
                    key={movie._id || movie.id} 
                    className="suggestion-item"
                    onClick={() => {
                      saveToHistory(movie.name || movie.title);
                      setQuery('');
                      setShowSuggestions(false);
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <img 
                      src={movie.poster_url || movie.thumb_url || 'https://via.placeholder.com/45x68'} 
                      alt={movie.name}
                      className="suggestion-poster"
                    />
                    <div className="suggestion-info">
                      <div className="suggestion-title">{movie.name}</div>
                      <div className="suggestion-year">{movie.year || (movie.release_date ? new Date(movie.release_date).getFullYear() : '')}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Search History */}
          {!query && showHistory && searchHistory.length > 0 && (
            <div className="search-suggestions">
               <div style={{
                 padding: '8px 12px', 
                 fontSize: '0.8rem', 
                 color: '#aaa', 
                 display: 'flex', 
                 justifyContent: 'space-between',
                 alignItems: 'center',
                 borderBottom: '1px solid #333'
               }}>
                 <span>{t('history_search') || 'Lịch sử tìm kiếm'}</span>
                 <button 
                    onClick={clearHistory}
                    style={{background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '0.8rem', padding: 0}}
                    className="hover-text-danger"
                 >
                   {t('clear_all') || 'Xóa tất cả'}
                 </button>
               </div>
              {searchHistory.map((term, index) => (
                <div 
                  key={index} 
                  className="suggestion-item"
                  onClick={() => {
                    setQuery(term);
                    navigate(`/?search=${term}`);
                    setShowHistory(false);
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <span style={{marginRight: '10px', color: '#aaa'}}>🕒</span>
                  <div className="suggestion-info" style={{flex: 1}}>
                    <div className="suggestion-title">{term}</div>
                  </div>
                  <button 
                    onClick={(e) => removeFromHistory(e, term)}
                    style={{
                      background: 'none', 
                      border: 'none', 
                      color: '#666', 
                      cursor: 'pointer',
                      padding: '4px 8px',
                      fontSize: '1.2rem',
                      lineHeight: 1
                    }}
                    className="history-delete-btn"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="nav-links desktop-only">
          <Link to="/" className={`nav-link ${location.pathname === '/' && !location.search ? 'active' : ''}`} onClick={handleHomeClick}>
            {t('home')}
          </Link>
          <Link to="/?type=phim-le" className={`nav-link ${location.search.includes('type=phim-le') ? 'active' : ''}`}>
            Phim Lẻ
          </Link>
          <Link to="/?type=phim-bo" className={`nav-link ${location.search.includes('type=phim-bo') ? 'active' : ''}`}>
            Phim Bộ
          </Link>
          <Link to="/catalog" className={`nav-link ${location.pathname === '/catalog' ? 'active' : ''}`}>
            {t('explore_movies') || 'Khám Phá'}
          </Link>
          
          {user ? (
            <>
              <div 
                className="nav-link user-greeting" 
                style={{display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '1rem', position: 'relative', cursor: 'pointer'}}
                onMouseEnter={() => setShowUserMenu(true)}
                onMouseLeave={() => setShowUserMenu(false)}
              >
                <div style={{width: '30px', height: '30px', borderRadius: '50%', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', overflow: 'hidden'}}>
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt="Avatar" 
                      style={{width: '100%', height: '100%', objectFit: 'cover'}} 
                      onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = `https://ui-avatars.com/api/?name=${user.username}&background=random`;
                      }}
                    />
                  ) : (
                    user.username ? user.username.charAt(0).toUpperCase() : 'U'
                  )}
                </div>
                <span style={{color: 'white'}}>{user.username}</span>
                
                {showUserMenu && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    background: '#1a1a1a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '0.5rem 0',
                    minWidth: '150px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <Link to="/profile" className="nav-link" style={{padding: '0.8rem 1rem', display: 'block', color: '#ddd', transition: 'background 0.2s'}}>
                      {t('profile') || "Hồ sơ"}
                    </Link>
                    <Link to="/history" className="nav-link" style={{padding: '0.8rem 1rem', display: 'block', color: '#ddd', transition: 'background 0.2s'}}>
                      {t('history')}
                    </Link>
                    <Link to="/watchlist" className="nav-link" style={{padding: '0.8rem 1rem', display: 'block', color: '#ddd', transition: 'background 0.2s'}}>
                      {t('my_watchlist')}
                    </Link>
                    
                    <button 
                      onClick={toggleIncognito}
                      className="nav-link"
                      style={{
                        padding: '0.8rem 1rem', 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        color: '#ddd', 
                        background: 'none', 
                        border: 'none', 
                        width: '100%', 
                        cursor: 'pointer',
                        fontSize: 'inherit'
                      }}
                    >
                      <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                         {t('incognito_mode') || 'Chế độ ẩn danh'}
                      </span>
                      <div style={{
                        width: '32px',
                        height: '18px',
                        background: isIncognito ? '#4caf50' : '#444',
                        borderRadius: '10px',
                        position: 'relative',
                        transition: 'background 0.3s'
                      }}>
                        <div style={{
                          width: '14px',
                          height: '14px',
                          background: 'white',
                          borderRadius: '50%',
                          position: 'absolute',
                          top: '2px',
                          left: isIncognito ? '16px' : '2px',
                          transition: 'left 0.3s'
                        }}></div>
                      </div>
                    </button>
                    <div style={{borderTop: '1px solid rgba(255,255,255,0.1)', margin: '0.5rem 0'}}></div>
                    <button 
                      onClick={logout} 
                      className="nav-link" 
                      style={{
                        padding: '0.8rem 1rem', 
                        display: 'block', 
                        color: '#ff4b55', 
                        background: 'none', 
                        border: 'none', 
                        width: '100%', 
                        textAlign: 'left', 
                        cursor: 'pointer',
                        fontSize: 'inherit'
                      }}
                    >
                      {t('logout')}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link to="/login" className="nav-link btn btn-primary" style={{padding: '0.5rem 1rem', marginLeft: '1rem'}}>{t('login')}</Link>
          )}


          {/* Notifications */}
          {user && (
              <div 
                className="notification-container" 
                style={{position: 'relative', marginLeft: '1rem', cursor: 'pointer'}}
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowUserMenu(false);
                }}
              >
                 <div style={{position: 'relative'}}>
                     <span style={{fontSize: '1.2rem', color: 'white'}}>🔔</span>
                     {unreadCount > 0 && (
                         <span style={{
                             position: 'absolute',
                             top: '-5px',
                             right: '-5px',
                             background: 'red',
                             color: 'white',
                             borderRadius: '50%',
                             padding: '2px 5px',
                             fontSize: '0.6rem',
                             minWidth: '15px',
                             textAlign: 'center'
                         }}>
                             {unreadCount}
                         </span>
                     )}
                 </div>

                 {showNotifications && (
                     <div className="notification-dropdown" style={{
                         position: 'absolute',
                         top: '40px',
                         right: '0',
                         width: '300px',
                         background: '#222',
                         border: '1px solid #333',
                         borderRadius: '8px',
                         zIndex: 1000,
                         boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                         maxHeight: '400px',
                         overflowY: 'auto'
                     }}
                     onClick={(e) => e.stopPropagation()}
                     >
                        <div style={{
                            padding: '10px', 
                            borderBottom: '1px solid #333', 
                            fontWeight: 'bold', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center'
                        }}>
                            <span>Notifications</span>
                            {notifications.length > 0 && unreadCount > 0 && (
                                <button 
                                    onClick={markAllRead} 
                                    style={{
                                        background: 'none', 
                                        border: 'none', 
                                        color: '#e50914', 
                                        fontSize: '0.8rem', 
                                        cursor: 'pointer'
                                    }}
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>
                        {notifications.length === 0 ? (
                            <div style={{padding: '20px', textAlign: 'center', color: '#888'}}>
                                No notifications
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div 
                                    key={n.id} 
                                    style={{
                                        padding: '10px', 
                                        borderBottom: '1px solid #333', 
                                        opacity: n.isRead ? 0.6 : 1,
                                        cursor: 'pointer',
                                        background: n.isRead ? 'transparent' : 'rgba(255,255,255,0.05)'
                                    }}
                                    onClick={() => markAsRead(n.id)}
                                >
                                    <div style={{fontWeight: 'bold', fontSize: '0.9rem'}}>{n.title}</div>
                                    <div style={{fontSize: '0.8rem', color: '#ccc'}}>{n.message}</div>
                                    <div style={{fontSize: '0.7rem', color: '#666', marginTop: '4px'}}>
                                        {new Date(n.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            ))
                        )}
                     </div>
                 )}
              </div>
          )}

          <button onClick={toggleLanguage} className="nav-link language-btn" style={{marginLeft: '1rem'}} title={language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <span className="lang-code">{language.toUpperCase()}</span>
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
            <div className="mobile-search-container">
                <form onSubmit={handleSearch}>
                    <input 
                    type="text" 
                    className="search-input" 
                    placeholder={t('search_placeholder')} 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    />
                </form>
            </div>
            
            <Link to="/" className={`mobile-nav-link ${location.pathname === '/' && !location.search ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                {t('home')}
            </Link>
            <Link to="/?type=phim-le" className={`mobile-nav-link ${location.search.includes('type=phim-le') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                Phim Lẻ
            </Link>
            <Link to="/?type=phim-bo" className={`mobile-nav-link ${location.search.includes('type=phim-bo') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                Phim Bộ
            </Link>
            <Link to="/catalog" className={`mobile-nav-link ${location.pathname === '/catalog' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                {t('explore_movies') || 'Khám Phá'}
            </Link>

            <div className="mobile-divider"></div>

            {user ? (
                <>
                    <div className="mobile-user-info">
                        <div style={{width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', overflow: 'hidden', marginRight: '10px'}}>
                            {user.avatar ? (
                                <img src={user.avatar} alt="Avatar" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                            ) : (
                                user.username ? user.username.charAt(0).toUpperCase() : 'U'
                            )}
                        </div>
                        <span>{user.username}</span>
                    </div>
                    <Link to="/profile" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>{t('profile') || "Hồ sơ"}</Link>
                    <Link to="/history" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>{t('history')}</Link>
                    <Link to="/watchlist" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>{t('my_watchlist')}</Link>
                    <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="mobile-nav-link" style={{color: '#ff4b55', textAlign: 'left', width: '100%', background: 'none', border: 'none', fontSize: 'inherit', cursor: 'pointer'}}>
                        {t('logout')}
                    </button>
                </>
            ) : (
                <Link to="/login" className="mobile-nav-link btn-primary" onClick={() => setMobileMenuOpen(false)}>{t('login')}</Link>
            )}

            <div className="mobile-divider"></div>

            <button onClick={toggleLanguage} className="mobile-nav-link" style={{display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', color: 'white', fontSize: 'inherit'}}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
                <span>{language === 'vi' ? 'Tiếng Việt' : 'English'}</span>
            </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
