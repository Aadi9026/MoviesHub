import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Header from './components/Common/Header';
import Footer from './components/Common/Footer'; // ADD THIS IMPORT
import HomePage from './pages/HomePage';
import VideoPage from './pages/VideoPage';
import AdminPage from './pages/AdminPage';
import LatestPage from './pages/LatestPage'; // ADD THIS IMPORT
import TrendingPage from './pages/TrendingPage'; // ADD THIS IMPORT
import LoadingSpinner from './components/Common/LoadingSpinner';
import './App.css';

function App() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="App">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/latest" element={<LatestPage />} /> {/* ADD THIS ROUTE */}
          <Route path="/trending" element={<TrendingPage />} /> {/* ADD THIS ROUTE */}
          <Route path="/video/:id" element={<VideoPage />} />
          <Route 
            path="/admin" 
            element={isAdmin ? <AdminPage /> : <Navigate to="/admin/login" replace />} 
          />
          <Route path="/admin/login" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer /> {/* ADD FOOTER HERE */}
    </div>
  );
}

export default App;
