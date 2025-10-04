import React from 'react';
import { Link } from 'react-router-dom';
import { formatDuration, formatViews } from '../../utils/helpers';

const VideoCard = ({ video }) => {
  const { id, title, thumbnail, duration, views, genre, createdAt } = video;

  // Extract year from title or use createdAt
  const getYear = () => {
    const yearMatch = title.match(/\((\d{4})\)/);
    if (yearMatch) return yearMatch[1];
    return new Date(createdAt?.toDate()).getFullYear();
  };

  return (
    <div className="premium-video-card">
      <Link to={`/video/${id}`} className="card-link">
        <div className="card-thumbnail">
          <img 
            src={thumbnail} 
            alt={title} 
            className="thumbnail-image"
            loading="lazy"
          />
          <div className="thumbnail-overlay">
            <div className="duration-badge">
              <i className="fas fa-clock"></i>
              {formatDuration(duration)}
            </div>
            <div className="play-button">
              <div className="play-circle">
                <i className="fas fa-play"></i>
              </div>
            </div>
            <div className="gradient-overlay"></div>
          </div>
        </div>
      </Link>
      
      <div className="card-content">
        <div className="content-header">
          <Link to={`/video/${id}`} className="title-link">
            <h3 className="video-title">{title.replace(/\((\d{4})\)/, '').trim()}</h3>
          </Link>
          <div className="video-year">{getYear()}</div>
        </div>
        
        <div className="video-stats">
          <div className="stats-item">
            <i className="fas fa-eye"></i>
            <span>{formatViews(views)} views</span>
          </div>
          <div className="stats-divider">•</div>
          <div className="stats-item">
            <i className="fas fa-calendar"></i>
            <span>{getTimeAgo(createdAt?.toDate())}</span>
          </div>
        </div>
        
        <div className="genre-section">
          <span className="genre-badge">
            <i className="fas fa-tag"></i>
            {genre}
          </span>
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
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return '1 day ago';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} week${Math.floor(diffInDays / 7) > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffInDays / 30)} month${Math.floor(diffInDays / 30) > 1 ? 's' : ''} ago`;
};

export default VideoCard;
