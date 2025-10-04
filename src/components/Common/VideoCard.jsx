import React from 'react';
import { Link } from 'react-router-dom';
import { formatDuration, formatViews } from '../../utils/helpers';

const VideoCard = ({ video }) => {
  const { id, title, thumbnail, duration, views, genre, createdAt } = video;

  return (
    <div className="video-card">
      <Link to={`/video/${id}`}>
        <div className="thumbnail">
          <img src={thumbnail} alt={title} />
          <div className="video-duration">{formatDuration(duration)}</div>
          <div className="play-icon">
            <i className="fas fa-play"></i>
          </div>
        </div>
      </Link>
      
      <div className="video-info">
        <Link to={`/video/${id}`}>
          <h3 className="video-title">{title}</h3>
        </Link>
        
        {/* Fixed: Added the movie year in brackets like "(2025)" */}
        <div className="video-year">
          {title.includes('(') ? '' : `(${new Date(createdAt?.toDate()).getFullYear()})`}
        </div>
        
        {/* Fixed: Moved "FULL MOVIE ON MOVIESHUB" text */}
        <div className="movie-platform">
          FULL MOVIE ON MOVIESHUB
        </div>
        
        {/* Fixed: Views and time ago formatting */}
        <div className="video-meta">
          <span>{formatViews(views)} views</span>
          <span> • </span>
          <span>{getTimeAgo(createdAt?.toDate())}</span>
        </div>
        
        {/* Fixed: Genre styling */}
        <div className="video-genre">
          <span className="genre-tag">{genre}</span>
        </div>
      </div>
    </div>
  );
};

// Helper function to format time ago (you can add this to your helpers)
const getTimeAgo = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const diffInMs = now - date;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'today';
  if (diffInDays === 1) return '1 day ago';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  return `${Math.floor(diffInDays / 30)} months ago`;
};

export default VideoCard;
