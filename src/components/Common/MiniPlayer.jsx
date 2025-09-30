import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVideoContext } from '../../contexts/VideoContext';
import VideoPlayer from './VideoPlayer';

const MiniPlayer = () => {
  const { currentVideo, hideMiniPlayer } = useVideoContext();
  const navigate = useNavigate();
  const [position, setPosition] = useState({ bottom: 16, right: 16 });
  const draggingRef = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0, startBottom: 16, startRight: 16 });

  // Start dragging
  const onMouseDown = (e) => {
    draggingRef.current = true;
    dragOffset.current = {
      x: e.clientX,
      y: e.clientY,
      startBottom: position.bottom,
      startRight: position.right,
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    e.stopPropagation();
  };
  // Handle dragging
  const onMouseMove = (e) => {
    if (!draggingRef.current) return;
    setPosition({
      bottom: Math.max(0, dragOffset.current.startBottom + (dragOffset.current.y - e.clientY)),
      right: Math.max(0, dragOffset.current.startRight + (dragOffset.current.x - e.clientX)),
    });
  };
  // End drag
  const onMouseUp = () => {
    draggingRef.current = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };
  useEffect(() => () => {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }, []);

  if (!currentVideo) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: position.bottom,
        right: position.right,
        width: 250,
        height: 140,
        background: '#000',
        borderRadius: 8,
        zIndex: 10000,
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.20)'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: 24,
          width: '100%',
          cursor: 'grab',
          background: 'rgba(40,40,40,0.5)',
          color: '#fff',
          fontWeight: 600,
          fontSize: 13,
          userSelect: 'none'
        }}
        onMouseDown={onMouseDown}
      >
        <span style={{ flex: 1, paddingLeft: 10 }}>MiniPlayer</span>
        <button
          style={{
            background: 'rgba(255,255,255,0.9)',
            border: 'none',
            borderRadius: '50%',
            width: 22,
            height: 22,
            marginRight: 8,
            cursor: 'pointer',
            fontSize: '16px',
            color: '#333'
          }}
          onClick={e => { e.stopPropagation(); hideMiniPlayer(); }}
        >×</button>
      </div>
      <div
        style={{ width: '100%', height: '116px', background: '#000' }}
        onClick={() => navigate(`/video/${currentVideo.id}`)}
      >
        <VideoPlayer embedCode={currentVideo.embedCode} title={currentVideo.title} />
      </div>
    </div>
  );
};

export default MiniPlayer;
