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
const AD_SETTINGS_COLLECTION = 'adSettings';

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

// ===== NEW FUNCTIONS FOR THE MISSING IMPORTS =====

// Ad Settings Functions
export const getAdSettings = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, AD_SETTINGS_COLLECTION));
    
    if (querySnapshot.empty) {
      // Create default ad settings if none exist
      const defaultSettings = {
        enabled: false,
        adUnit: '',
        frequency: 3,
        interstitialAds: false,
        bannerAds: true,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, AD_SETTINGS_COLLECTION), defaultSettings);
      return { 
        id: docRef.id, 
        ...defaultSettings,
        createdAt: new Date().toISOString()
      };
    }
    
    // Return the first document (assuming only one settings document)
    const doc = querySnapshot.docs[0];
    return { 
      id: doc.id, 
      ...doc.data() 
    };
  } catch (error) {
    console.error('Error getting ad settings:', error);
    // Return default settings on error
    return {
      enabled: false,
      adUnit: '',
      frequency: 3,
      interstitialAds: false,
      bannerAds: true
    };
  }
};

export const updateAdSettings = async (settings) => {
  try {
    const querySnapshot = await getDocs(collection(db, AD_SETTINGS_COLLECTION));
    
    if (querySnapshot.empty) {
      // Create new settings if none exist
      const newSettings = {
        ...settings,
        updatedAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, AD_SETTINGS_COLLECTION), newSettings);
      return { success: true, id: docRef.id };
    } else {
      // Update existing settings
      const docId = querySnapshot.docs[0].id;
      const docRef = doc(db, AD_SETTINGS_COLLECTION, docId);
      await updateDoc(docRef, {
        ...settings,
        updatedAt: serverTimestamp()
      });
      return { success: true, id: docId };
    }
  } catch (error) {
    console.error('Error updating ad settings:', error);
    return { success: false, error: error.message };
  }
};

// Video Management Functions
export const addVideo = async (videoData) => {
  try {
    const videoWithMetadata = {
      ...videoData,
      views: 0,
      likes: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, VIDEOS_COLLECTION), videoWithMetadata);
    
    return { 
      success: true, 
      video: {
        id: docRef.id,
        ...videoWithMetadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error adding video:', error);
    return { success: false, error: error.message };
  }
};

export const updateVideo = async (videoId, videoData) => {
  try {
    const docRef = doc(db, VIDEOS_COLLECTION, videoId);
    const updateData = {
      ...videoData,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(docRef, updateData);
    
    // Get the updated document
    const updatedDoc = await getDoc(docRef);
    
    return { 
      success: true, 
      video: {
        id: updatedDoc.id,
        ...updatedDoc.data()
      }
    };
  } catch (error) {
    console.error('Error updating video:', error);
    return { success: false, error: error.message };
  }
};

export const deleteVideo = async (videoId) => {
  try {
    const docRef = doc(db, VIDEOS_COLLECTION, videoId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting video:', error);
    return { success: false, error: error.message };
  }
};

export const getVideo = async (videoId) => {
  try {
    const docRef = doc(db, VIDEOS_COLLECTION, videoId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { 
        id: docSnap.id, 
        ...docSnap.data() 
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting video:', error);
    return null;
  }
};

export const getRelatedVideos = async (currentVideoId, relatedLimit = 6) => {
  try {
    const currentVideo = await getVideo(currentVideoId);
    if (!currentVideo) {
      return [];
    }
    
    const allVideosResult = await getVideos(50); // Get more videos to filter from
    if (!allVideosResult.success) {
      return [];
    }
    
    const allVideos = allVideosResult.videos.filter(video => video.id !== currentVideoId);
    
    // Find related videos by category/tags
    const relatedByCategory = allVideos.filter(video => 
      video.category === currentVideo.category
    );
    
    const relatedByTags = allVideos.filter(video => 
      video.tags && currentVideo.tags && 
      video.tags.some(tag => currentVideo.tags.includes(tag))
    );
    
    // Combine and remove duplicates
    const relatedVideos = [...relatedByCategory, ...relatedByTags]
      .filter((video, index, self) => 
        index === self.findIndex(v => v.id === video.id)
      )
      .slice(0, relatedLimit);
    
    // If not enough related videos, fill with most recent
    if (relatedVideos.length < relatedLimit) {
      const additionalVideos = allVideos
        .filter(video => !relatedVideos.some(rv => rv.id === video.id))
        .slice(0, relatedLimit - relatedVideos.length);
      
      relatedVideos.push(...additionalVideos);
    }
    
    return relatedVideos;
  } catch (error) {
    console.error('Error getting related videos:', error);
    return [];
  }
};

// Optional: Function to increment video views
export const incrementVideoViews = async (videoId) => {
  try {
    const docRef = doc(db, VIDEOS_COLLECTION, videoId);
    await updateDoc(docRef, {
      views: increment(1),
      lastViewedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error incrementing video views:', error);
    return { success: false, error: error.message };
  }
};
