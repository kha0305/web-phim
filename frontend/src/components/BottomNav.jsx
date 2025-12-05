import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const BottomNav = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  // Only render on mobile
  // Note: We use CSS to hide/show, but we can also check window width if we wanted to avoid rendering DOM
  
  return (
    <div className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <span className="icon">🏠</span>
        <span className="label">{t('home')}</span>
      </NavLink>
      
      <NavLink to="/catalog" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <span className="icon">🧭</span>
        <span className="label">{t('explore_movies') || 'Khám Phá'}</span>
      </NavLink>

      <NavLink to="/watchlist" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <span className="icon">📋</span>
        <span className="label">{t('my_watchlist') || 'Tủ Phim'}</span>
      </NavLink>

      {user ? (
          <NavLink to="/profile" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
            <div className="bottom-nav-avatar">
               {user.avatar ? (
                   <img src={user.avatar} alt="Me" />
               ) : (
                   <span style={{fontSize: '1rem', fontWeight: 'bold'}}>{user.username?.charAt(0).toUpperCase()}</span>
               )}
            </div>
            <span className="label">{t('profile') || 'Cá nhân'}</span>
          </NavLink>
      ) : (
          <NavLink to="/login" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
            <span className="icon">👤</span>
            <span className="label">{t('login')}</span>
          </NavLink>
      )}
    </div>
  );
};

export default BottomNav;
