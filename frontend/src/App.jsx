import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import { Analytics } from "@vercel/analytics/react";

import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import './components/BottomNav.css';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import DynamicRouter from './shared/components/DynamicRouter';

function App() {
  const isAdminRoute = window.location.pathname.startsWith('/admin');

  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          {!isAdminRoute && <Navbar />}
          <div className={isAdminRoute ? '' : "app-content"}>
             <DynamicRouter />
          </div>
          {!isAdminRoute && <Footer />}
          {!isAdminRoute && <BottomNav />}
          <Analytics />
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
