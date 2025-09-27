import React from 'react';
import { Link } from 'react-router-dom';
import { formatDuration, formatViews } from '../../utils/helpers';

const VideoCard = ({ video, compact = false }) => {
  const { id, title, thumbnail, duration, views, genre, createdAt } = video;

  return (
    <div className={`video-card ${compact ? 'compact' : ''}`}>
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
        <div className="video-meta">
          <span>{formatViews(views || 0)} views</span>
          {!compact && (
            <>
              <span> • </span>
              <span>{new Date(createdAt?.toDate() || Date.now()).toLocaleDateString()}</span>
            </>
          )}
        </div>
        {!compact && (
          <div className="video-genre">
            <span className="genre-tag">{genre}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCard;
