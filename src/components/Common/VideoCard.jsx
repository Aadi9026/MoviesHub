import React from 'react';
import { Link } from 'react-router-dom';
import { formatDuration, formatViews } from '../../utils/helpers';

const VideoCard = ({ video }) => {
  const { id, title, thumbnail, duration, views, genre, createdAt } = video;

  // Format the created date (show "X days ago" if desired)
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
        <h3 className="video-title">{title}</h3>
        <div className="video-meta">
          <span>{formatViews(views || 0)} views</span>
          <span> • </span>
          <span>{getFormattedDate(createdAt)}</span>
        </div>
        <div className="video-genre">
          <span className="genre-tag">{genre}</span>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
