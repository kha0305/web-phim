import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import { Analytics } from "@vercel/analytics/react";

import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import './components/BottomNav.css';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

// Lazy load pages
const Home = React.lazy(() => import('./pages/Home'));
const MovieDetail = React.lazy(() => import('./pages/MovieDetail'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const History = React.lazy(() => import('./pages/History'));
const Watchlist = React.lazy(() => import('./pages/Watchlist'));
const Profile = React.lazy(() => import('./pages/Profile'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const Catalog = React.lazy(() => import('./pages/Catalog'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const Schedule = React.lazy(() => import('./pages/Schedule'));

const LoadingFallback = () => (
  <div className="loading-container">
    <div className="spinner"></div>
  </div>
);

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <Navbar />
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/movie/:id" element={<MovieDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/history" element={<History />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <Footer />
          <BottomNav />
          <Analytics />
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
