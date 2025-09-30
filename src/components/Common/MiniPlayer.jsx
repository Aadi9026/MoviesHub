import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useVideoContext } from '../../contexts/VideoContext';
import VideoPlayer from './VideoPlayer';

const MiniPlayer = () => {
  const { currentVideo, hideMiniPlayer } = useVideoContext();
  const navigate = useNavigate();

  if (!currentVideo) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: 10,
        right: 10,
        width: 240,
        height: 135,
        background: '#000',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
        zIndex: 10000,
        cursor: 'pointer',
        borderRadius: 8,
        overflow: 'hidden',
      }}
      onClick={() => navigate(`/video/${currentVideo.id}`)}
    >
      <VideoPlayer embedCode={currentVideo.embedCode} title={currentVideo.title} />
      <button
        onClick={(e) => {
          e.stopPropagation();
          hideMiniPlayer();
        }}
        style={{
          position: 'absolute',
          top: 4,
          right: 4,
          background: 'rgba(255,255,255,0.7)',
          border: 'none',
          borderRadius: '50%',
          width: 24,
          height: 24,
          cursor: 'pointer',
          fontSize: '18px',
          fontWeight: 'bold',
          lineHeight: '18px',
          padding: 0,
        }}
        aria-label="Close mini player"
      >
        ×
      </button>
    </div>
  );
};

export default MiniPlayer;
