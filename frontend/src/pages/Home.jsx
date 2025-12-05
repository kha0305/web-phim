import React, { useState, useEffect } from 'react';
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

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get('search');
  const genreParam = searchParams.get('genre');
  const typeParam = searchParams.get('type');
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [genres, setGenres] = useState([]);
  const [topMovies, setTopMovies] = useState([]);
  const [bannerMovies, setBannerMovies] = useState([]);
  const [page, setPage] = useState(1);
  
  const [history, setHistory] = useState([]);
  const [watchlist, setWatchlist] = useState([]);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await axios.get('/genres');
        setGenres(response.data);
      } catch (error) {
        console.error("Error fetching genres:", error);
      }
    };
    fetchGenres();
  }, []);

  // Fetch User Data (History & Watchlist)
  useEffect(() => {
    if (user && !searchQuery && !genreParam && !typeParam) {
      const fetchUserData = async () => {
        try {
          const [historyRes, watchlistRes] = await Promise.all([
            axios.get(`/history/${user.id}`),
            axios.get(`/watchlist/${user.id}`)
          ]);
          setHistory(historyRes.data.slice(0, 10)); // Limit to 10
          setWatchlist(watchlistRes.data.slice(0, 10)); // Limit to 10
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      };
      fetchUserData();
    } else if (!user && !searchQuery && !genreParam && !typeParam) {
      // Load history from localStorage for non-logged in users
      try {
        const localHistory = JSON.parse(localStorage.getItem('watchHistory') || '[]');
        setHistory(localHistory.slice(0, 10));
        setWatchlist([]); // No local watchlist for now
      } catch (e) {
        console.error("Error loading local history:", e);
        setHistory([]);
      }
    } else {
      setHistory([]);
      setWatchlist([]);
    }
  }, [user, searchQuery, genreParam, typeParam]);

  // Reset page when genre or type changes
  useEffect(() => {
    setPage(1);
  }, [genreParam, typeParam]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page, genreParam, typeParam, searchQuery]);

  // Update Document Title
  useEffect(() => {
    if (searchQuery) {
      document.title = `Tìm kiếm: ${searchQuery} - PhimChill`;
    } else if (genreParam) {
      const genre = genres.find(g => g.slug === genreParam);
      document.title = genre ? `${genre.name} - PhimChill` : 'PhimChill';
    } else if (typeParam) {
      document.title = typeParam === 'phim-le' ? 'Phim Lẻ - PhimChill' : 'Phim Bộ - PhimChill';
    } else {
      document.title = 'PhimChill - Xem Phim Online';
    }
  }, [searchQuery, genreParam, typeParam, genres]);

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      try {
        let response;
        
        if (searchQuery) {
          response = await axios.get('/movies/search', {
            params: { query: searchQuery }
          });
          setMovies(response.data.items || []);
        } else if (genreParam) {
          response = await axios.get(`/movies/genre/${genreParam}`, {
            params: { page }
          });
          setMovies(response.data.items || []);
        } else if (typeParam) {
          response = await axios.get(`/movies/list/${typeParam}`, {
            params: { page }
          });
          setMovies(response.data.items || []);
        } else {
          // Fetch both popular and top viewed independently to prevent one failure from breaking the page
          let popularItems = [];
          let topItems = [];

          try {
            const popularRes = await axios.get(`/movies/popular`, { params: { page } });
            popularItems = popularRes.data.items || [];
          } catch (e) {
            console.error("Failed to fetch popular movies:", e);
          }

          try {
            const topRes = await axios.get(`/movies/top-viewed`);
            topItems = topRes.data || [];
          } catch (e) {
            console.error("Failed to fetch top viewed movies:", e);
          }

          // Fallback: If no top viewed data (new app or error), use popular movies
          if (topItems.length === 0 && popularItems.length > 0) {
            topItems = popularItems.slice(0, 10);
          }

          setMovies(popularItems);
          setTopMovies(topItems);
          
          
          if (popularItems.length > 0) {
            setBannerMovies(popularItems);
            const random = Math.floor(Math.random() * Math.min(5, popularItems.length));
            const featuredBasic = popularItems[random];
            
            // Try to fetch full details for featured movie
            try {
              const featuredFull = await axios.get(`/movies/${featuredBasic.slug}`);
              setFeaturedMovie(featuredFull.data);
            } catch (e) {
              console.error("Error fetching featured movie details:", e);
              setFeaturedMovie(featuredBasic);
            }
          }
        }

        // Always ensure sidebar has data (if not already set by top-viewed logic above)
        // If we are in genre/search/type view, we might want to show "Recently Updated" in sidebar
        if (genreParam || typeParam || searchQuery) {
           const popularRes = await axios.get(`/movies/popular`, { params: { page: 1 } });
           setTopMovies(popularRes.data.items ? popularRes.data.items.slice(0, 10) : []);
        }
      } catch (error) {
        console.error("Error fetching movies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [searchQuery, language, genreParam, typeParam, page]);

  useEffect(() => {
    if (bannerMovies.length === 0 || searchQuery || genreParam) return;

    const interval = setInterval(async () => {
      const random = Math.floor(Math.random() * Math.min(10, bannerMovies.length));
      const nextMovie = bannerMovies[random];
      
      if (!nextMovie) return; // Safety check

      try {
        const featuredFull = await axios.get(`/movies/${nextMovie.slug}`);
        if (featuredFull.data) {
             setFeaturedMovie(featuredFull.data);
        } else {
             setFeaturedMovie(nextMovie);
        }
      } catch (e) {
        // console.warn("Could not fetch full details for featured movie, using basic info.");
        setFeaturedMovie(nextMovie);
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [bannerMovies, searchQuery, genreParam]);

  if (loading) {
    return (
      <div>
        {/* Hero Skeleton */}
        {!searchQuery && !genreParam && (
          <div className="hero" style={{ background: '#1a1a1a' }}>
            <div className="container hero-content">
              <div className="skeleton skeleton-text" style={{ height: '4rem', width: '50%', marginBottom: '1rem' }}></div>
              <div className="skeleton skeleton-text" style={{ height: '1.2rem', width: '70%', marginBottom: '0.5rem' }}></div>
              <div className="skeleton skeleton-text" style={{ height: '1.2rem', width: '60%', marginBottom: '2rem' }}></div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="skeleton" style={{ width: '150px', height: '50px', borderRadius: '4px' }}></div>
                <div className="skeleton" style={{ width: '150px', height: '50px', borderRadius: '4px' }}></div>
              </div>
            </div>
          </div>
        )}

        <main className="container">
          {/* Genre Skeleton */}
          <div className="skeleton skeleton-text" style={{ width: '100%', height: '3rem', marginBottom: '2rem', borderRadius: '50px' }}></div>

          {/* Top Viewed Skeleton */}
          {!searchQuery && !genreParam && (
            <div style={{ marginBottom: '3rem' }}>
              <div className="skeleton skeleton-text" style={{ width: '200px', height: '2rem', marginBottom: '1.5rem' }}></div>
              <div className="movie-grid">
                {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            </div>
          )}

          {/* Popular/Search Skeleton */}
          <div className="skeleton skeleton-text" style={{ width: '200px', height: '2rem', marginBottom: '1.5rem' }}></div>
          <div className="movie-grid">
            {[...Array(10)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div>
      {!searchQuery && !genreParam && featuredMovie && (
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
                <span className="year-badge">
                  {getMovieYear(featuredMovie) || 'N/A'}
                </span>
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
                  <span style={{marginRight: '8px'}}>▶</span> {t('watch_now')}
                </button>
                <button 
                  className="btn btn-outline hero-btn" 
                  onClick={() => navigate(`/movie/${featuredMovie.slug || featuredMovie.id}`)}
                >
                  <span style={{marginRight: '8px'}}>ℹ</span> {t('more_info')}
                </button>
              </div>
            </div>
            
            <div className="hero-poster-wrapper">
              <img 
                src={featuredMovie.poster_url || featuredMovie.thumb_url} 
                alt={featuredMovie.name} 
                className="hero-poster"
              />
            </div>
          </div>
        </header>
      )}

      <main className="container">
        {/* Genre Filter */}
        {!searchQuery && (
          <div className="genre-container">
            <button 
              className={`genre-pill ${!genreParam ? 'active' : ''}`}
              onClick={() => navigate('/')}
            >
              {t('popular')}
            </button>
            {genres.map(genre => (
              <button 
                key={genre._id || genre.slug}
                className={`genre-pill ${genreParam === genre.slug ? 'active' : ''}`}
                onClick={() => navigate(`/?genre=${genre.slug}`)}
              >
                {t(genre.slug) !== genre.slug ? t(genre.slug) : genre.name}
              </button>
            ))}
          </div>
        )}

        <div className="home-layout">
          {/* Main Content Column */}
          <div className="main-content">
            
            {/* Continue Watching Section */}
            {history.length > 0 && (
              <div className="continue-watching-section">
                <h2 className="section-title">{t('watch_history')}</h2>
                <div className="horizontal-scroll-container">
                  {history.map(movie => (
                    <HistoryCard key={movie.movieId || movie._id || movie.id} movie={movie} />
                  ))}
                </div>
              </div>
            )}

            {/* Favorites Section */}
            {watchlist.length > 0 && (
              <div style={{ marginBottom: '3rem' }}>
                <h2 className="section-title">{t('my_watchlist')}</h2>
                <div className="movie-grid">
                  {watchlist.map(movie => (
                    <div key={movie._id || movie.id}>
                      <MovieCard movie={movie} priority={true} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h2 className="section-title">
              {searchQuery 
                ? `${t('search_results')} "${searchQuery}"` 
                : genreParam 
                  ? (t(genreParam) !== genreParam ? t(genreParam) : (genres.find(g => g.slug === genreParam)?.name || genreParam))
                  : typeParam
                    ? (typeParam === 'phim-le' ? t('movies_single') : t('movies_series'))
                    : t('latest_movies')}
            </h2>
            
            {movies.length === 0 ? (
              <p>{t('movie_not_found')}</p>
            ) : (
              <div className="movie-grid">
                {movies.map((movie, index) => (
                  <MovieCard key={movie._id || movie.id} movie={movie} priority={index < 10} />
                ))}
              </div>
            )}
            
            {/* Pagination Controls */}
            {!searchQuery && movies.length > 0 && (
              <div className="pagination" style={{display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '3rem'}}>
                 <button 
                   className="btn btn-outline"
                   disabled={page <= 1}
                   onClick={() => setPage(prev => Math.max(1, prev - 1))}
                 >
                   ← {t('previous')}
                 </button>
                 <span style={{display: 'flex', alignItems: 'center', color: '#fff'}}>
                   {t('page')} {page}
                 </span>
                 <button 
                   className="btn btn-outline"
                   onClick={() => setPage(prev => prev + 1)}
                 >
                   {t('next')} →
                 </button>
              </div>
            )}
          </div>

          {/* Sidebar Column */}
          <div className="sidebar">
            {!searchQuery && topMovies.length > 0 && (
              <div className="sidebar-section">
                <h3 className="sidebar-title">
                  {genreParam ? t('recently_updated') : t('top_viewed')}
                </h3>
                <div className="sidebar-list">
                  {topMovies.map(movie => (
                    <div 
                      key={movie._id || movie.id} 
                      className="sidebar-item"
                      onClick={() => navigate(`/movie/${movie.slug || movie.id}`)}
                    >
                      <img 
                        src={movie.thumb_url || movie.poster_url} 
                        alt={movie.name} 
                        className="sidebar-thumb"
                      />
                      <div className="sidebar-info">
                        <h4 className="sidebar-movie-title">{movie.name}</h4>
                        <div className="sidebar-movie-meta">
                          {(() => {
                            const duration = movie.time && movie.time !== '0' ? movie.time.replace(' phút', 'p') : '';
                            const episode = movie.episode_current || '';
                            const metaText = [episode, duration].filter(Boolean).join(' • ');
                            
                            const year = getMovieYear(movie);

                            return [metaText, year].filter(Boolean).join(' • ');
                          })()}
                        </div>
                        {!genreParam && (
                          <div className="sidebar-views">
                            <span>👁</span> {movie.viewCount || 0}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
