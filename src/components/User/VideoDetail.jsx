import React, { useState, useEffect, useRef } from 'react';
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
  
  // Refs
  const actionBarRef = useRef(null);
  const videoContainerRef = useRef(null);
  
  // State management
  const [currentSource, setCurrentSource] = useState(0);
  const [showDownloads, setShowDownloads] = useState(false);
  const [metadataExpanded, setMetadataExpanded] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likeCount, setLikeCount] = useState(video?.likes || 0);
  const [dislikeCount, setDislikeCount] = useState(video?.dislikes || 0);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [isSticky, setIsSticky] = useState(false);

  // Reset states when video changes
  useEffect(() => {
    setCurrentSource(0);
    setShowDownloads(false);
    setMetadataExpanded(false);
    setDescriptionExpanded(false);
    setLiked(false);
    setDisliked(false);
    setLikeCount(video?.likes || 0);
    setDislikeCount(video?.dislikes || 0);
    setIsSticky(false);
  }, [id, video]);

  // SIMPLE SCROLL HANDLER - THIS WORKS
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Activate sticky when scrolled past 300px (adjust as needed)
      if (scrollY > 300) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Rest of your component code remains the same...
  const handleLike = () => {
    if (liked) {
      setLiked(false);
      setLikeCount(prev => Math.max(0, prev - 1));
    } else {
      setLiked(true);
      setLikeCount(prev => prev + 1);
      if (disliked) {
        setDisliked(false);
        setDislikeCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  const handleDislike = () => {
    if (disliked) {
      setDisliked(false);
      setDislikeCount(prev => Math.max(0, prev - 1));
    } else {
      setDisliked(true);
      setDislikeCount(prev => prev + 1);
      if (liked) {
        setLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: video.title,
          text: video.description,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShowShareTooltip(true);
        setTimeout(() => setShowShareTooltip(false), 2000);
      }
    } catch (err) {
      console.log('Share cancelled or failed');
    }
  };

  const handleScrollIndicator = () => {
    const scrollContainer = actionBarRef.current;
    if (scrollContainer) {
      const scrollLeft = scrollContainer.scrollLeft;
      const scrollWidth = scrollContainer.scrollWidth;
      const clientWidth = scrollContainer.clientWidth;
      
      if (scrollLeft === 0) {
        scrollContainer.classList.add('scroll-start');
        scrollContainer.classList.remove('scroll-middle', 'scroll-end');
      } else if (scrollLeft + clientWidth >= scrollWidth - 10) {
        scrollContainer.classList.add('scroll-end');
        scrollContainer.classList.remove('scroll-start', 'scroll-middle');
      } else {
        scrollContainer.classList.add('scroll-middle');
        scrollContainer.classList.remove('scroll-start', 'scroll-end');
      }
    }
  };

  // Initialize scroll indicators
  useEffect(() => {
    handleScrollIndicator();
    const scrollContainer = actionBarRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScrollIndicator);
      return () => scrollContainer.removeEventListener('scroll', handleScrollIndicator);
    }
  }, []);

  if (loading) return <LoadingSpinner text="Loading video..." />;
  if (error) return <div className="error-message">Error: {error}</div>;
  if (!video) return <div className="error-message">Video not found</div>;

  // Prepare video sources
  const sources = [];
  
  if (video.embedCode && video.embedCode.trim() !== '') {
    sources.push({ 
      code: video.embedCode, 
      label: 'Primary Source',
      valid: true
    });
  }
  
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
      {/* Sticky Video Player */}
      <div 
        className={`video-player-container ${isSticky ? 'sticky' : ''}`}
        ref={videoContainerRef}
      >
        <VideoPlayer 
          embedCode={sources[currentSource]?.code}
          title={video.title}
        />
      </div>

      {/* Content Area */}
      <div className={`video-content ${isSticky ? 'sticky-active' : ''}`}>
        <div className="container">
          <div className="video-layout">
            <div className="video-main">
              <div className="video-info">
                <h1 className="video-detail-title">{video.title}</h1>
                
                {/* Your existing action bar and other content */}
                <div className="horizontal-action-bar">
                  <div 
                    className="action-bar-scroll" 
                    ref={actionBarRef}
                    id="actionBarScroll"
                  >
                    {/* Your action buttons */}
                    <button 
                      className={`action-bar-btn like-btn ${liked ? 'active' : ''}`}
                      onClick={handleLike}
                    >
                      <i className={`fas fa-thumbs-up ${liked ? 'fas' : 'far'}`}></i>
                      <span>Like</span>
                      {likeCount > 0 && <span className="btn-counter">{likeCount}</span>}
                    </button>
                    
                    <button 
                      className={`action-bar-btn dislike-btn ${disliked ? 'active' : ''}`}
                      onClick={handleDislike}
                    >
                      <i className={`fas fa-thumbs-down ${disliked ? 'fas' : 'far'}`}></i>
                      <span>Dislike</span>
                      {dislikeCount > 0 && <span className="btn-counter">{dislikeCount}</span>}
                    </button>
                    
                    {/* Rest of your buttons */}
                  </div>
                </div>

                {/* Rest of your component content */}
                
              </div>
            </div>

            <div className="video-sidebar">
              <AdSlot position="sidebar" />
              
              <div className="suggested-videos">
                <div className="sidebar-header">
                  <i className="fas fa-film"></i>
                  <h3>Related Movies</h3>
                  <span className="sidebar-badge">{relatedVideos.length}</span>
                </div>
                
                {relatedLoading ? (
                  <LoadingSpinner size="small" text="Loading related videos..." />
                ) : relatedVideos.length > 0 ? (
                  relatedVideos.map(relatedVideo => (
                    <VideoCard key={relatedVideo.id} video={relatedVideo} />
                  ))
                ) : (
                  <div className="no-related">
                    <i className="fas fa-search"></i>
                    <p>No related videos found</p>
                    <button 
                      className="btn-secondary"
                      onClick={() => navigate('/')}
                    >
                      Browse All Movies
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDetail;
