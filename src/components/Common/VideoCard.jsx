import React from 'react';
import { Link } from 'react-router-dom';
import { formatDuration, formatViews } from '../../utils/helpers';

const VideoCard = ({ video }) => {
  const { id, title, thumbnail, duration, views, genre, createdAt } = video;

  return (
    <div className="video-card">
      <Link to={`/video/${id}`}>
        <div className="thumbnail-container"> {/* Changed from thumbnail to thumbnail-container */}
          <img src={thumbnail} alt={title} className="thumbnail" /> {/* Added thumbnail class */}
          <div className="video-duration">{formatDuration(duration)}</div>
          {/* Remove play-icon if not styled in CSS */}
        </div>
      </Link>
      
      <div className="video-info-container"> {/* Changed from video-info to video-info-container */}
        <div className="video-details"> {/* Added this wrapper */}
          <Link to={`/video/${id}`}>
            <h3 className="video-title">{title}</h3>
          </Link>
          <div className="video-meta">
            <span>{formatViews(views)} views</span>
            <span className="separator"> • </span>
            <span>{new Date(createdAt?.toDate()).toLocaleDateString()}</span>
            <span className="genre-tag">{genre}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
