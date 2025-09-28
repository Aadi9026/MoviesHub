import { useState, useEffect } from 'react';
import { getVideos, getVideo, searchVideos, getRelatedVideos } from '../services/database';

export const useVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentType, setCurrentType] = useState('all'); // 'all', 'random', 'latest', 'trending'

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      setCurrentType('all');
      const result = await getVideos();
      if (result.success) {
        // Ensure videos is always an array
        setVideos(Array.isArray(result.videos) ? result.videos : []);
      } else {
        setError(result.error || 'Failed to load videos');
        setVideos([]); // Set empty array on error
      }
    } catch (err) {
      setError('Failed to load videos');
      setVideos([]); // Set empty array on error
      console.error('Error loading videos:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load random videos for home page
  const loadRandomVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      setCurrentType('random');
      const result = await getVideos();
      if (result.success) {
        const allVideos = Array.isArray(result.videos) ? result.videos : [];
        // Shuffle the videos for random experience
        const shuffledVideos = [...allVideos].sort(() => Math.random() - 0.5);
        setVideos(shuffledVideos);
      } else {
        setError(result.error || 'Failed to load videos');
        setVideos([]);
      }
    } catch (err) {
      setError('Failed to load videos');
      setVideos([]);
      console.error('Error loading random videos:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load latest videos sorted by date
  const loadLatestVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      setCurrentType('latest');
      const result = await getVideos();
      if (result.success) {
        const allVideos = Array.isArray(result.videos) ? result.videos : [];
        // Sort by creation date (newest first)
        const latestVideos = [...allVideos].sort((a, b) => {
          const dateA = new Date(a.createdAt || a.uploadDate || a.created_at || 0);
          const dateB = new Date(b.createdAt || b.uploadDate || b.created_at || 0);
          return dateB - dateA;
        });
        setVideos(latestVideos);
      } else {
        setError(result.error || 'Failed to load latest videos');
        setVideos([]);
      }
    } catch (err) {
      setError('Failed to load latest videos');
      setVideos([]);
      console.error('Error loading latest videos:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load trending videos sorted by views/popularity
  const loadTrendingVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      setCurrentType('trending');
      const result = await getVideos();
      if (result.success) {
        const allVideos = Array.isArray(result.videos) ? result.videos : [];
        // Sort by views (highest first) for trending
        const trendingVideos = [...allVideos].sort((a, b) => {
          const viewsA = parseInt(a.views || 0);
          const viewsB = parseInt(b.views || 0);
          return viewsB - viewsA;
        }).map(video => ({
          ...video,
          trending: true // Add trending flag
        }));
        setVideos(trendingVideos);
      } else {
        setError(result.error || 'Failed to load trending videos');
        setVideos([]);
      }
    } catch (err) {
      setError('Failed to load trending videos');
      setVideos([]);
      console.error('Error loading trending videos:', err);
    } finally {
      setLoading(false);
    }
  };

  const search = async (term) => {
    if (!term || typeof term !== 'string' || term.trim().length < 2) {
      // If search term is too short, show all videos
      loadVideos();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setCurrentType('search');
      const result = await searchVideos(term);
      if (result.success) {
        // Ensure videos is always an array
        setVideos(Array.isArray(result.videos) ? result.videos : []);
      } else {
        setError(result.error || 'Search failed');
        // Fallback to showing all videos if search fails
        await loadVideos();
      }
    } catch (err) {
      setError('Search failed');
      console.error('Error searching videos:', err);
      // Fallback to showing all videos
      await loadVideos();
    } finally {
      setLoading(false);
    }
  };

  return {
    videos: Array.isArray(videos) ? videos : [],
    loading,
    error,
    currentType,
    search,
    refresh: loadVideos,
    loadRandomVideos,
    loadLatestVideos,
    loadTrendingVideos
  };
};

export const useVideo = (id) => {
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      loadVideo(id);
    } else {
      setLoading(false);
      setError('Video ID is required');
    }
  }, [id]);

  const loadVideo = async (videoId) => {
    try {
      setLoading(true);
      setError(null);
      const result = await getVideo(videoId);
      if (result.success) {
        setVideo(result.video);
      } else {
        setError(result.error || 'Video not found');
        setVideo(null);
      }
    } catch (err) {
      setError('Failed to load video');
      setVideo(null);
      console.error('Error loading video:', err);
    } finally {
      setLoading(false);
    }
  };

  return { video, loading, error, reload: loadVideo };
};

export const useRelatedVideos = (genre, excludeId) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (genre) {
      loadRelatedVideos(genre, excludeId);
    } else {
      setLoading(false);
      setVideos([]);
    }
  }, [genre, excludeId]);

  const loadRelatedVideos = async (videoGenre, videoId) => {
    try {
      setLoading(true);
      setError(null);
      const result = await getRelatedVideos(videoGenre, videoId);
      if (result.success) {
        // Ensure videos is always an array
        setVideos(Array.isArray(result.videos) ? result.videos : []);
      } else {
        setError(result.error);
        setVideos([]);
      }
    } catch (err) {
      setError('Failed to load related videos');
      setVideos([]);
      console.error('Error loading related videos:', err);
    } finally {
      setLoading(false);
    }
  };

  return { 
    videos: Array.isArray(videos) ? videos : [], 
    loading, 
    error 
  };
};
