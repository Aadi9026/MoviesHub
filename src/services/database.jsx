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

export const getVideos = async (limitCount = 50) => {
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
    if (!q._query.orderBy.length) {
      videos.sort((a, b) => {
        const aDate = a.createdAt?.toDate?.() || new Date(0);
        const bDate = b.createdAt?.toDate?.() || new Date(0);
        return bDate - aDate;
      });
    }
    
    return { success: true, videos };
  } catch (error) {
    console.error('Error getting videos:', error);
    return { success: false, error: error.message };
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
      if (!videoData.embedCode) {
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
    console.error('Error getting video:', error);
    return { success: false, error: error.message };
  }
};

export const searchVideos = async (searchTerm) => {
  try {
    const allVideos = await getVideos(100);
    
    if (!allVideos.success) {
      return { success: false, error: 'Failed to load videos' };
    }

    const term = searchTerm.toLowerCase().trim();
    
    if (term.length < 2) {
      return { success: true, videos: allVideos.videos };
    }

    const filteredVideos = allVideos.videos.filter(video => {
      const title = (video.title || '').toLowerCase();
      const description = (video.description || '').toLowerCase();
      const genre = (video.genre || '').toLowerCase();
      
      return title.includes(term) || 
             description.includes(term) || 
             genre.includes(term) ||
             title.split(' ').some(word => word.startsWith(term)) ||
             genre.split(' ').some(word => word.startsWith(term));
    });

    // Sort by relevance
    filteredVideos.sort((a, b) => {
      const aTitle = (a.title || '').toLowerCase();
      const bTitle = (b.title || '').toLowerCase();
      
      if (aTitle.includes(term) && !bTitle.includes(term)) return -1;
      if (!aTitle.includes(term) && bTitle.includes(term)) return 1;
      
      if (aTitle.startsWith(term) && !bTitle.startsWith(term)) return -1;
      if (!aTitle.startsWith(term) && bTitle.startsWith(term)) return 1;
      
      return (b.views || 0) - (a.views || 0);
    });

    return { success: true, videos: filteredVideos };
  } catch (error) {
    console.error('Error searching videos:', error);
    return { success: false, error: error.message };
  }
};

export const getRelatedVideos = async (genre, excludeId, limitCount = 6) => {
  try {
    const allVideos = await getVideos(50);
    
    if (!allVideos.success) {
      return { success: false, error: 'Failed to load videos' };
    }

    const relatedVideos = allVideos.videos
      .filter(video => 
        video.id !== excludeId && 
        video.genre === genre &&
        video.isActive !== false
      )
      .slice(0, limitCount);
      
    return { success: true, videos: relatedVideos };
  } catch (error) {
    console.error('Error getting related videos:', error);
    return { success: false, error: error.message };
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
    if (error.code === 'not-found') {
      try {
        await setDoc(doc(db, SETTINGS_COLLECTION, 'ads'), {
          ...adSettings,
          id: 'ads',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        return { success: true };
      } catch (createError) {
        console.error('Error creating ad settings:', createError);
        return { success: false, error: createError.message };
      }
    }
    console.error('Error updating ad settings:', error);
    return { success: false, error: error.message };
  }
};
