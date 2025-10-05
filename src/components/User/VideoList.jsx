import React from 'react';
import VideoCard from '../Common/VideoCard';
const VideoList = ({ videos, className = '' }) => {
  if (videos.length === 0) {
    return (
      <div className="empty-state">
        <i className="fas fa-film"></i>
        <h3>No movies found</h3>
        <p>Try adjusting your search or browse all movies</p>
      </div>
    );
  }
  return (
    <div className={`video-list ${className}`}>
      <div className={`video-grid ${className}`}>
        {videos.map(video => (
          <VideoCard 
            key={video.id} 
            video={{
              ...video,
              // Add trending class for CSS styling if video is trending
              className: video.trending ? 'trending' : ''
            }} 
          />
        ))}
      </div>
    </div>
  );
};
export default VideoList;
