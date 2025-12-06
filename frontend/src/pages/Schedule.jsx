import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import MovieCard from '../components/MovieCard';
import { useLanguage } from '../context/LanguageContext';
import useDocumentTitle from '../hooks/useDocumentTitle';

const Schedule = () => {
  const { t } = useLanguage();
  useDocumentTitle(`${t('schedule')} - PhimChill`); // Requires 'schedule' in translation
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('day'); // 'day', 'week', 'month'
  const [groupedMovies, setGroupedMovies] = useState({});

  useEffect(() => {
    // Force scroll to top when component mounts
    window.scrollTo(0, 0);

    const fetchMovies = async () => {
      try {
        setLoading(true);
        // We'll fetch "Phim bộ" (Series) as they are the ones usually having schedules
        // Since no dedicated schedule API, fetch a larger list
        const response = await axios.get('/movies/list/phim-bo?page=1&limit=60');
        
        if (response.data && response.data.items) {
           const items = response.data.items;
           
           // SIMULATED GROUPING LOGIC
           // In a real app, 'movie.show_time' or similar field is needed.
           // Here we will randomly assign time slots based on index for demonstration
           // or use 'modified' time if available.
           
           const now = new Date();
           const groups = {
             day: [], // Today
             week: {}, // Grouped by Day Name (Mon, Tue...)
             month: [] // List for month
           };

           // Days mapping
           const daysOfWeek = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

           items.forEach((movie, index) => {
              // Simulated schedule data
              // We'll assume the most recent ones are 'Today'
              const updatedTime = new Date(movie.modified?.time || Date.now());
              const dayIndex = updatedTime.getDay();
              
              // For 'Day' tab: Show movies updated today + specific time slots
              // Simulating time slots: 10:00, 12:00, 19:00, 21:00 based on index
              const hours = [10, 12, 18, 20, 21, 22]; 
              const randomHour = hours[index % hours.length];
              const timeSlot = `${randomHour}:00`;

              if (index < 12) { // Top 12 newest -> Today
                 groups.day.push({ ...movie, timeSlot });
              }

              // For 'Week' tab: Group by day of week
              // We distribute them across the week for demo
              const weekDay = daysOfWeek[(dayIndex + index) % 7]; 
              if (!groups.week[weekDay]) groups.week[weekDay] = [];
              groups.week[weekDay].push({ ...movie, timeSlot });
              
              // For 'Month' tab: Just a list
              groups.month.push(movie);
           });
           
           // Sort 'Day' items by time
           groups.day.sort((a, b) => parseInt(a.timeSlot) - parseInt(b.timeSlot));

           setGroupedMovies(groups);
        }
      } catch (error) {
        console.error("Failed to fetch schedule movies", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  const renderContent = () => {
    if (activeTab === 'day') {
      // Group by Time Slot
      const slots = {};
      groupedMovies.day?.forEach(m => {
        if (!slots[m.timeSlot]) slots[m.timeSlot] = [];
        slots[m.timeSlot].push(m);
      });

      return Object.keys(slots).sort((a, b) => parseInt(a) - parseInt(b)).map(time => (
        <div key={time} style={{marginBottom: '2rem'}}>
          <h3 style={{
            borderLeft: '4px solid #4caf50', 
            paddingLeft: '1rem', 
            color: '#fff',
            marginBottom: '1rem'
          }}>
            {time}
          </h3>
          <div className="movie-grid">
            {slots[time].map(movie => (
               <MovieCard key={movie._id} movie={movie} />
            ))}
          </div>
        </div>
      ));
    }

    if (activeTab === 'week') {
      // Order days: start from Today? Or fix mon-sun. Let's fix Mon-Sun + Sun at end?
      // standard: T2, T3, ... CN
      const order = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
      
      return order.map(day => {
        const moviesInDay = groupedMovies.week?.[day] || [];
        if (moviesInDay.length === 0) return null;

        return (
          <div key={day} style={{marginBottom: '2.5rem'}}>
            <div style={{
              background: 'linear-gradient(90deg, #4caf50 0%, transparent 100%)',
              padding: '10px 15px',
              borderRadius: '4px',
              marginBottom: '1rem'
            }}>
              <h3 style={{margin: 0, color: 'white'}}>{day}</h3>
            </div>
            <div className="movie-grid">
               {moviesInDay.map(movie => (
                 <MovieCard key={movie._id} movie={movie} />
               ))}
            </div>
          </div>
        );
      });
    }

    if (activeTab === 'month') {
       return (
         <div className="movie-grid">
           {groupedMovies.month?.map(movie => (
              <MovieCard key={movie._id} movie={movie} />
           ))}
         </div>
       );
    }
  };

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
        {t('schedule') || "Lịch Chiếu Phim"}
      </h1>

      {/* Tabs */}
      <div style={{display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #333', paddingBottom: '10px'}}>
        {['day', 'week', 'month'].map(tab => (
           <button
             key={tab}
             onClick={() => setActiveTab(tab)}
             style={{
               background: 'none',
               border: 'none',
               color: activeTab === tab ? '#4caf50' : '#aaa',
               fontSize: '1.2rem',
               fontWeight: 'bold',
               cursor: 'pointer',
               padding: '10px 20px',
               borderBottom: activeTab === tab ? '2px solid #4caf50' : 'none',
               marginBottom: '-11px'
             }}
           >
             {tab === 'day' && (t('today') || 'Hôm Nay')}
             {tab === 'week' && (t('this_week') || 'Trong Tuần')}
             {tab === 'month' && (t('this_month') || 'Trong Tháng')}
           </button>
        ))}
      </div>

      {/* Content */}
      <div style={{minHeight: '400px'}}>
         {renderContent()}
      </div>
    </div>
  );
};

export default Schedule;
