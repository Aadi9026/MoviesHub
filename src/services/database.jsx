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
      ...videoData,
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
    const q = query(
      collection(db, VIDEOS_COLLECTION),
      where('isActive', '==', true),
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
    return { success: false, error: error.message };
  }
};

export const getVideo = async (id) => {
  try {
    const docSnap = await getDoc(doc(db, VIDEOS_COLLECTION, id));
    if (docSnap.exists()) {
      // Increment views count
      await updateDoc(doc(db, VIDEOS_COLLECTION, id), {
        views: increment(1)
      });
      
      return { 
        success: true, 
        video: { 
          id: docSnap.id, 
          ...docSnap.data() 
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
    // Firestore doesn't support full-text search natively, so we'll use multiple conditions
    const titleQuery = query(
      collection(db, VIDEOS_COLLECTION),
      where('title', '>=', searchTerm.toLowerCase()),
      where('title', '<=', searchTerm.toLowerCase() + '\uf8ff'),
      where('isActive', '==', true),
      limit(20)
    );
    
    const genreQuery = query(
      collection(db, VIDEOS_COLLECTION),
      where('genre', '==', searchTerm),
      where('isActive', '==', true),
      limit(20)
    );

    const [titleSnapshot, genreSnapshot] = await Promise.all([
      getDocs(titleQuery),
      getDocs(genreQuery)
    ]);

    const videosMap = new Map();
    
    titleSnapshot.docs.forEach(doc => {
      videosMap.set(doc.id, { id: doc.id, ...doc.data() });
    });
    
    genreSnapshot.docs.forEach(doc => {
      videosMap.set(doc.id, { id: doc.id, ...doc.data() });
    });

    const videos = Array.from(videosMap.values());
    return { success: true, videos };
  } catch (error) {
    console.error('Error searching videos:', error);
    return { success: false, error: error.message };
  }
};

export const getRelatedVideos = async (genre, excludeId, limitCount = 6) => {
  try {
    const q = query(
      collection(db, VIDEOS_COLLECTION),
      where('genre', '==', genre),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const videos = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(video => video.id !== excludeId);
      
    return { success: true, videos };
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
      // Return default settings if none exist
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
    // If document doesn't exist, create it
    if (error.code === 'not-found') {
      try {
        await addDoc(collection(db, SETTINGS_COLLECTION), {
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
