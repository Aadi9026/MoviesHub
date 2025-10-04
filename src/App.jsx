import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { useAuth } from './hooks/useAuth';
import Header from './components/Common/Header';
import Footer from './components/Common/Footer';
import HomePage from './pages/HomePage';
import VideoPage from './pages/VideoPage';
import AdminPage from './pages/AdminPage';
import LatestPage from './pages/LatestPage';
import TrendingPage from './pages/TrendingPage';
import LoadingSpinner from './components/Common/LoadingSpinner';
import SeoHead from './components/SEO/SeoHead';
import StructuredData, { generateWebsiteSchema } from './components/SEO/StructuredData';
import './App.css';

// Scroll to top component
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

function App() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <HelmetProvider>
      <div className="App">
        {/* Global SEO Head */}
        <SeoHead />
        <StructuredData data={generateWebsiteSchema()} />
        <ScrollToTop />
        
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/latest" element={<LatestPage />} />
            <Route path="/trending" element={<TrendingPage />} />
            <Route path="/video/:id" element={<VideoPage />} />
            <Route 
              path="/admin" 
              element={isAdmin ? <AdminPage /> : <Navigate to="/admin/login" replace />} 
            />
            <Route path="/admin/login" element={<AdminPage />} />
            
            {/* Handle direct video links - redirect to proper video page */}
            <Route path="/watch" element={<Navigate to="/" replace />} />
            <Route path="/movie" element={<Navigate to="/" replace />} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </HelmetProvider>
  );
}

export default App;
