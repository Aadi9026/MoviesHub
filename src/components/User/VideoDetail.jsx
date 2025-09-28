import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVideo, useRelatedVideos } from '../../hooks/useVideos';
import VideoPlayer from '../Common/VideoPlayer';
import VideoCard from '../Common/VideoCard';
import AdSlot from '../Common/AdSlot';
import LoadingSpinner from '../Common/LoadingSpinner';
import { QUALITIES } from '../../utils/constants';
import { formatViews, formatDuration } from '../../utils/helpers';

const VideoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { video, loading, error } = useVideo(id);
  const { videos: relatedVideos, loading: relatedLoading } = useRelatedVideos(
    video?.genre, 
    id
  );
  const [currentSource, setCurrentSource] = useState(0);
  const [showDownloads, setShowDownloads] = useState(false);

  // Reset source when video changes
  useEffect(() => {
    setCurrentSource(0);
    setShowDownloads(false);
  }, [id]);

  if (loading) return <LoadingSpinner text="Loading video..." />;
  if (error) return <div className="error-message">Error: {error}</div>;
  if (!video) return <div className="error-message">Video not found</div>;

  // Prepare video sources
  const sources = [];
  
  // Add primary source if available
  if (video.embedCode && video.embedCode.trim() !== '') {
    sources.push({ 
      code: video.embedCode, 
      label: 'Primary Source',
      valid: true
    });
  }
  
  // Add alternative sources if available and enabled
  if (video.altSources && video.altSourcesEnabled) {
    video.altSources.forEach((source, index) => {
      if (video.altSourcesEnabled[index] && source && source.trim() !== '') {
        sources.push({ 
          code: source, 
          label: `Source ${index + 1}`,
          valid: true
        });
      }
    });
  }

  // If no valid sources, show error
  if (sources.length === 0) {
    return (
      <div className="video-detail-page">
        <div className="container">
          <div className="error-container">
            <div className="error-message">
              <i className="fas fa-exclamation-triangle"></i>
              <h3>Video Source Missing</h3>
              <p>This video doesn't have any valid embed codes. Please contact the administrator.</p>
              <button onClick={() => navigate('/')} className="btn btn-primary">
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const availableDownloads = video.downloadLinks ? 
    Object.entries(video.downloadLinks).filter(([_, link]) => link && link.trim() !== '') : [];

  return (
    <div className="video-detail-page">
      <div className="container">
        <div className="video-layout">
          <div className="video-main">
            <VideoPlayer 
              embedCode={sources[currentSource]?.code}
              title={video.title}
            />

            <div className="video-info">
              <h1 className="video-detail-title">{video.title}</h1>
              
              <div className="video-meta">
                <span>{formatViews(video.views || 0)} views</span>
                <span> • </span>
                <span>{formatDuration(video.duration || 120)}</span>
                <span> • </span>
                <span>{video.genre}</span>
                {video.createdAt && (
                  <>
                    <span> • </span>
                    <span>
                      {video.createdAt.toDate ? 
                        new Date(video.createdAt.toDate()).toLocaleDateString() : 
                        'Recent'
                      }
                    </span>
                  </>
                )}
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

              {video.description && (
                <div className="video-description">
                  <h4>Description</h4>
                  <p>{video.description}</p>
                </div>
              )}

              <AdSlot position="in_video" videoId={video.id} />
            </div>
          </div>

          <div className="video-sidebar">
            <AdSlot position="sidebar" />
            
            <div className="suggested-videos">
              <h3>Related Movies</h3>
              
              {relatedLoading ? (
                <LoadingSpinner size="small" text="Loading related videos..." />
              ) : relatedVideos.length > 0 ? (
                relatedVideos.map(relatedVideo => (
                  <VideoCard key={relatedVideo.id} video={relatedVideo} />
                ))
              ) : (
                <div className="no-related">
                  <i className="fas fa-film"></i>
                  <p>No related videos found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDetail;
