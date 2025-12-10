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
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <Navbar />
          <div className="app-content">
             <DynamicRouter />
          </div>
          <Footer />
          <BottomNav />
          <Analytics />
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
