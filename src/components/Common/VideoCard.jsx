import React from 'react';
import { Link } from 'react-router-dom';
import { formatDuration, formatViews } from '../../utils/helpers';

const VideoCard = ({ video }) => {
  const { id, title, thumbnail, duration, views, genre, createdAt } = video;

  return (
    <div className="video-card">
      <Link to={`/video/${id}`}>
        <div className="thumbnail-container">
          <div className="thumbnail">
            <img src={thumbnail} alt={title} />
            <div className="video-duration">{formatDuration(duration)}</div>
            <div className="play-icon">
              <i className="fas fa-play"></i>
            </div>
          </div>
        </div>
      </Link>
      
      <div className="video-info">
        <Link to={`/video/${id}`}>
          <h3 className="video-title">{title}</h3>
        </Link>
        
        <div className="video-year">
          {title.includes('(') ? '' : `(${new Date(createdAt?.toDate()).getFullYear()})`}
        </div>
        
        <div className="video-meta">
          <span>{formatViews(views)} views</span>
          <span> • </span>
          <span>{getTimeAgo(createdAt?.toDate())}</span>
        </div>
        
        <div className="video-genre">
          <span className="genre-tag">{genre}</span>
        </div>
      </div>
    </div>
  );
};

// Helper function to format time ago
const getTimeAgo = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const diffInMs = now - date;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'today';
  if (diffInDays === 1) return '1 day ago';
  return `${diffInDays} days ago`;
};

export default VideoCard;
