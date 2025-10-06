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

// Video Management
export const addVideo = async (videoData) => {
  try {
    const docRef = await addDoc(collection(db, VIDEOS_COLLECTION), {
      title: videoData.title || '',
      description: videoData.description || '',
      genre: videoData.genre || 'Action',
      thumbnail: videoData.thumbnail || '',
      embedCode: videoData.embedCode || '',
      duration: parseInt(videoData.duration) || 120,
      altSources: videoData.altSources || ['', '', '', ''],
      altSourcesEnabled: videoData.altSourcesEnabled || [false, false, false, false],
      downloadLinks: videoData.downloadLinks || { '480p': '', '720p': '', '1080p': '', '4K': '' },
      adCode: videoData.adCode || '',
      // Add movie metadata if available
      year: videoData.year || '',
      rating: videoData.rating || '',
      actors: videoData.actors || '',
      director: videoData.director || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      views: 0,
      likes: 0,
      isActive: true
    });
    console.log('✅ Movie added successfully with ID:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('❌ Error adding video:', error);
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
    console.log('✅ Movie updated successfully:', id);
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating video:', error);
    return { success: false, error: error.message };
  }
};

export const deleteVideo = async (id) => {
  try {
    await deleteDoc(doc(db, VIDEOS_COLLECTION, id));
    console.log('✅ Movie deleted successfully:', id);
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting video:', error);
    return { success: false, error: error.message };
  }
};

// ADD THIS FUNCTION: Duplicate Video Detection
export const checkDuplicateVideo = async (title, genre, excludeId = null) => {
  try {
    // Validate input
    if (!title || !genre) {
      return { success: true, duplicates: [] };
    }

    const allVideosResult = await getVideos();

    // Ensure we have a valid videos array
    const videos = Array.isArray(allVideosResult.videos) ? allVideosResult.videos : [];

    const searchTitle = title.toLowerCase().trim();
    const searchGenre = genre.toLowerCase().trim();

    const duplicates = videos.filter(video => {
      if (!video || !video.id) return false;

      // Skip the excluded video (for edit mode)
      if (excludeId && video.id === excludeId) return false;

      const videoTitle = (video.title || '').toLowerCase();
      const videoGenre = (video.genre || '').toLowerCase();

      // Check for exact match
      if (videoTitle === searchTitle && videoGenre === searchGenre) {
        return true;
      }

      // Check for similar titles (fuzzy match)
      const titleSimilarity = calculateSimilarity(videoTitle, searchTitle);
      const genreMatch = videoGenre === searchGenre;

      // Consider duplicate if titles are very similar and same genre
      if (titleSimilarity > 0.8 && genreMatch) {
        return true;
      }

      // Check for contained titles (e.g., "KGF Chapter 2" vs "KGF Chapter 2 (2022)")
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

  // Simple similarity calculation
  const words1 = str1.split(/\s+/).filter(word => word.length > 2);
  const words2 = str2.split(/\s+/).filter(word => word.length > 2);

  const commonWords = words1.filter(word => words2.includes(word));
  const similarity = commonWords.length / Math.max(words1.length, words2.length);

  return similarity;
};

// ✅ FIXED: GET ALL VIDEOS WITHOUT LIMIT
export const getVideos = async (limitCount = null) => {
  try {
    let q;

    // Try with ordering first
    try {
      if (limitCount) {
        // If limit specified, use it
        q = query(
          collection(db, VIDEOS_COLLECTION),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      } else {
        // NO LIMIT - Fetch ALL movies
        q = query(
          collection(db, VIDEOS_COLLECTION),
          orderBy('createdAt', 'desc')
        );
      }
    } catch (orderError) {
      // If ordering fails, get without order (but still no limit unless specified)
      if (limitCount) {
        q = query(
          collection(db, VIDEOS_COLLECTION),
          limit(limitCount)
        );
      } else {
        q = query(collection(db, VIDEOS_COLLECTION));
      }
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

    console.log(`✅ Fetched ${videos.length} movies from Firebase`);
    return { success: true, videos: videos || [] };
  } catch (error) {
    console.error('❌ Error getting videos:', error);
    return { success: true, videos: [] }; // Return empty array instead of error
  }
};

// FIXED: getVideo function with proper error handling
export const getVideo = async (id) => {
  try {
    if (!id) {
      return { success: false, error: 'Video ID is required' };
    }

    const docSnap = await getDoc(doc(db, VIDEOS_COLLECTION, id));

    if (docSnap.exists()) {
      const videoData = docSnap.data();

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
          ...videoData 
        } 
      };
    } else {
      return { success: false, error: 'Video not found' };
    }
  } catch (error) {
    console.error('❌ Error getting video:', error);
    return { success: false, error: error.message };
  }
};

// FIXED: searchVideos with proper null checks - searches ALL movies
export const searchVideos = async (searchTerm) => {
  try {
    // Validate input
    if (!searchTerm || typeof searchTerm !== 'string') {
      return { success: true, videos: [] };
    }

    // Fetch ALL videos for search
    const allVideosResult = await getVideos();

    // Ensure we have a valid videos array
    const videos = Array.isArray(allVideosResult.videos) ? allVideosResult.videos : [];

    const term = searchTerm.toLowerCase().trim();

    if (term.length < 2) {
      return { success: true, videos: videos };
    }

    // Safe filtering with null checks
    const filteredVideos = videos.filter(video => {
      if (!video) return false;

      const title = (video.title || '').toLowerCase();
      const description = (video.description || '').toLowerCase();
      const genre = (video.genre || '').toLowerCase();

      // Check if search term exists in title, description, or genre
      return title.includes(term) || 
             description.includes(term) || 
             genre.includes(term) ||
             (title.split(' ') || []).some(word => word.startsWith(term)) ||
             (genre.split(' ') || []).some(word => word.startsWith(term));
    });

    // Safe sorting with null checks
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

    console.log(`🔍 Found ${filteredVideos.length} movies matching "${searchTerm}"`);
    return { success: true, videos: filteredVideos };
  } catch (error) {
    console.error('❌ Error searching videos:', error);
    return { success: true, videos: [] }; // Return empty array on error
  }
};

// ✅ UPDATED: Get unlimited related videos with RANDOM GENRES (Mixed)
export const getRelatedVideos = async (genre, excludeId, limitCount = null) => {
  try {
    // Fetch ALL videos first
    const allVideosResult = await getVideos();
    
    // Ensure we have a valid videos array
    const videos = Array.isArray(allVideosResult.videos) ? allVideosResult.videos : [];
    
    // Get ALL videos except the current one
    const allRelatedVideos = videos.filter(video => {
      if (!video || !video.id) return false;
      return video.id !== excludeId && video.isActive !== false;
    });
    
    // RANDOMIZE/SHUFFLE the videos (mix all genres randomly)
    const shuffledVideos = [...allRelatedVideos].sort(() => Math.random() - 0.5);
    
    // If limitCount is specified, return that many videos
    // Otherwise return ALL related videos
    const finalVideos = limitCount 
      ? shuffledVideos.slice(0, limitCount)
      : shuffledVideos;
    
    console.log(`✅ Found ${finalVideos.length} related videos (random genres mixed)`);
    
    return { success: true, videos: finalVideos };
  } catch (error) {
    console.error('❌ Error getting related videos:', error);
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
    console.error('❌ Error getting ad settings:', error);
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
    console.error('❌ Error updating ad settings:', error);
    return { success: false, error: error.message };
  }
};

// Get random videos (for Home page) - fetches ALL then randomizes
export const getRandomVideos = async (limit = 100) => {
  try {
    const result = await getVideos(); // Get ALL videos
    if (result.success) {
      const shuffled = [...result.videos].sort(() => Math.random() - 0.5);
      return { success: true, videos: shuffled.slice(0, limit) };
    }
    return result;
  } catch (error) {
    console.error('❌ Error getting random videos:', error);
    return { success: false, error: error.message };
  }
};

// Get latest videos (sorted by creation date) - shows ALL
export const getLatestVideos = async (limit = 50) => {
  try {
    const result = await getVideos(); // Get ALL videos
    if (result.success) {
      const sorted = [...result.videos].sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB - dateA;
      });
      return { success: true, videos: sorted.slice(0, limit) };
    }
    return result;
  } catch (error) {
    console.error('❌ Error getting latest videos:', error);
    return { success: false, error: error.message };
  }
};

// Get trending videos (based on views and daily rotation) - uses ALL videos
export const getTrendingVideos = async (limit = 50) => {
  try {
    const result = await getVideos(); // Get ALL videos
    if (result.success) {
      // Sort by views (highest first)
      const sortedByViews = [...result.videos].sort((a, b) => {
        return (b.views || 0) - (a.views || 0);
      });

      // Apply daily rotation
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
    console.error('❌ Error getting trending videos:', error);
    return { success: false, error: error.message };
  }
};
