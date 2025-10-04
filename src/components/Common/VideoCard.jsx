import React from 'react';
import { Link } from 'react-router-dom';
import { formatDuration, formatViews } from '../../utils/helpers';

const VideoCard = ({ video }) => {
  const { id, title, thumbnail, duration, views, genre, createdAt } = video;

  return (
    <div className="video-card-enhanced">
      <Link to={`/video/${id}`} className="video-card-link">
        <div className="thumbnail-wrapper-enhanced">
          <img 
            src={thumbnail} 
            alt={title} 
            className="thumbnail-image-enhanced"
            loading="lazy"
          />
          <div className="video-duration-enhanced">{formatDuration(duration)}</div>
          <div className="play-overlay-enhanced">
            <i className="fas fa-play"></i>
          </div>
        </div>
      </Link>
      
      <div className="video-info-enhanced">
        <Link to={`/video/${id}`} className="video-title-link">
          <h3 className="video-title-enhanced">{title}</h3>
        </Link>
        <div className="video-meta-row-enhanced">
          <div className="video-meta-enhanced">
            <span className="meta-views">{formatViews(views)} views</span>
            <span className="meta-separator">•</span>
            <span className="meta-date">{new Date(createdAt?.toDate()).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="video-genre-enhanced">
          <span className="genre-tag-enhanced">{genre}</span>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
