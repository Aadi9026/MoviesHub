import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  query, 
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from './firebase';

const VIDEOS_COLLECTION = 'videos';
const ADS_COLLECTION = 'ads';
const SETTINGS_COLLECTION = 'settings';

// Video Management - UPDATED with horizontalThumbnail
export const addVideo = async (videoData) => {
  try {
    const docRef = await addDoc(collection(db, VIDEOS_COLLECTION), {
      title: videoData.title || '',
      description: videoData.description || '',
      genre: videoData.genre || 'Action',
      thumbnail: videoData.thumbnail || '', // Vertical thumbnail for all sections
      horizontalThumbnail: videoData.horizontalThumbnail || '', // NEW: Horizontal thumbnail for latest section
      embedCode: videoData.embedCode || '',
      duration: parseInt(videoData.duration) || 120,
      altSources: videoData.altSources || ['', '', '', ''],
      altSourcesEnabled: videoData.altSourcesEnabled || [false, false, false, false],
      downloadLinks: videoData.downloadLinks || { '480p': '', '720p': '', '1080p': '', '4K': '' },
      adCode: videoData.adCode || '',
      // Additional movie metadata
      year: videoData.year || '',
      rating: videoData.rating || '',
      actors: videoData.actors || [],
      director: videoData.director || '',
      releaseDate: videoData.releaseDate || '',
      country: videoData.country || [],
      language: videoData.language || '',
      production: videoData.production || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      views: 0,
      likes: 0,
      isActive: true
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding video:', error);
    return { success: false, error: error.message };
  }
};

export const updateVideo = async (id, videoData) => {
  try {
    const videoRef = doc(db, VIDEOS_COLLECTION, id);
    await updateDoc(videoRef, {
      ...videoData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating video:', error);
    return { success: false, error: error.message };
  }
};

export const deleteVideo = async (id) => {
  try {
    await deleteDoc(doc(db, VIDEOS_COLLECTION, id));
    return { success: true };
  } catch (error) {
    console.error('Error deleting video:', error);
    return { success: false, error: error.message };
  }
};

// ADD THIS FUNCTION: Get Latest Videos for Latest Section
export const getLatestVideosForSection = async (limitCount = 12) => {
  try {
    let q;
    
    // Try with ordering first
    try {
      q = query(
        collection(db, VIDEOS_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    } catch (orderError) {
      // If ordering fails, get without order
      q = query(
        collection(db, VIDEOS_COLLECTION),
        limit(limitCount)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const videos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // If we couldn't order by createdAt, sort manually
    if (!q._query?.orderBy?.length) {
      videos.sort((a, b) => {
        const aDate = a.createdAt?.toDate?.() || new Date(0);
        const bDate = b.createdAt?.toDate?.() || new Date(0);
        return bDate - aDate;
      });
    }
    
    return { success: true, videos: videos || [] };
  } catch (error) {
    console.error('Error getting latest videos:', error);
    return { success: true, videos: [] };
  }
};

// ADD THIS FUNCTION: Get All Videos for Other Sections
export const getAllVideosForSections = async (limitCount = 50) => {
  try {
    const result = await getVideos(limitCount);
    if (result.success) {
      // Return videos with proper thumbnail selection
      const videosWithThumbnails = result.videos.map(video => ({
        ...video,
        displayThumbnail: video.thumbnail // Use vertical thumb for all other sections
      }));
      
      return { success: true, videos: videosWithThumbnails };
    }
    return result;
  } catch (error) {
    console.error('Error getting all videos:', error);
    return { success: false, error: error.message };
  }
};

// ADD THIS FUNCTION: Get video with proper thumbnail selection
export const getVideoWithThumbnail = async (id, section = 'all') => {
  try {
    if (!id) {
      return { success: false, error: 'Video ID is required' };
    }

    const docSnap = await getDoc(doc(db, VIDEOS_COLLECTION, id));
    
    if (docSnap.exists()) {
      const videoData = docSnap.data();
      
      // Select thumbnail based on section
      let displayThumbnail = videoData.thumbnail; // Default to vertical
      
      if (section === 'latest' && videoData.horizontalThumbnail) {
        displayThumbnail = videoData.horizontalThumbnail; // Use horizontal for latest section
      }
      
      // Validate required fields
      if (!videoData?.embedCode) {
        return { success: false, error: 'Video embed code is missing' };
      }
      
      // Increment views count
      try {
        await updateDoc(doc(db, VIDEOS_COLLECTION, id), {
          views: increment(1)
        });
      } catch (viewError) {
        console.warn('Could not increment views:', viewError);
      }
      
      return { 
        success: true, 
        video: { 
          id: docSnap.id, 
          ...videoData,
          displayThumbnail // Add the selected thumbnail
        } 
      };
    } else {
      return { success: false, error: 'Video not found' };
    }
  } catch (error) {
    console.error('Error getting video:', error);
    return { success: false, error: error.message };
  }
};

// ADD THIS FUNCTION: Get videos by genre with proper thumbnails
export const getVideosByGenre = async (genre, limitCount = 20, section = 'all') => {
  try {
    const allVideosResult = await getVideos(100);
    
    const videos = Array.isArray(allVideosResult.videos) ? allVideosResult.videos : [];
    
    const filteredVideos = videos
      .filter(video => {
        if (!video) return false;
        return video.genre === genre && video.isActive !== false;
      })
      .slice(0, limitCount)
      .map(video => ({
        ...video,
        displayThumbnail: section === 'latest' && video.horizontalThumbnail 
          ? video.horizontalThumbnail 
          : video.thumbnail
      }));
      
    return { success: true, videos: filteredVideos };
  } catch (error) {
    console.error('Error getting videos by genre:', error);
    return { success: true, videos: [] };
  }
};

// ADD THIS FUNCTION: Update video thumbnails
export const updateVideoThumbnails = async (id, thumbnails) => {
  try {
    const videoRef = doc(db, VIDEOS_COLLECTION, id);
    await updateDoc(videoRef, {
      thumbnail: thumbnails.vertical || '',
      horizontalThumbnail: thumbnails.horizontal || '',
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating video thumbnails:', error);
    return { success: false, error: error.message };
  }
};

// Keep existing functions but ensure they work with new structure
export const checkDuplicateVideo = async (title, genre, excludeId = null) => {
  try {
    if (!title || !genre) {
      return { success: true, duplicates: [] };
    }

    const allVideosResult = await getVideos(100);
    
    const videos = Array.isArray(allVideosResult.videos) ? allVideosResult.videos : [];
    
    const searchTitle = title.toLowerCase().trim();
    const searchGenre = genre.toLowerCase().trim();
    
    const duplicates = videos.filter(video => {
      if (!video || !video.id) return false;
      
      if (excludeId && video.id === excludeId) return false;
      
      const videoTitle = (video.title || '').toLowerCase();
      const videoGenre = (video.genre || '').toLowerCase();
      
      if (videoTitle === searchTitle && videoGenre === searchGenre) {
        return true;
      }
      
      const titleSimilarity = calculateSimilarity(videoTitle, searchTitle);
      const genreMatch = videoGenre === searchGenre;
      
      if (titleSimilarity > 0.8 && genreMatch) {
        return true;
      }
      
      if ((videoTitle.includes(searchTitle) || searchTitle.includes(videoTitle)) && genreMatch) {
        return true;
      }
      
      return false;
    });

    return { success: true, duplicates };
  } catch (error) {
    console.error('Error checking duplicate videos:', error);
    return { success: false, error: error.message };
  }
};

// Helper function for similarity calculation
const calculateSimilarity = (str1, str2) => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const words1 = str1.split(/\s+/).filter(word => word.length > 2);
  const words2 = str2.split(/\s+/).filter(word => word.length > 2);
  
  const commonWords = words1.filter(word => words2.includes(word));
  const similarity = commonWords.length / Math.max(words1.length, words2.length);
  
  return similarity;
};

export const getVideos = async (limitCount = 50) => {
  try {
    let q;
    
    try {
      q = query(
        collection(db, VIDEOS_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    } catch (orderError) {
      q = query(
        collection(db, VIDEOS_COLLECTION),
        limit(limitCount)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const videos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    if (!q._query?.orderBy?.length) {
      videos.sort((a, b) => {
        const aDate = a.createdAt?.toDate?.() || new Date(0);
        const bDate = b.createdAt?.toDate?.() || new Date(0);
        return bDate - aDate;
      });
    }
    
    return { success: true, videos: videos || [] };
  } catch (error) {
    console.error('Error getting videos:', error);
    return { success: true, videos: [] };
  }
};

export const getVideo = async (id) => {
  try {
    if (!id) {
      return { success: false, error: 'Video ID is required' };
    }

    const docSnap = await getDoc(doc(db, VIDEOS_COLLECTION, id));
    
    if (docSnap.exists()) {
      const videoData = docSnap.data();
      
      if (!videoData?.embedCode) {
        return { success: false, error: 'Video embed code is missing' };
      }
      
      try {
        await updateDoc(doc(db, VIDEOS_COLLECTION, id), {
          views: increment(1)
        });
      } catch (viewError) {
        console.warn('Could not increment views:', viewError);
      }
      
      return { 
        success: true, 
        video: { 
          id: docSnap.id, 
          ...videoData 
        } 
      };
    } else {
      return { success: false, error: 'Video not found' };
    }
  } catch (error) {
    console.error('Error getting video:', error);
    return { success: false, error: error.message };
  }
};

export const searchVideos = async (searchTerm) => {
  try {
    if (!searchTerm || typeof searchTerm !== 'string') {
      return { success: true, videos: [] };
    }

    const allVideosResult = await getVideos(100);
    
    const videos = Array.isArray(allVideosResult.videos) ? allVideosResult.videos : [];
    
    const term = searchTerm.toLowerCase().trim();
    
    if (term.length < 2) {
      return { success: true, videos: videos };
    }

    const filteredVideos = videos.filter(video => {
      if (!video) return false;
      
      const title = (video.title || '').toLowerCase();
      const description = (video.description || '').toLowerCase();
      const genre = (video.genre || '').toLowerCase();
      
      return title.includes(term) || 
             description.includes(term) || 
             genre.includes(term) ||
             (title.split(' ') || []).some(word => word.startsWith(term)) ||
             (genre.split(' ') || []).some(word => word.startsWith(term));
    });

    filteredVideos.sort((a, b) => {
      const aTitle = (a?.title || '').toLowerCase();
      const bTitle = (b?.title || '').toLowerCase();
      const aViews = a?.views || 0;
      const bViews = b?.views || 0;
      
      if (aTitle.includes(term) && !bTitle.includes(term)) return -1;
      if (!aTitle.includes(term) && bTitle.includes(term)) return 1;
      
      if (aTitle.startsWith(term) && !bTitle.startsWith(term)) return -1;
      if (!aTitle.startsWith(term) && bTitle.startsWith(term)) return 1;
      
      return bViews - aViews;
    });

    return { success: true, videos: filteredVideos };
  } catch (error) {
    console.error('Error searching videos:', error);
    return { success: true, videos: [] };
  }
};

export const getRelatedVideos = async (genre, excludeId, limitCount = 6) => {
  try {
    const allVideosResult = await getVideos(50);
    
    const videos = Array.isArray(allVideosResult.videos) ? allVideosResult.videos : [];
    
    const relatedVideos = videos
      .filter(video => {
        if (!video || !video.id) return false;
        return video.id !== excludeId && 
               video.genre === genre &&
               video.isActive !== false;
      })
      .slice(0, limitCount);
      
    return { success: true, videos: relatedVideos };
  } catch (error) {
    console.error('Error getting related videos:', error);
    return { success: true, videos: [] };
  }
};

// Ad Management
export const getAdSettings = async () => {
  try {
    const docSnap = await getDoc(doc(db, SETTINGS_COLLECTION, 'ads'));
    if (docSnap.exists()) {
      return { success: true, settings: docSnap.data() };
    } else {
      return { 
        success: true, 
        settings: {
          headerAd: '',
          sidebarAd: '',
          footerAd: '',
          inVideoAd: ''
        } 
      };
    }
  } catch (error) {
    console.error('Error getting ad settings:', error);
    return { success: false, error: error.message };
  }
};

export const updateAdSettings = async (adSettings) => {
  try {
    await updateDoc(doc(db, SETTINGS_COLLECTION, 'ads'), {
      ...adSettings,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating ad settings:', error);
    return { success: false, error: error.message };
  }
};

// Get random videos (for Home page)
export const getRandomVideos = async (limit = 50) => {
  try {
    const result = await getVideos(100);
    if (result.success) {
      const shuffled = [...result.videos].sort(() => Math.random() - 0.5);
      return { success: true, videos: shuffled.slice(0, limit) };
    }
    return result;
  } catch (error) {
    console.error('Error getting random videos:', error);
    return { success: false, error: error.message };
  }
};

// Get latest videos (sorted by creation date)
export const getLatestVideos = async (limit = 50) => {
  try {
    const result = await getVideos(limit);
    if (result.success) {
      const sorted = [...result.videos].sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB - dateA;
      });
      return { success: true, videos: sorted };
    }
    return result;
  } catch (error) {
    console.error('Error getting latest videos:', error);
    return { success: false, error: error.message };
  }
};

// Get trending videos (based on views and daily rotation)
export const getTrendingVideos = async (limit = 50) => {
  try {
    const result = await getVideos(100);
    if (result.success) {
      const sortedByViews = [...result.videos].sort((a, b) => {
        return (b.views || 0) - (a.views || 0);
      });

      const today = new Date();
      const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
      const rotationIndex = seed % Math.max(1, sortedByViews.length);
      
      const rotatedVideos = [
        ...sortedByViews.slice(rotationIndex),
        ...sortedByViews.slice(0, rotationIndex)
      ];

      return { success: true, videos: rotatedVideos.slice(0, limit) };
    }
    return result;
  } catch (error) {
    console.error('Error getting trending videos:', error);
    return { success: false, error: error.message };
  }
};
