import React from 'react';
import { Link } from 'react-router-dom';
import { formatViews, formatDuration } from '../../utils/helpers';

const VideoCard = ({ video }) => {
  const { id, title, thumbnail, duration, views, genre, createdAt } = video;

  // Format date function
  const formatDate = (date) => {
    if (!date) return 'Recently';
    
    const videoDate = date.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now - videoDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <div className="video-card">
      <Link to={`/video/${id}`} className="video-card-link">
        <div className="thumbnail-container">
          <img 
            src={thumbnail} 
            alt={title}
            className="thumbnail"
            loading="lazy"
          />
          <div className="video-duration">{formatDuration(duration || 120)}</div>
        </div>
        
        <div className="video-info-container">
          <div className="video-details">
            <h3 className="video-title" title={title}>
              {title}
            </h3>
            
            <div className="video-meta">
              <span>{formatViews(views || 0)} views</span>
              <span className="separator">•</span>
              <span>{formatDate(createdAt)}</span>
              {genre && (
                <span className="genre-tag">{genre}</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default VideoCard;
