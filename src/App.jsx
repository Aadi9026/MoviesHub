import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async'; // ADD THIS IMPORT
import { useAuth } from './hooks/useAuth';
import Header from './components/Common/Header';
import BottomNavigation from './components/Common/BottomNavigation';
import HomePage from './pages/HomePage';
import LatestMovies from './pages/LatestMovies';
import TrendingMovies from './pages/TrendingMovies';
import VideoPage from './pages/VideoPage';
import AdminPage from './pages/AdminPage';
import LoadingSpinner from './components/Common/LoadingSpinner';
import SeoHead from './components/SEO/SeoHead'; // ADD THIS IMPORT
import StructuredData, { generateWebsiteSchema } from './components/SEO/StructuredData'; // ADD THIS IMPORT
import './App.css';

function App() {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();
  
  // Don't show bottom navigation on admin pages
  const showBottomNav = !location.pathname.includes('/admin');
  
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <HelmetProvider> {/* WRAP WITH HelmetProvider */}
      <div className="App">
        {/* Global SEO Head */}
        <SeoHead />
        <StructuredData data={generateWebsiteSchema()} />
        
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/latest" element={<LatestMovies />} />
            <Route path="/trending" element={<TrendingMovies />} />
            <Route path="/video/:id" element={<VideoPage />} />
            <Route
              path="/admin"
              element={isAdmin ? <AdminPage /> : <Navigate to="/admin/login" replace />}
            />
            <Route path="/admin/login" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        {showBottomNav && <BottomNavigation />}
      </div>
    </HelmetProvider>
  );
}

export default App;
