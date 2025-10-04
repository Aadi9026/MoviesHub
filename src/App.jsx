import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { useAuth } from './hooks/useAuth';
import Header from './components/Common/Header';
import BottomNavigation from './components/Common/BottomNavigation';
import HomePage from './pages/HomePage';
import LoadingSpinner from './components/Common/LoadingSpinner';
import SeoHead from './components/SEO/SeoHead';
import StructuredData, { generateWebsiteSchema } from './components/SEO/StructuredData';
import './App.css';

// Lazy load pages for better performance
const LatestMovies = lazy(() => import('./pages/LatestMovies'));
const TrendingMovies = lazy(() => import('./pages/TrendingMovies'));
const VideoPage = lazy(() => import('./pages/VideoPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

// Scroll to top component
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
  }, [pathname]);

  return null;
};

function App() {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();
  
  // Don't show bottom navigation on admin pages
  const showBottomNav = !location.pathname.includes('/admin');
  
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
          <Suspense fallback={<LoadingSpinner />}>
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
              
              {/* Handle direct video links - redirect to home */}
              <Route path="/watch" element={<Navigate to="/" replace />} />
              <Route path="/movie" element={<Navigate to="/" replace />} />
              
              {/* Catch all unmatched routes */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
        {showBottomNav && <BottomNavigation />}
      </div>
    </HelmetProvider>
  );
}

export default App;
