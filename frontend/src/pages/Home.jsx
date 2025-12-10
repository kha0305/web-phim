import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import MovieCard from '../components/MovieCard';
import SkeletonCard from '../components/SkeletonCard';
import HistoryCard from '../components/HistoryCard';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getMovieYear } from '../utils/movieUtils';
import useDocumentTitle from '../hooks/useDocumentTitle';

const Home = () => {
  useDocumentTitle('PhimChill - Xem Phim Online Miễn Phí');

  // Independent Loading States
  const [movies, setMovies] = useState([]);
  const [moviesLoading, setMoviesLoading] = useState(true);

  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  const [topMovies, setTopMovies] = useState([]);
  const [topMoviesLoading, setTopMoviesLoading] = useState(true);

  const [genres, setGenres] = useState([]);

  // User Data
  const [history, setHistory] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get('search');
  const genreParam = searchParams.get('genre');
  const typeParam = searchParams.get('type');
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  
  // 1. Fetch Static Configs (Fastest)
  useEffect(() => {
    axios.get('/genres').then(res => setGenres(res.data)).catch(console.error);
  }, []);

  // 2. Fetch User Data (Parallel)
  useEffect(() => {
    if (user && !searchQuery && !genreParam) {
      Promise.allSettled([
        axios.get(`/history/${user.id}`),
        axios.get(`/watchlist/${user.id}`)
      ]).then(([histRes, watchRes]) => {
         if (histRes.status === 'fulfilled') setHistory(histRes.value.data.slice(0, 10));
         if (watchRes.status === 'fulfilled') setWatchlist(watchRes.value.data.slice(0, 10));
      });
    } else if (!user) {
       // Local Storage
       try {
        const raw = localStorage.getItem('watchHistory');
        if (raw) setHistory(JSON.parse(raw).slice(0, 10));
       } catch {}
    }
  }, [user, searchQuery, genreParam]);

  // 3. CORE LOGIC: Progressive Fetching
  useEffect(() => {
    // Reset States on nav
    setMoviesLoading(true);
    setFeaturedLoading(true);
    setTopMoviesLoading(true);

    // A. FETCH MOVIES LIST (Main Content)
    const fetchMainList = async () => {
        try {
            let res;
            if (searchQuery) {
                res = await axios.get('/movies/search', { params: { query: searchQuery } });
                setMovies(res.data.items || []);
                setFeaturedLoading(false); // No banner on search
            } else if (genreParam) {
                res = await axios.get(`/movies/genre/${genreParam}`, { params: { page } });
                setMovies(res.data.items || []);
                setFeaturedLoading(false); // No banner on genre
            } else if (typeParam) {
                res = await axios.get(`/movies/list/${typeParam}`, { params: { page } });
                setMovies(res.data.items || []);
                setFeaturedLoading(false); // No banner on list
            } else {
                // Home: Fetch Popular
                const popularRes = await axios.get('/movies/popular', { params: { page } });
                const items = popularRes.data.items || [];
                setMovies(items);
                
                // If Home, Pick Banner from Popular first (Instant)
                if (items.length > 0) {
                     const random = Math.floor(Math.random() * Math.min(5, items.length));
                     const bannerCandidate = items[random];
                     setFeaturedMovie(bannerCandidate); // Show Basic Info First
                     
                     // Then fetch full detail for banner in background
                     axios.get(`/movies/${bannerCandidate.slug}`)
                        .then(full => setFeaturedMovie(full.data))
                        .catch(() => {})
                        .finally(() => setFeaturedLoading(false));
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setMoviesLoading(false);
        }
    };

    // B. FETCH SIDEBAR (Top Viewed)
    const fetchSidebar = async () => {
         // Only fetch sidebar on homepage or if needed
         try {
             const res = await axios.get('/movies/top-viewed');
             setTopMovies(res.data || []);
         } catch {
             // Fallback to empty
         } finally {
             setTopMoviesLoading(false);
         }
    };

    // EXECUTE
    fetchMainList();
    if (!searchQuery) fetchSidebar();

  }, [searchQuery, genreParam, typeParam, page, language]);

  // Scroll top
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [page, genreParam, typeParam]);

  return (
    <div>
      {/* 1. HERO SECTION (Priority Render) */}
      {!searchQuery && !genreParam && !typeParam && (
         <div style={{ minHeight: '60vh', position: 'relative', marginBottom: '2rem' }}>
            {featuredLoading ? (
                 <div className="hero" style={{ background: '#1a1a1a', display: 'flex', alignItems: 'center' }}>
                    <div className="container hero-content" style={{width: '100%'}}>
                        <div className="skeleton skeleton-text" style={{ height: '3rem', width: '50%', marginBottom: '1rem' }}></div>
                        <div className="skeleton skeleton-text" style={{ height: '1rem', width: '30%', marginBottom: '1rem' }}></div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div className="skeleton" style={{ width: '140px', height: '45px', borderRadius: '4px' }}></div>
                            <div className="skeleton" style={{ width: '140px', height: '45px', borderRadius: '4px' }}></div>
                        </div>
                    </div>
                 </div>
            ) : featuredMovie ? (
                <header 
                  className="hero" 
                  style={{
                    backgroundImage: `url(${featuredMovie.poster_url || featuredMovie.thumb_url})`
                  }}
                >
                  <div className="hero-overlay-gradient"></div>
                  <div className="container hero-content">
                    <div className="hero-text">
                      <span className="featured-badge">{t('featured_movie')}</span>
                      <h1 className="hero-title">{featuredMovie.name || featuredMovie.title}</h1>
                      
                      <div className="hero-meta">
                        <span className="year-badge">{getMovieYear(featuredMovie) || 'N/A'}</span>
                        <span className="quality-badge">{featuredMovie.quality || 'HD'}</span>
                        {featuredMovie.category && (
                          <span className="genres-text">
                            {featuredMovie.category.slice(0, 3).map(g => g.name).join(' • ')}
                          </span>
                        )}
                      </div>

                      <p className="hero-overview">
                        {featuredMovie.content && featuredMovie.content.replace(/<[^>]*>?/gm, '').length > 150 
                          ? featuredMovie.content.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...' 
                          : (featuredMovie.content || featuredMovie.overview || '').replace(/<[^>]*>?/gm, '')}
                      </p>
                      
                      <div className="hero-actions">
                        <button 
                          className="btn btn-primary hero-btn"
                          onClick={() => navigate(`/movie/${featuredMovie.slug || featuredMovie.id}`)}
                        >
                           {t('watch_now')}
                        </button>
                        <button 
                          className="btn btn-outline hero-btn" 
                          onClick={() => navigate(`/movie/${featuredMovie.slug || featuredMovie.id}`)}
                        >
                           {t('more_info')}
                        </button>
                      </div>
                    </div>
                    {/* Only show poster on desktop */}
                    <div className="hero-poster-wrapper">
                      <img 
                        src={featuredMovie.poster_url || featuredMovie.thumb_url} 
                        alt={featuredMovie.name} 
                        className="hero-poster"
                      />
                    </div>
                  </div>
                </header>
            ) : (
                // Fallback Banner to preserve layout
                 <div className="hero hero-placeholder" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh'}}>
                    <div className="container" style={{textAlign: 'center', zIndex: 2}}>
                        <h1 className="hero-title" style={{fontSize: '3rem', marginBottom: '1rem'}}>PhimChill</h1>
                        <p style={{fontSize: '1.2rem', color: '#ccc'}}>Khám phá thế giới phim ảnh bất tận</p>
                    </div>
                    <div className="hero-overlay-gradient"></div>
                 </div>
            )}
         </div>
      )}

      {/* 2. GENRE SCROLL (Instant if cached) */}
      {!searchQuery && (
          <div className="container">
            <div className="genre-container">
                <button 
                  className={`genre-pill ${!genreParam ? 'active' : ''}`}
                  onClick={() => { navigate('/'); setPage(1); }}
                >
                  {t('popular')}
                </button>
                {genres.map(genre => (
                  <button 
                    key={genre.slug}
                    className={`genre-pill ${genreParam === genre.slug ? 'active' : ''}`}
                    onClick={() => { navigate(`/?genre=${genre.slug}`); setPage(1); }}
                  >
                    {t(genre.slug) !== genre.slug ? t(genre.slug) : genre.name}
                  </button>
                ))}
            </div>
          </div>
      )}

      <main className="container">
        <div className="home-layout">
          {/* Main List Column */}
          <div className="main-content">
             
             {/* History Section - Only locally rendered if available */}
             {history.length > 0 && !searchQuery && !genreParam && !typeParam && (
               <div className="continue-watching-section">
                 <h2 className="section-title">{t('watch_history')}</h2>
                 <div className="horizontal-scroll-container">
                    {history.map(m => <HistoryCard key={m.movieId || m.id} movie={m} />)}
                 </div>
               </div>
             )}

             <h2 className="section-title">
                {searchQuery 
                  ? `${t('search_results')} "${searchQuery}"` 
                  : genreParam 
                    ? (genres.find(g => g.slug === genreParam)?.name || genreParam)
                    : typeParam 
                        ? (typeParam === 'phim-le' ? t('movies_single') : t('movies_series'))
                        : t('latest_movies')}
             </h2>

             {moviesLoading ? (
                 <div className="movies-grid">
                     {[...Array(12)].map((_, i) => <SkeletonCard key={i} />)}
                 </div>
             ) : (
                 <>
                    {movies.length === 0 ? (
                        <p className="no-result">{t('movie_not_found')}</p>
                    ) : (
                        <div className="movies-grid">
                            {movies.map((movie, idx) => (
                                <MovieCard key={movie._id || movie.id} movie={movie} priority={idx < 6} />
                            ))}
                        </div>
                    )}
                 </>
             )}

             {/* Pagination */}
             {!moviesLoading && movies.length > 0 && !searchQuery && (
                 <div className="pagination" style={{display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '3rem'}}>
                    <button className="btn btn-outline" disabled={page<=1} onClick={() => setPage(p => p-1)}>← {t('previous')}</button>
                    <span style={{display: 'flex', alignItems: 'center', color: '#888', fontSize: '0.9rem'}}>Page {page}</span>
                    <button className="btn btn-outline" onClick={() => setPage(p => p+1)}>{t('next')} →</button>
                 </div>
             )}
          </div>

          {/* Sidebar Column (Independent Loading) */}
          <div className="sidebar">
              {!searchQuery && (
                  <div className="sidebar-section">
                      <h3 className="sidebar-title">{t('top_viewed')}</h3>
                      {topMoviesLoading ? (
                          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                              {[...Array(5)].map((_, i) => (
                                  <div key={i} className="skeleton" style={{width: '100%', height: '80px', borderRadius: '8px'}}></div>
                              ))}
                          </div>
                      ) : (
                          <div className="sidebar-list">
                              {topMovies.map(movie => (
                                  <div key={movie.id || movie._id} className="sidebar-item" onClick={() => navigate(`/movie/${movie.slug || movie.id}`)}>
                                      <img src={movie.thumb_url || movie.poster_url} className="sidebar-thumb" alt="" />
                                      <div className="sidebar-info">
                                          <h4 className="sidebar-movie-title">{movie.name}</h4>
                                          <div className="sidebar-movie-meta" style={{fontSize: '12px', color: '#666'}}>
                                              {getMovieYear(movie)} • 👁 {movie.viewCount || 'N/A'}
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
