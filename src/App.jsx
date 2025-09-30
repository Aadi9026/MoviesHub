import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { VideoProvider, useVideoContext } from './contexts/VideoContext';
import MiniPlayer from './components/Common/MiniPlayer';
import Header from './components/Common/Header';
import BottomNavigation from './components/Common/BottomNavigation';
import HomePage from './pages/HomePage';
import LatestMovies from './pages/LatestMovies';
import TrendingMovies from './pages/TrendingMovies';
import VideoPage from './pages/VideoPage';
import AdminPage from './pages/AdminPage';
import LoadingSpinner from './components/Common/LoadingSpinner';
import { useAuth } from './hooks/useAuth';
import './App.css';

const AppContent = () => {
  const location = useLocation();
  const { currentVideo, isMiniPlayerVisible, showMiniPlayer } = useVideoContext();
  const { user, isAdmin, loading } = useAuth();
  
  const showBottomNav = !location.pathname.includes('/admin');
  
  useEffect(() => {
    if (!location.pathname.startsWith('/video/') && currentVideo) {
      showMiniPlayer();
    }
  }, [location, currentVideo, showMiniPlayer]);

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
      {isMiniPlayerVisible && <MiniPlayer />}
    </div>
  );
};

function App() {
  return (
    <VideoProvider>
      <AppContent />
    </VideoProvider>
  );
}

export default App;
