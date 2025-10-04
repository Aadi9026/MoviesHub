import React from 'react';
import { Link } from 'react-router-dom';
import { formatDuration, formatViews } from '../../utils/helpers';

const VideoCard = ({ video }) => {
  const { id, title, thumbnail, duration, views, genre, createdAt } = video;

  // Format the created date to show "X days ago"
  const getFormattedDate = (date) => {
    const now = new Date();
    const created = new Date(date);
    const diff = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    return diff === 0
      ? "Today"
      : diff === 1
      ? "1 day ago"
      : `${diff} days ago`;
  };

  return (
    <div className="video-card">
      <Link to={`/video/${id}`} className="video-link">
        <div className="thumbnail">
          <img src={thumbnail} alt={title} loading="lazy" />
          <div className="video-duration">{formatDuration(duration)}</div>
        </div>
      </Link>
      <div className="video-info">
        {/* Movie title with larger, bolder font */}
        <h2 className="video-title">{title}</h2>
        
        {/* Duration placed right after title like in screenshot */}
        <div className="video-duration-display">
          {formatDuration(duration)}
        </div>
        
        {/* Description text - you might need to add this to your video object */}
        <div className="video-description">
          {title} (2025) FULL MOVIE ON MOVIESHUB
        </div>
        
        {/* Views and date in one line */}
        <div className="video-meta">
          <span>{formatViews(views || 0)} views</span>
          <span> • </span>
          <span>{getFormattedDate(createdAt)}</span>
        </div>
        
        {/* Genre tag with different styling */}
        <div className="video-genre">
          <span className="genre-tag">{genre}</span>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
