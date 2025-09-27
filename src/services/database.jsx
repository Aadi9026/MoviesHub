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

/* -------------------- SEARCH -------------------- */
export const searchVideos = async (searchTerm) => {
  try {
    const allVideosResult = await getVideos(100);
    if (!allVideosResult.success) {
      return { success: false, error: 'Failed to load videos' };
    }

    const term = searchTerm.toLowerCase().trim();
    if (term.length < 2) return { success: true, videos: [] };

    const filteredVideos = allVideosResult.videos.filter((video) => {
      const title = (video.title || '').toLowerCase();
      const description = (video.description || '').toLowerCase();
      const genre = (video.genre || '').toLowerCase();
      return (
        title.includes(term) ||
        description.includes(term) ||
        genre.includes(term) ||
        title.split(' ').some((word) => word.startsWith(term)) ||
        genre.split(' ').some((word) => word.startsWith(term))
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

/* -------------------- GET MULTIPLE -------------------- */
export const getVideos = async (limitCount = 50) => {
  try {
    const q = query(
      collection(db, VIDEOS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const videos = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return { success: true, videos };
  } catch (error) {
    console.error('Error getting videos:', error);
    // fallback without ordering
    try {
      const querySnapshot = await getDocs(collection(db, VIDEOS_COLLECTION));
      const videos = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return { success: true, videos: videos.slice(0, limitCount) };
    } catch (fallbackError) {
      return { success: false, error: fallbackError.message };
    }
  }
};

/* -------------------- TRENDING & LATEST -------------------- */
export const getTrendingVideos = async (limitCount = 12) => {
  try {
    const allVideosResult = await getVideos(50);
    if (!allVideosResult.success) {
      return { success: false, error: 'Failed to load videos' };
    }

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
    const videos = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { success: true, videos };
  } catch (error) {
    console.error('Error getting latest videos:', error);
    try {
      const allVideosResult = await getVideos(limitCount);
      if (allVideosResult.success) {
        return { success: true, videos: allVideosResult.videos.reverse() };
      }
      throw new Error('Fallback failed');
    } catch (fallbackError) {
      return { success: false, error: fallbackError.message };
    }
  }
};

/* -------------------- NEWLY ADDED FUNCTIONS -------------------- */

// Get a single video by its Firestore document ID
export const getVideo = async (id) => {
  try {
    const docRef = doc(db, VIDEOS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Video not found');
    return { success: true, video: { id: snap.id, ...snap.data() } };
  } catch (error) {
    console.error('Error getting video:', error);
    return { success: false, error: error.message };
  }
};

// Delete a video document by ID
export const deleteVideo = async (id) => {
  try {
    await deleteDoc(doc(db, VIDEOS_COLLECTION, id));
    return { success: true };
  } catch (error) {
    console.error('Error deleting video:', error);
    return { success: false, error: error.message };
  }
};

// Get related videos by matching genre
export const getRelatedVideos = async (genre, limitCount = 6) => {
  try {
    const q = query(
      collection(db, VIDEOS_COLLECTION),
      where('genre', '==', genre),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    const videos = querySnapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    return { success: true, videos };
  } catch (error) {
    console.error('Error getting related videos:', error);
    return { success: false, error: error.message };
  }
};
