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
  const [filteredVideos, setFilteredVideos] = useState([]);

  useEffect(() => {
    if (searchTerm) {
      search(searchTerm);
    } else {
      setFilteredVideos(videos);
    }
  }, [searchTerm, videos, search]);

  if (loading) return <LoadingSpinner text="Loading movies..." />;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="home-page">
      <div className="container">
        <AdSlot position="header" />
        
        <div className="page-header">
          <h1>
            {searchTerm ? `Search Results for "${searchTerm}"` : 'Featured Movies'}
          </h1>
          {searchTerm && (
            <p className="results-count">
              Found {filteredVideos.length} movies
            </p>
          )}
        </div>

        <VideoList videos={filteredVideos} />

        <AdSlot position="footer" />
      </div>
    </div>
  );
};

export default HomePage;
