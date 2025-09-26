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
  limit
} from 'firebase/firestore';
import { db } from './firebase';

const VIDEOS_COLLECTION = 'videos';
const ADS_COLLECTION = 'ads';

export const addVideo = async (videoData) => {
  try {
    const docRef = await addDoc(collection(db, VIDEOS_COLLECTION), {
      ...videoData,
      createdAt: new Date(),
      views: 0
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateVideo = async (id, videoData) => {
  try {
    await updateDoc(doc(db, VIDEOS_COLLECTION, id), videoData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteVideo = async (id) => {
  try {
    await deleteDoc(doc(db, VIDEOS_COLLECTION, id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getVideos = async () => {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, VIDEOS_COLLECTION), orderBy('createdAt', 'desc'))
    );
    const videos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, videos };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getVideo = async (id) => {
  try {
    const docSnap = await getDoc(doc(db, VIDEOS_COLLECTION, id));
    if (docSnap.exists()) {
      return { success: true, video: { id: docSnap.id, ...docSnap.data() } };
    } else {
      return { success: false, error: 'Video not found' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const searchVideos = async (searchTerm) => {
  try {
    const q = query(
      collection(db, VIDEOS_COLLECTION),
      where('title', '>=', searchTerm),
      where('title', '<=', searchTerm + '\uf8ff'),
      limit(20)
    );
    const querySnapshot = await getDocs(q);
    const videos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, videos };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getRelatedVideos = async (genre, excludeId) => {
  try {
    const q = query(
      collection(db, VIDEOS_COLLECTION),
      where('genre', '==', genre),
      limit(10)
    );
    const querySnapshot = await getDocs(q);
    const videos = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(video => video.id !== excludeId);
    return { success: true, videos };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
