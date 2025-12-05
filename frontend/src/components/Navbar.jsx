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
  
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef(null);
  const { user, logout } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();

  useEffect(() => {
    // Reset UI state on navigation
    const timeout = setTimeout(() => {
      setShowSuggestions(false);
      setShowHistory(false);
      setShowUserMenu(false);

      if (location.pathname === '/' && !location.search) {
        setQuery('');
      }
    }, 0);
    return () => clearTimeout(timeout);
  }, [location]);

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
    const newHistory = [searchTerm, ...searchHistory.filter(h => h !== searchTerm)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
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
    }
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container nav-content">
        <Link to="/" className="logo">
          PhimChill
        </Link>
        
        <div className="search-container">
          <img src="/search-icon.png" alt="Search" className="search-icon" style={{width: '20px', height: '20px', filter: 'brightness(0) invert(1)'}} />
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
                  <div className="suggestion-info">
                    <div className="suggestion-title">{term}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="nav-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' && !location.search ? 'active' : ''}`}>
            {t('home')}
          </Link>
          <Link to="/?type=phim-le" className={`nav-link ${location.search.includes('type=phim-le') ? 'active' : ''}`}>
            Phim Lẻ
          </Link>
          <Link to="/?type=phim-bo" className={`nav-link ${location.search.includes('type=phim-bo') ? 'active' : ''}`}>
            Phim Bộ
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
                    <img src={user.avatar} alt="Avatar" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
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

          <button onClick={toggleLanguage} className="nav-link language-btn" style={{marginLeft: '1rem'}} title={language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <span className="lang-code">{language.toUpperCase()}</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
