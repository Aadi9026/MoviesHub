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
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

const VIDEOS_COLLECTION = 'videos';
const ADS_COLLECTION = 'adSettings';

/* ------------------ Video CRUD ------------------ */
export const addVideo = async (videoData) => {
  try {
    const docRef = await addDoc(collection(db, VIDEOS_COLLECTION), {
      ...videoData,
      createdAt: serverTimestamp(),
      views: 0,
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding video:', error);
    return { success: false, error: error.message };
  }
};

export const updateVideo = async (id, updatedData) => {
  try {
    const docRef = doc(db, VIDEOS_COLLECTION, id);
    await updateDoc(docRef, updatedData);
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

export const getVideo = async (id) => {
  try {
    const docRef = doc(db, VIDEOS_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return { success: false, error: 'Video not found' };
    return { success: true, video: { id: snapshot.id, ...snapshot.data() } };
  } catch (error) {
    console.error('Error getting video:', error);
    return { success: false, error: error.message };
  }
};

/* ------------------ Related Videos ------------------ */
export const getRelatedVideos = async (genre, excludeId, limitCount = 6) => {
  try {
    const q = query(
      collection(db, VIDEOS_COLLECTION),
      where('genre', '==', genre),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const videos = querySnapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(v => v.id !== excludeId);

    return { success: true, videos };
  } catch (error) {
    console.error('Error getting related videos:', error);
    return { success: false, error: error.message };
  }
};

/* ------------------ Ads Settings ------------------ */
export const getAdSettings = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, ADS_COLLECTION));
    if (querySnapshot.empty) return { success: true, settings: {} };

    const settings = {};
    querySnapshot.forEach(doc => {
      settings[doc.id] = doc.data();
    });

    return { success: true, settings };
  } catch (error) {
    console.error('Error getting ad settings:', error);
    return { success: false, error: error.message };
  }
};

export const updateAdSettings = async (id, newData) => {
  try {
    const docRef = doc(db, ADS_COLLECTION, id);
    await updateDoc(docRef, newData);
    return { success: true };
  } catch (error) {
    console.error('Error updating ad settings:', error);
    return { success: false, error: error.message };
  }
};

/* ------------------ Video Queries ------------------ */
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
      return title.includes(term) || description.includes(term) || genre.includes(term);
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
    return { success: false, error: error.message };
  }
};
