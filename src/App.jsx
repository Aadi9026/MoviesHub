import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Header from './components/Common/Header';
import BottomNavigation from './components/Common/BottomNavigation';
import HomePage from './pages/HomePage';
import LatestMovies from './pages/LatestMovies';
import TrendingMovies from './pages/TrendingMovies';
import VideoPage from './pages/VideoPage';
import AdminPage from './pages/AdminPage';
import LoadingSpinner from './components/Common/LoadingSpinner';
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
    <div className="App">
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
  );
}

export default App;
