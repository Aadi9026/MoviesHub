import React from 'react';
import { Link } from 'react-router-dom';
import { formatDuration, formatViews } from '../../utils/helpers';

const VideoCard = ({ video }) => {
  const { id, title, thumbnail, duration, views, genre, createdAt } = video;

  // Simple date formatting function inside component
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <div className="video-card">
      <Link to={`/video/${id}`}>
        <div className="thumbnail-container">
          <img src={thumbnail} alt={title} className="thumbnail" />
          <div className="video-duration">{formatDuration(duration)}</div>
        </div>
      </Link>
      
      <div className="video-info-container">
        <div className="video-details">
          <Link to={`/video/${id}`}>
            <h3 className="video-title">{title}</h3>
          </Link>
          <div className="video-meta">
            <span>{formatViews(views)} views</span>
            <span className="separator"> • </span>
            <span>{formatDate(createdAt)}</span>
            {genre && (
              <>
                <span className="separator"> • </span>
                <span className="genre-tag">{genre}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
