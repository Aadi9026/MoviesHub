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
    setLoading(true);
    const result = await getVideos();
    if (result.success) {
      setVideos(result.videos);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const search = async (term) => {
    setLoading(true);
    const result = await searchVideos(term);
    if (result.success) {
      setVideos(result.videos);
    } else {
      setError(result.error);
    }
    setLoading(false);
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
    setLoading(true);
    const result = await getVideo(videoId);
    if (result.success) {
      setVideo(result.video);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return { video, loading, error };
};

export const useRelatedVideos = (genre, excludeId) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (genre) {
      loadRelatedVideos(genre, excludeId);
    }
  }, [genre, excludeId]);

  const loadRelatedVideos = async (videoGenre, videoId) => {
    setLoading(true);
    const result = await getRelatedVideos(videoGenre, videoId);
    if (result.success) {
      setVideos(result.videos);
    }
    setLoading(false);
  };

  return { videos, loading };
};
