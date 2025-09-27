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

// Fix the search function to work properly
export const searchVideos = async (searchTerm) => {
  try {
    // First, get all videos
    const allVideosResult = await getVideos(100);
    
    if (!allVideosResult.success) {
      return { success: false, error: 'Failed to load videos' };
    }

    const term = searchTerm.toLowerCase().trim();
    
    if (term.length < 2) {
      return { success: true, videos: [] };
    }

    // Filter videos based on search term
    const filteredVideos = allVideosResult.videos.filter(video => {
      const title = (video.title || '').toLowerCase();
      const description = (video.description || '').toLowerCase();
      const genre = (video.genre || '').toLowerCase();
      
      // Check if search term exists in title, description, or genre
      return title.includes(term) || 
             description.includes(term) || 
             genre.includes(term) ||
             title.split(' ').some(word => word.startsWith(term)) ||
             genre.split(' ').some(word => word.startsWith(term));
    });

    // Sort by relevance (exact matches first)
    filteredVideos.sort((a, b) => {
      const aTitle = (a.title || '').toLowerCase();
      const bTitle = (b.title || '').toLowerCase();
      
      // Exact title matches first
      if (aTitle === term && bTitle !== term) return -1;
      if (aTitle !== term && bTitle === term) return 1;
      
      // Title starts with term
      if (aTitle.startsWith(term) && !bTitle.startsWith(term)) return -1;
      if (!aTitle.startsWith(term) && bTitle.startsWith(term)) return 1;
      
      // Then by views (higher first)
      return (b.views || 0) - (a.views || 0);
    });

    return { success: true, videos: filteredVideos };
  } catch (error) {
    console.error('Error searching videos:', error);
    return { success: false, error: error.message };
  }
};

// Keep the existing functions but ensure they work correctly
export const getVideos = async (limitCount = 50) => {
  try {
    const q = query(
      collection(db, VIDEOS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const videos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, videos };
  } catch (error) {
    console.error('Error getting videos:', error);
    // If ordering fails, try without order
    try {
      const querySnapshot = await getDocs(collection(db, VIDEOS_COLLECTION));
      const videos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { success: true, videos: videos.slice(0, limitCount) };
    } catch (fallbackError) {
      return { success: false, error: fallbackError.message };
    }
  }
};
// Add these functions to your existing database.js

export const getTrendingVideos = async (limitCount = 12) => {
  try {
    const allVideosResult = await getVideos(50); // Get more videos to sort
    
    if (!allVideosResult.success) {
      return { success: false, error: 'Failed to load videos' };
    }

    // Sort by views (trending = most viewed)
    const trendingVideos = [...allVideosResult.videos]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, limitCount);

    return { success: true, videos: trendingVideos };
  } catch (error) {
    console.error('Error getting trending videos:', error);
    return { success: false, error: error.message };
  }
};

export const getLatestVideos = async (limitCount = 12) => {
  try {
    const q = query(
      collection(db, VIDEOS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const videos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return { success: true, videos };
  } catch (error) {
    console.error('Error getting latest videos:', error);
    // Fallback: try without ordering
    try {
      const allVideosResult = await getVideos(limitCount);
      if (allVideosResult.success) {
        // Reverse to show newest first (approximation)
        return { success: true, videos: allVideosResult.videos.reverse() };
      }
      throw new Error('Fallback failed');
    } catch (fallbackError) {
      return { success: false, error: error.message };
    }
  }
};
