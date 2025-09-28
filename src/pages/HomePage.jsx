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
  const [searchLoading, setSearchLoading] = useState(false);

  // Shuffle videos for random display (like YouTube)
  const shuffleVideos = (videosArray) => {
    if (!videosArray || videosArray.length === 0) return [];
    
    const shuffled = [...videosArray];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    if (searchTerm) {
      setSearchLoading(true);
      search(searchTerm).finally(() => setSearchLoading(false));
    } else {
      // Show random videos when no search term
      setFilteredVideos(shuffleVideos(videos));
    }
  }, [searchTerm, videos]);

  useEffect(() => {
    setFilteredVideos(videos);
  }, [videos]);

  if (loading) return <LoadingSpinner text="Loading movies..." />;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="home-page">
      <div className="container">
        <AdSlot position="header" />
        
        <div className="page-header">
          <h1>
            {searchTerm ? (
              <>
                Search Results for "{searchTerm}"
                {searchLoading && <i className="fas fa-spinner fa-spin"></i>}
              </>
            ) : (
              '' // REMOVED "Featured Movies" TEXT
            )}
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
