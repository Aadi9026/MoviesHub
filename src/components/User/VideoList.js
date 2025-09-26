import React from 'react';
import VideoCard from '../Common/VideoCard';

const VideoList = ({ videos }) => {
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
    <div className="video-list">
      <div className="video-grid">
        {videos.map(video => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
};

export default VideoList;
