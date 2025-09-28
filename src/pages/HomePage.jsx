import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVideos } from '../hooks/useVideos';
import VideoList from '../components/User/VideoList';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import AdSlot from '../components/Common/AdSlot';

const HomePage = () => {
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get('search');
  const { videos, loading, error, search } = useVideos();
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
      setDisplayVideos(safeVideos);
    } else {
      setDisplayVideos(safeVideos);
    }
  }, [searchTerm, safeVideos, search, lastSearchTerm]);

  // Update display videos when videos change
  useEffect(() => {
    setDisplayVideos(safeVideos);
  }, [safeVideos]);

  if (loading && !searchLoading) {
    return <LoadingSpinner text="Loading movies..." />;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          <p>Error: {error}</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">
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
        
        <div className="page-header">
          <h1>
            {searchTerm ? (
              <>
                Search Results for "{searchTerm}"
                {(searchLoading || loading) && (
                  <i className="fas fa-spinner fa-spin" style={{marginLeft: '10px'}}></i>
                )}
              </>
            ) : (
              'Featured Movies'
            )}
          </h1>
          
          {searchTerm && (
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
          )}
        </div>

        {searchLoading ? (
          <div className="search-loading">
            <LoadingSpinner text="Searching movies..." />
          </div>
        ) : (
          <VideoList videos={safeDisplayVideos} />
        )}

        <AdSlot position="footer" />
      </div>
    </div>
  );
};

export default HomePage;
