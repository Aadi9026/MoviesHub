import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVideos } from '../hooks/useVideos';
import VideoList from '../components/User/VideoList';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import AdSlot from '../components/Common/AdSlot';

const HomePage = () => {
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get('search');
  const { videos, loading, error, search, loadRandomVideos } = useVideos();
  const [displayVideos, setDisplayVideos] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [lastSearchTerm, setLastSearchTerm] = useState('');

  // Ensure videos is always an array
  const safeVideos = Array.isArray(videos) ? videos : [];

  useEffect(() => {
    if (searchTerm && searchTerm !== lastSearchTerm) {
      setSearchLoading(true);
      setLastSearchTerm(searchTerm || '');
      search(searchTerm || '').finally(() => {
        setSearchLoading(false);
      });
    } else if (!searchTerm && lastSearchTerm) {
      setLastSearchTerm('');
      // Load random videos when returning from search
      loadRandomVideos();
    } else if (!searchTerm) {
      // Load random videos on first load or refresh
      if (safeVideos.length === 0) {
        loadRandomVideos();
      }
    }
  }, [searchTerm, search, lastSearchTerm, loadRandomVideos]);

  // Update display videos when videos change
  useEffect(() => {
    if (!searchTerm) {
      // For home page, shuffle the videos for random experience
      const shuffled = [...safeVideos].sort(() => Math.random() - 0.5);
      setDisplayVideos(shuffled);
    } else {
      setDisplayVideos(safeVideos);
    }
  }, [safeVideos, searchTerm]);

  // Auto-refresh home page with new random movies every time user comes back
  useEffect(() => {
    if (!searchTerm) {
      const interval = setInterval(() => {
        loadRandomVideos();
      }, 300000); // Refresh every 5 minutes

      return () => clearInterval(interval);
    }
  }, [searchTerm, loadRandomVideos]);

  if (loading && !searchLoading) {
    return <LoadingSpinner text="Loading movies..." />;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          <p>Error: {error}</p>
          <button onClick={loadRandomVideos} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const safeDisplayVideos = Array.isArray(displayVideos) ? displayVideos : [];

  return (
    <div className="home-page">
      <div className="container">
        <AdSlot position="header" />
        
        {/* ONLY SHOW HEADER FOR SEARCH RESULTS */}
        {searchTerm && (
          <div className="page-header">
            <h1>
              Search Results for "{searchTerm}"
              {(searchLoading || loading) && (
                <i className="fas fa-spinner fa-spin" style={{marginLeft: '10px'}}></i>
              )}
            </h1>
            
            <div className="search-results-info">
              <p className="results-count">
                Found {safeDisplayVideos.length} {safeDisplayVideos.length === 1 ? 'movie' : 'movies'}
                {searchLoading && '...'}
              </p>
              {safeDisplayVideos.length === 0 && !searchLoading && (
                <p className="no-results-help">
                  Try different keywords or browse all movies
                </p>
              )}
            </div>
          </div>
        )}

        {searchLoading ? (
          <div className="search-loading">
            <LoadingSpinner text="Searching movies..." />
          </div>
        ) : (
          <VideoList videos={safeDisplayVideos} className="home-grid" />
        )}
        
        <AdSlot position="footer" />
      </div>
    </div>
  );
};

export default HomePage;
