import { useState, useEffect } from 'react';
import { getVideos, getVideo, searchVideos, getRelatedVideos } from '../services/database';

export const useVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getVideos();
      if (result.success) {
        setVideos(result.videos);
      } else {
        setError(result.error || 'Failed to load videos');
      }
    } catch (err) {
      setError('Failed to load videos');
      console.error('Error loading videos:', err);
    } finally {
      setLoading(false);
    }
  };

  const search = async (term) => {
    if (!term || term.trim().length < 2) {
      // If search term is too short, show all videos
      loadVideos();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await searchVideos(term);
      if (result.success) {
        setVideos(result.videos);
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
    videos,
    loading,
    error,
    search,
    refresh: loadVideos
  };
};

export const useVideo = (id) => {
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      loadVideo(id);
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
      }
    } catch (err) {
      setError('Failed to load video');
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
    }
  }, [genre, excludeId]);

  const loadRelatedVideos = async (videoGenre, videoId) => {
    try {
      setLoading(true);
      setError(null);
      const result = await getRelatedVideos(videoGenre, videoId);
      if (result.success) {
        setVideos(result.videos);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to load related videos');
      console.error('Error loading related videos:', err);
    } finally {
      setLoading(false);
    }
  };

  return { videos, loading, error };
};
