import React from 'react';
import VideoCard from '../Common/VideoCard';
import LatestMovieCard from './LatestMovieCard'; // Import the horizontal card component

const VideoList = ({ videos, className = '', layout = 'vertical' }) => {
  if (videos.length === 0) {
    return (
      <div className="empty-state">
        <i className="fas fa-film"></i>
        <h3>No movies found</h3>
        <p>Try adjusting your search or browse all movies</p>
      </div>
    );
  }

  // Use horizontal layout for latest section
  if (layout === 'horizontal' || className.includes('latest-grid')) {
    return (
      <div className={`latest-movies-grid ${className}`}>
        {videos.map(video => (
          <LatestMovieCard 
            key={video.id} 
            video={video}
          />
        ))}
      </div>
    );
  }

  // Default vertical layout for all other sections
  return (
    <div className={`video-list ${className}`}>
      <div className={`video-grid ${className}`}>
        {videos.map(video => (
          <VideoCard 
            key={video.id} 
            video={{
              ...video,
              className: video.trending ? 'trending' : ''
            }} 
          />
        ))}
      </div>
    </div>
  );
};

export default VideoList;
