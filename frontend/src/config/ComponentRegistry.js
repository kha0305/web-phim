import React from 'react';

const Registry = {
  Home: React.lazy(() => import('../pages/Home')),
  MovieDetail: React.lazy(() => import('../pages/MovieDetail')),
  Login: React.lazy(() => import('../pages/Login')),
  Register: React.lazy(() => import('../pages/Register')),
  History: React.lazy(() => import('../pages/History')),
  Watchlist: React.lazy(() => import('../pages/Watchlist')),
  Profile: React.lazy(() => import('../pages/Profile')),
  ForgotPassword: React.lazy(() => import('../pages/ForgotPassword')),
  Catalog: React.lazy(() => import('../pages/Catalog')),
  NotFound: React.lazy(() => import('../pages/NotFound')),
  AdminDashboard: React.lazy(() => import('../pages/AdminDashboard')),
  Schedule: React.lazy(() => import('../pages/Schedule')),
  PrivacyPolicy: React.lazy(() => import('../pages/PrivacyPolicy')),
};

export default Registry;
