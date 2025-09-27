import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  getDocs, getDoc, query, where, orderBy, limit,
  serverTimestamp, increment
} from 'firebase/firestore';
import { db } from './firebase';

const VIDEOS = 'videos';
const SETTINGS = 'settings';

/* === Core === */
export const getVideos = async (limitCount = 50) => {
  const q = query(collection(db, VIDEOS), orderBy('createdAt', 'desc'), limit(limitCount));
  const snap = await getDocs(q);
  return { success: true, videos: snap.docs.map(d => ({ id: d.id, ...d.data() })) };
};

export const getVideo = async (id) => {
  const ref = doc(db, VIDEOS, id);
  const snap = await getDoc(ref);
  return snap.exists() ? { success: true, video: { id: snap.id, ...snap.data() } }
                       : { success: false, error: 'Not found' };
};

export const searchVideos = async (term) => {
  const all = await getVideos(200);
  const t = (term || '').toLowerCase().trim();
  const filtered = all.videos.filter(v =>
    (v.title || '').toLowerCase().includes(t) ||
    (v.description || '').toLowerCase().includes(t) ||
    (v.genre || '').toLowerCase().includes(t)
  );
  return { success: true, videos: filtered };
};

export const getRelatedVideos = async (genre, limitCount = 6) => {
  if (!genre) return { success: true, videos: [] };
  const q = query(collection(db, VIDEOS),
                  where('genre', '==', genre),
                  orderBy('createdAt', 'desc'),
                  limit(limitCount));
  const snap = await getDocs(q);
  return { success: true, videos: snap.docs.map(d => ({ id: d.id, ...d.data() })) };
};

/* === CRUD === */
export const addVideo = async (video) =>
  ({ success: true, id: (await addDoc(collection(db, VIDEOS),
     { ...video, createdAt: serverTimestamp(), views: video.views ?? 0 })).id });

export const updateVideo = async (id, data) =>
  { await updateDoc(doc(db, VIDEOS, id), data); return { success: true }; };

export const deleteVideo = async (id) =>
  { await deleteDoc(doc(db, VIDEOS, id)); return { success: true }; };

/* === Extras === */
export const getAdSettings = async () => {
  const ref = doc(db, SETTINGS, 'ads');
  const snap = await getDoc(ref);
  return snap.exists() ? { success: true, data: snap.data() }
                       : { success: false, error: 'Not found' };
};

export const updateAdSettings = async (data) =>
  { await updateDoc(doc(db, SETTINGS, 'ads'), data); return { success: true }; };

export const incrementVideoViews = async (id, by = 1) =>
  { await updateDoc(doc(db, VIDEOS, id), { views: increment(by) }); return { success: true }; };
