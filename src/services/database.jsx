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
const SETTINGS_COLLECTION = 'settings'; // you can rename if your collection differs

/* -------------------  SEARCH & LISTING  ------------------- */
export const searchVideos = async (searchTerm) => {
  try {
    const allVideosResult = await getVideos(100);
    if (!allVideosResult.success) return { success: false, error: 'Failed to load videos' };

    const term = searchTerm.toLowerCase().trim();
    if (term.length < 2) return { success: true, videos: [] };

    const filteredVideos = allVideosResult.videos.filter(video => {
      const title = (video.title || '').toLowerCase();
      const description = (video.description || '').toLowerCase();
      const genre = (video.genre || '').toLowerCase();
      return (
        title.includes(term) ||
        description.includes(term) ||
        genre.includes(term) ||
        title.split(' ').some(word => word.startsWith(term)) ||
        genre.split(' ').some(word => word.startsWith(term))
      );
    });

    filteredVideos.sort((a, b) => {
      const aTitle = (a.title || '').toLowerCase();
      const bTitle = (b.title || '').toLowerCase();
      if (aTitle === term && bTitle !== term) return -1;
      if (aTitle !== term && bTitle === term) return 1;
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

export const getVideos = async (limitCount = 50) => {
  try {
    const q = query(
      collection(db, VIDEOS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    const videos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, videos };
  } catch (error) {
    console.error('Error getting videos:', error);
    // Fallback without order
    try {
      const querySnapshot = await getDocs(collection(db, VIDEOS_COLLECTION));
      const videos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { success: true, videos: videos.slice(0, limitCount) };
    } catch (fallbackError) {
      return { success: false, error: fallbackError.message };
    }
  }
};

export const getTrendingVideos = async (limitCount = 12) => {
  try {
    const allVideosResult = await getVideos(50);
    if (!allVideosResult.success) return { success: false, error: 'Failed to load videos' };

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
    const videos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, videos };
  } catch (error) {
    console.error('Error getting latest videos:', error);
    // Fallback
    const allVideosResult = await getVideos(limitCount);
    if (allVideosResult.success) {
      return { success: true, videos: allVideosResult.videos.reverse() };
    }
    return { success: false, error: error.message };
  }
};

/* -------------------  ADMIN HELPERS  ------------------- */
// Ad settings
export const getAdSettings = async () => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, 'ads');
    const snap = await getDoc(docRef);
    return snap.exists() ? { success: true, data: snap.data() } : { success: false, error: 'Not found' };
  } catch (e) {
    console.error('Error getting ad settings:', e);
    return { success: false, error: e.message };
  }
};

export const updateAdSettings = async (data) => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, 'ads');
    await updateDoc(docRef, data);
    return { success: true };
  } catch (e) {
    console.error('Error updating ad settings:', e);
    return { success: false, error: e.message };
  }
};

// Videos
export const addVideo = async (video) => {
  try {
    const docRef = await addDoc(collection(db, VIDEOS_COLLECTION), {
      ...video,
      createdAt: serverTimestamp(),
      views: 0
    });
    return { success: true, id: docRef.id };
  } catch (e) {
    console.error('Error adding video:', e);
    return { success: false, error: e.message };
  }
};

export const updateVideo = async (id, data) => {
  try {
    const docRef = doc(db, VIDEOS_COLLECTION, id);
    await updateDoc(docRef, data);
    return { success: true };
  } catch (e) {
    console.error('Error updating video:', e);
    return { success: false, error: e.message };
  }
};
