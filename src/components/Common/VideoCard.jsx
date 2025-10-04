import React from 'react';
import { Link } from 'react-router-dom';
import { formatDuration, formatViews, formatDate } from '../../utils/helpers'; // Add formatDate import

const VideoCard = ({ video }) => {
  const { id, title, thumbnail, duration, views, genre, createdAt } = video;

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
            <span>{formatDate(createdAt)}</span> {/* Changed this line */}
            <span className="genre-tag">{genre}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
