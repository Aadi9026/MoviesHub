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
  
  // State management
  const [currentSource, setCurrentSource] = useState(0);
  const [showDownloads, setShowDownloads] = useState(false);
  const [metadataExpanded, setMetadataExpanded] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);

  // Reset states when video changes
  useEffect(() => {
    setCurrentSource(0);
    setShowDownloads(false);
    setMetadataExpanded(false);
    setDescriptionExpanded(false);
    setLiked(false);
    setDisliked(false);
  }, [id]);

  const handleLike = () => {
    setLiked(!liked);
    if (disliked) setDisliked(false);
    // Add your like API call here
  };

  const handleDislike = () => {
    setDisliked(!disliked);
    if (liked) setLiked(false);
    // Add your dislike API call here
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: video.title,
        text: video.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // Add toast notification for copy success
      alert('Link copied to clipboard!');
    }
  };

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
              
              {/* NEW: YouTube-like Action Buttons */}
              <div className="video-actions">
                <button 
                  className={`action-btn ${liked ? 'active' : ''}`}
                  onClick={handleLike}
                >
                  <i className={`fas fa-thumbs-up ${liked ? 'fas' : 'far'}`}></i>
                  <span>Like</span>
                </button>
                
                <button 
                  className={`action-btn ${disliked ? 'active' : ''}`}
                  onClick={handleDislike}
                >
                  <i className={`fas fa-thumbs-down ${disliked ? 'fas' : 'far'}`}></i>
                  <span>Dislike</span>
                </button>
                
                <button 
                  className="action-btn"
                  onClick={handleShare}
                >
                  <i className="fas fa-share"></i>
                  <span>Share</span>
                </button>
              </div>

              {/* NEW: Collapsible Metadata Section */}
              <div className="metadata-collapsible">
                <div 
                  className="metadata-header"
                  onClick={() => setMetadataExpanded(!metadataExpanded)}
                >
                  <div className="metadata-title">
                    <i className="fas fa-info-circle"></i>
                    <span>Video Information</span>
                  </div>
                  <i className={`fas fa-chevron-${metadataExpanded ? 'up' : 'down'} metadata-toggle`}></i>
                </div>
                
                <div className={`metadata-content ${metadataExpanded ? 'expanded' : ''}`}>
                  {/* Metadata Grid */}
                  <div className="metadata-grid">
                    <div className="metadata-item">
                      <div className="metadata-label">Views</div>
                      <div className="metadata-value">
                        <i className="fas fa-eye"></i>
                        {formatViews(video.views || 0)}
                      </div>
                    </div>
                    
                    <div className="metadata-item">
                      <div className="metadata-label">Duration</div>
                      <div className="metadata-value">
                        <i className="fas fa-clock"></i>
                        {formatDuration(video.duration || 120)}
                      </div>
                    </div>
                    
                    <div className="metadata-item">
                      <div className="metadata-label">Genre</div>
                      <div className="metadata-value">
                        <i className="fas fa-tags"></i>
                        {video.genre}
                      </div>
                    </div>
                    
                    {video.createdAt && (
                      <div className="metadata-item">
                        <div className="metadata-label">Date Added</div>
                        <div className="metadata-value">
                          <i className="fas fa-calendar"></i>
                          {video.createdAt.toDate ? 
                            new Date(video.createdAt.toDate()).toLocaleDateString() : 
                            'Recent'
                          }
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Description inside metadata section */}
                  {video.description && (
                    <div className="metadata-description">
                      <div className="description-header">
                        <i className="fas fa-align-left"></i>
                        <h4>Description</h4>
                      </div>
                      <div className={`description-text ${descriptionExpanded ? 'expanded' : 'collapsed'}`}>
                        {video.description}
                      </div>
                      {video.description.length > 150 && (
                        <button 
                          className="read-more-btn"
                          onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                        >
                          {descriptionExpanded ? 'Show Less' : 'Read More'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Video Source and Download Section */}
              <div className="video-actions-row">
                {/* Video Source Dropdown */}
                {sources.length > 0 && (
                  <select 
                    className="action-select source-select"
                    value={currentSource} 
                    onChange={(e) => setCurrentSource(parseInt(e.target.value))}
                  >
                    {sources.map((source, index) => (
                      <option key={index} value={index}>{source.label}</option>
                    ))}
                  </select>
                )}

                {/* Download Button */}
                {availableDownloads.length > 0 && (
                  <button 
                    className="action-btn download-btn"
                    onClick={() => setShowDownloads(!showDownloads)}
                  >
                    <i className="fas fa-download"></i>
                    <span>Download ({availableDownloads.length})</span>
                  </button>
                )}
              </div>

              {/* Download options */}
              {showDownloads && availableDownloads.length > 0 && (
                <div className="download-section">
                  <div className="download-header">
                    <i className="fas fa-download"></i>
                    <h3>Download Options</h3>
                  </div>
                  <div className="quality-buttons">
                    {availableDownloads.map(([quality, link]) => (
                      <a 
                        key={quality} 
                        href={link} 
                        className="quality-btn"
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <i className="fas fa-download"></i>
                        {quality}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <AdSlot position="in_video" videoId={video.id} />
            </div>
          </div>

          <div className="video-sidebar">
            <AdSlot position="sidebar" />
            
            <div className="suggested-videos">
              <div className="sidebar-header">
                <i className="fas fa-list"></i>
                <h3>Related Movies</h3>
              </div>
              
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
