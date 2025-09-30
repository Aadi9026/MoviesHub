import React, { createContext, useState, useContext } from 'react';

const VideoContext = createContext();

export const VideoProvider = ({ children }) => {
  const [currentVideo, setCurrentVideo] = useState(null);
  const [isMiniPlayerVisible, setMiniPlayerVisible] = useState(false);

  const playVideo = (video) => {
    setCurrentVideo(video);
    setMiniPlayerVisible(false);
  };

  const showMiniPlayer = () => {
    setMiniPlayerVisible(true);
  };

  const hideMiniPlayer = () => {
    setMiniPlayerVisible(false);
  };

  return (
    <VideoContext.Provider value={{ currentVideo, playVideo, isMiniPlayerVisible, showMiniPlayer, hideMiniPlayer }}>
      {children}
    </VideoContext.Provider>
  );
};

export const useVideoContext = () => useContext(VideoContext);
