import React from 'react';
import { Link } from 'react-router-dom';
import { formatDuration, formatViews } from '../utils/helpers';

const VideoCard = ({ video, compact = false }) => {
  if (!video) return null;

  const {
    id,
    title,
    thumbnail,
    duration,
    views,
    genre,
    createdAt
  } = video;

  return (
    <div className={`video-card ${compact ? 'compact' : ''}`}>
      <Link to={`/video/${id}`} className="video-link">
        <div className="thumbnail">
          <img 
            src={thumbnail} 
            alt={title}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/300x180/333333/FFFFFF?text=No+Thumbnail';
            }}
          />
          {duration && (
            <div className="video-duration">
              {formatDuration(duration)}
            </div>
          )}
          <div className="play-icon">
            <i className="fas fa-play"></i>
          </div>
        </div>
      </Link>
      
      <div className="video-info">
        <Link to={`/video/${id}`}>
          <h3 className="video-title" title={title}>
            {title}
          </h3>
        </Link>
        
        <div className="video-meta">
          {views !== undefined && (
            <>
              <span>{formatViews(views)} views</span>
              <span> • </span>
            </>
          )}
          {createdAt && (
            <span>
              {createdAt.toDate ? 
                new Date(createdAt.toDate()).toLocaleDateString() : 
                'Recent'
              }
            </span>
          )}
        </div>
        
        {genre && (
          <div className="video-genre">
            <span className="genre-tag">{genre}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCard;
