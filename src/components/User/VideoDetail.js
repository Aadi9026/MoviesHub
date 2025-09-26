import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import VideoPlayer from '../Common/VideoPlayer';
import VideoCard from '../Common/VideoCard';
import AdSlot from '../Common/AdSlot';
import LoadingSpinner from '../Common/LoadingSpinner';
import { QUALITIES } from '../../utils/constants';
import { formatViews, formatDuration } from '../../utils/helpers';

const VideoDetail = ({ video, relatedVideos, relatedLoading }) => {
  const [currentSource, setCurrentSource] = useState(0);
  const [showDownloads, setShowDownloads] = useState(false);

  const sources = [
    { code: video.embedCode, label: 'Primary Source' },
    ...video.altSourcesEnabled.map((enabled, index) => 
      enabled ? { code: video.altSources[index], label: `Source ${index + 1}` } : null
    ).filter(Boolean)
  ];

  const availableDownloads = Object.entries(video.downloadLinks || {})
    .filter(([_, link]) => link.trim() !== '');

  return (
    <div className="video-detail-page">
      <div className="container">
        <div className="video-layout">
          <div className="video-main">
            <VideoPlayer 
              embedCode={sources[currentSource]?.code || video.embedCode}
              title={video.title}
            />

            <div className="video-info">
              <h1 className="video-title">{video.title}</h1>
              
              <div className="video-meta">
                <span>{formatViews(video.views || 0)} views</span>
                <span> • </span>
                <span>{formatDuration(video.duration || 120)}</span>
                <span> • </span>
                <span>{new Date(video.createdAt?.toDate()).toLocaleDateString()}</span>
              </div>

              <div className="video-actions">
                {sources.length > 1 && (
                  <div className="source-selector">
                    <label>Video Source:</label>
                    <select 
                      value={currentSource} 
                      onChange={(e) => setCurrentSource(parseInt(e.target.value))}
                    >
                      {sources.map((source, index) => (
                        <option key={index} value={index}>{source.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {availableDownloads.length > 0 && (
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setShowDownloads(!showDownloads)}
                  >
                    <i className="fas fa-download"></i>
                    Download ({availableDownloads.length})
                  </button>
                )}
              </div>

              {showDownloads && availableDownloads.length > 0 && (
                <div className="download-options">
                  <h4>Download Options:</h4>
                  <div className="quality-buttons">
                    {availableDownloads.map(([quality, link]) => (
                      <a 
                        key={quality} 
                        href={link} 
                        className="quality-btn"
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        {quality}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="video-description">
                <p>{video.description}</p>
              </div>

              <AdSlot position="in_video" videoId={video.id} />
            </div>
          </div>

          <div className="video-sidebar">
            <div className="suggested-videos">
              <h3>Related Movies</h3>
              
              {relatedLoading ? (
                <LoadingSpinner size="small" text="Loading related videos..." />
              ) : relatedVideos.length > 0 ? (
                relatedVideos.map(relatedVideo => (
                  <VideoCard key={relatedVideo.id} video={relatedVideo} compact />
                ))
              ) : (
                <p className="no-related">No related videos found</p>
              )}
            </div>

            <AdSlot position="sidebar" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDetail;
