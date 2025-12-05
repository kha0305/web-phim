import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from '../api/axios';
import MovieCard from '../components/MovieCard';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useLanguage } from '../context/LanguageContext';

const Catalog = () => {
  useDocumentTitle('Kho Phim - PhimChill');
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useLanguage();

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [genres, setGenres] = useState([]);
  const [countries, setCountries] = useState([]);
  const years = Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i); // 2024 to 2010

  // Filter States
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get('genre') || '');
  const [selectedCountry, setSelectedCountry] = useState(searchParams.get('country') || '');
  const [selectedYear, setSelectedYear] = useState(searchParams.get('year') || '');

  useEffect(() => {
    // Fetch filter options
    const fetchOptions = async () => {
      try {
        const [gRes, cRes] = await Promise.all([
           axios.get('/genres'),
           axios.get('/countries')
        ]);
        setGenres(gRes.data || []);
        setCountries(cRes.data || []);
      } catch (err) {
        console.error("Failed to fetch filter options", err);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    // Update URL params
    const params = {};
    if (selectedGenre) params.genre = selectedGenre;
    if (selectedCountry) params.country = selectedCountry;
    if (selectedYear) params.year = selectedYear;
    setSearchParams(params);
    setPage(1); // Reset page on filter change
  }, [selectedGenre, selectedCountry, selectedYear]);

  const fetchMovies = React.useCallback(async () => {
    setLoading(true);
    try {
      let endpoint = '/movies/popular'; 
      // API currently only supports ONE filter efficiently. Prioritize: Year > Country > Genre
      // Or just switch endpoint based on selection.
      
      if (selectedYear) {
         endpoint = `/movies/year/${selectedYear}`;
      } else if (selectedCountry) {
         endpoint = `/movies/country/${selectedCountry}`;
      } else if (selectedGenre) {
         endpoint = `/movies/genre/${selectedGenre}`;
      }

      const response = await axios.get(endpoint, { params: { page } });
      
      if (response.data.items) {
          setMovies(response.data.items);
          // Estimate total pages (API might provide pagination info, otherwise guess)
          // PhimAPI usually returns params: { pagination: { totalItems, totalItemsPerPage, ... } }
          const pagination = response.data.params?.pagination;
          if (pagination) {
             setTotalPages(Math.ceil(pagination.totalItems / pagination.totalItemsPerPage));
          } else {
             setTotalPages(10); // Fallback
          }
      } else {
          setMovies([]);
      }
    } catch (error) {
      console.error("Error fetching movies:", error);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, [page, selectedGenre, selectedCountry, selectedYear]);

  useEffect(() => {
    fetchMovies();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchMovies]);

  return (
    <div className="container" style={{ marginTop: '80px', minHeight: '80vh' }}>
      <div className="catalog-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{t('explore_movies') || 'Khám Phá Phim'}</h1>
        
        {/* Filter Bar */}
        <div className="filter-bar" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          
          {/* Genre Select */}
          <select 
            value={selectedGenre} 
            onChange={(e) => { setSelectedGenre(e.target.value); setSelectedCountry(''); setSelectedYear(''); }}
            className="filter-select"
          >
            <option value="">{t('all_genres') || 'Tất cả thể loại'}</option>
            {genres.map(g => (
              <option key={g.slug} value={g.slug}>{g.name}</option>
            ))}
          </select>

          {/* Country Select */}
          <select 
            value={selectedCountry} 
            onChange={(e) => { setSelectedCountry(e.target.value); setSelectedGenre(''); setSelectedYear(''); }}
            className="filter-select"
          >
            <option value="">{t('all_countries') || 'Tất cả quốc gia'}</option>
            {countries.map(c => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>

           {/* Year Select */}
           <select 
            value={selectedYear} 
            onChange={(e) => { setSelectedYear(e.target.value); setSelectedGenre(''); setSelectedCountry(''); }}
            className="filter-select"
          >
            <option value="">{t('all_years') || 'Tất cả năm'}</option>
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <button 
             onClick={() => { setSelectedGenre(''); setSelectedCountry(''); setSelectedYear(''); }}
             style={{ padding: '8px 16px', background: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Reset
          </button>
        </div>
        <p style={{marginTop: '10px', fontSize: '0.9rem', color: '#888'}}>
           * Lưu ý: Hiện tại hệ thống hỗ trợ lọc theo 1 tiêu chí ưu tiên (Năm {'>'} Quốc gia {'>'} Thể loại).
        </p>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner"></div></div>
      ) : (
        <>
           <div className="movie-grid">
            {movies.map(movie => (
              <MovieCard key={movie._id || movie.id} movie={movie} />
            ))}
          </div>
          
          {/* Pagination */}
          <div className="pagination" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              className="btn"
              style={{ background: page === 1 ? '#333' : 'var(--primary-color)' }}
            >
              Prev
            </button>
            <span style={{ display: 'flex', alignItems: 'center' }}>
               Page {page} / {totalPages > 0 ? totalPages : '?'}
            </span>
            <button 
              disabled={page >= totalPages} 
              onClick={() => setPage(p => p + 1)}
              className="btn"
               style={{ background: page >= totalPages ? '#333' : 'var(--primary-color)' }}
            >
              Next
            </button>
          </div>
        </>
      )}

      <style jsx>{`
        .filter-select {
          padding: 8px 12px;
          background: #1a1a1a;
          color: white;
          border: 1px solid #333;
          border-radius: 4px;
          min-width: 150px;
        }
      `}</style>
    </div>
  );
};

export default Catalog;
