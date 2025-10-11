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
      // Enhanced movie metadata for better search
      year: videoData.year || '',
      rating: videoData.rating || '',
      actors: videoData.actors || '',
      director: videoData.director || '',
      // Search optimization fields
      searchTitle: (videoData.title || '').toLowerCase(),
      searchActors: (videoData.actors || '').toLowerCase(),
      searchDirector: (videoData.director || '').toLowerCase(),
      searchKeywords: generateSearchKeywords(videoData),
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

// Generate search keywords from movie data
const generateSearchKeywords = (videoData) => {
  const keywords = [];
  
  if (videoData.title) {
    keywords.push(videoData.title.toLowerCase());
    // Add title without special characters
    keywords.push(videoData.title.replace(/[^a-zA-Z0-9 ]/g, '').toLowerCase());
  }
  
  if (videoData.actors) {
    videoData.actors.split(',').forEach(actor => {
      const cleanActor = actor.trim().toLowerCase();
      keywords.push(cleanActor);
    });
  }
  
  if (videoData.director) {
    keywords.push(videoData.director.toLowerCase());
  }
  
  if (videoData.genre) {
    keywords.push(videoData.genre.toLowerCase());
  }
  
  if (videoData.year) {
    keywords.push(videoData.year.toString());
  }
  
  return keywords.join(' ');
};

export const updateVideo = async (id, videoData) => {
  try {
    const videoRef = doc(db, VIDEOS_COLLECTION, id);
    await updateDoc(videoRef, {
      ...videoData,
      // Update search fields
      searchTitle: (videoData.title || '').toLowerCase(),
      searchActors: (videoData.actors || '').toLowerCase(),
      searchDirector: (videoData.director || '').toLowerCase(),
      searchKeywords: generateSearchKeywords(videoData),
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

// Enhanced Duplicate Video Detection
export const checkDuplicateVideo = async (title, genre, excludeId = null) => {
  try {
    if (!title || !genre) {
      return { success: true, duplicates: [] };
    }

    const allVideosResult = await getVideos();
    const videos = Array.isArray(allVideosResult.videos) ? allVideosResult.videos : [];

    const searchTitle = title.toLowerCase().trim();
    const searchGenre = genre.toLowerCase().trim();

    const duplicates = videos.filter(video => {
      if (!video || !video.id) return false;
      if (excludeId && video.id === excludeId) return false;

      const videoTitle = (video.title || '').toLowerCase();
      const videoGenre = (video.genre || '').toLowerCase();

      // Exact match
      if (videoTitle === searchTitle && videoGenre === searchGenre) {
        return true;
      }

      // Similar titles with same genre
      const titleSimilarity = calculateSimilarity(videoTitle, searchTitle);
      if (titleSimilarity > 0.8 && videoGenre === searchGenre) {
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

// Improved similarity calculation
const calculateSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;

  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  // Remove common words and special characters
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
  const cleanStr1 = str1.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').filter(word => 
    word.length > 2 && !commonWords.includes(word)
  );
  const cleanStr2 = str2.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').filter(word => 
    word.length > 2 && !commonWords.includes(word)
  );

  const commonWordsCount = cleanStr1.filter(word => cleanStr2.includes(word)).length;
  const similarity = commonWordsCount / Math.max(cleanStr1.length, cleanStr2.length);

  return similarity;
};

// ✅ FIXED: GET ALL VIDEOS WITHOUT LIMIT
export const getVideos = async (limitCount = null) => {
  try {
    let q;

    try {
      if (limitCount) {
        q = query(
          collection(db, VIDEOS_COLLECTION),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      } else {
        q = query(
          collection(db, VIDEOS_COLLECTION),
          orderBy('createdAt', 'desc')
        );
      }
    } catch (orderError) {
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
    return { success: true, videos: [] };
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

      if (!videoData?.embedCode) {
        return { success: false, error: 'Video embed code is missing' };
      }

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

// 🎯 ENHANCED: IMDb-like Advanced Search Functionality
export const searchVideos = async (searchTerm, filters = {}) => {
  try {
    if (!searchTerm || typeof searchTerm !== 'string') {
      return { success: true, videos: [] };
    }

    const allVideosResult = await getVideos();
    const videos = Array.isArray(allVideosResult.videos) ? allVideosResult.videos : [];
    const term = searchTerm.toLowerCase().trim();

    if (term.length < 2) {
      return { success: true, videos: applyFilters(videos, filters) };
    }

    // Advanced scoring system
    const scoredVideos = videos.map(video => {
      if (!video) return { video: null, score: 0, matchType: 'none' };

      const title = (video.title || '').toLowerCase();
      const description = (video.description || '').toLowerCase();
      const genre = (video.genre || '').toLowerCase();
      const actors = (video.actors || '').toLowerCase();
      const director = (video.director || '').toLowerCase();
      const year = (video.year || '').toString();
      const searchKeywords = (video.searchKeywords || '').toLowerCase();

      let score = 0;
      let matchType = 'none';

      // 🏆 SCORING SYSTEM (IMDb-like prioritization)

      // 1. EXACT TITLE MATCH (Highest priority)
      if (title === term) {
        score += 1000;
        matchType = 'exact_title';
      }

      // 2. TITLE STARTS WITH search term
      else if (title.startsWith(term)) {
        score += 800;
        matchType = 'title_starts_with';
      }

      // 3. EXACT TITLE WORDS MATCH
      const titleWords = title.split(/\s+/).filter(word => word.length > 1);
      const searchWords = term.split(/\s+/).filter(word => word.length > 1);
      
      const allWordsMatch = searchWords.every(word => 
        titleWords.some(titleWord => titleWord === word)
      );
      if (allWordsMatch && searchWords.length > 0) {
        score += 700;
        matchType = 'exact_words';
      }

      // 4. TITLE CONTAINS search term
      else if (title.includes(term)) {
        score += 600;
        matchType = 'title_contains';
      }

      // 5. ACTOR NAME MATCH
      if (actors.includes(term)) {
        score += 400;
        matchType = matchType === 'none' ? 'actor_match' : matchType;
      }

      // 6. DIRECTOR MATCH
      if (director.includes(term)) {
        score += 350;
        matchType = matchType === 'none' ? 'director_match' : matchType;
      }

      // 7. YEAR MATCH
      if (year === term) {
        score += 300;
        matchType = matchType === 'none' ? 'year_match' : matchType;
      }

      // 8. INDIVIDUAL WORDS IN TITLE
      searchWords.forEach(word => {
        if (titleWords.includes(word)) {
          score += 150;
          if (matchType === 'none') matchType = 'word_in_title';
        }
      });

      // 9. GENRE MATCH
      if (genre.includes(term)) {
        score += 100;
        matchType = matchType === 'none' ? 'genre_match' : matchType;
      }

      // 10. SEARCH KEYWORDS MATCH
      if (searchKeywords.includes(term)) {
        score += 50;
        matchType = matchType === 'none' ? 'keyword_match' : matchType;
      }

      // 11. DESCRIPTION MATCH (Lowest priority)
      if (description.includes(term)) {
        score += 10;
        matchType = matchType === 'none' ? 'description_match' : matchType;
      }

      // 12. BOOST POPULAR CONTENT
      const popularityBoost = Math.min((video.views || 0) / 1000, 50); // Max 50 points for popularity
      score += popularityBoost;

      // 13. RECENCY BOOST (newer content gets slight boost)
      if (video.createdAt) {
        const videoDate = video.createdAt.toDate ? video.createdAt.toDate() : new Date(0);
        const daysOld = (new Date() - videoDate) / (1000 * 60 * 60 * 24);
        const recencyBoost = Math.max(0, 30 - daysOld); // Max 30 points for recency
        score += recencyBoost;
      }

      return { video, score, matchType };
    });

    // Filter out null videos and videos with score 0
    let filteredScoredVideos = scoredVideos.filter(item => 
      item.video && item.score > 0
    );

    // Apply additional filters if provided
    if (Object.keys(filters).length > 0) {
      filteredScoredVideos = filteredScoredVideos.filter(item => 
        applySingleVideoFilters(item.video, filters)
      );
    }

    // Sort by score (highest first), then by views
    filteredScoredVideos.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return (b.video.views || 0) - (a.video.views || 0);
    });

    const filteredVideos = filteredScoredVideos.map(item => item.video);

    console.log(`🔍 IMDb Search: Found ${filteredVideos.length} movies for "${searchTerm}"`);
    
    // Detailed search analytics
    if (filteredVideos.length > 0) {
      console.log('🎯 Search Results Breakdown:');
      filteredScoredVideos.forEach((item, index) => {
        const title = item.video.title || 'No Title';
        console.log(`${index + 1}. "${title}" - Score: ${item.score} - Match: ${item.matchType}`);
      });
    }

    return { 
      success: true, 
      videos: filteredVideos,
      searchMetrics: {
        totalMatches: filteredVideos.length,
        searchTerm: term,
        topMatchType: filteredScoredVideos[0]?.matchType || 'none'
      }
    };
  } catch (error) {
    console.error('❌ Error in IMDb search:', error);
    return { success: true, videos: [] };
  }
};

// Filter helper functions
const applyFilters = (videos, filters) => {
  if (Object.keys(filters).length === 0) return videos;
  
  return videos.filter(video => applySingleVideoFilters(video, filters));
};

const applySingleVideoFilters = (video, filters) => {
  if (!video) return false;

  if (filters.genre && video.genre !== filters.genre) {
    return false;
  }

  if (filters.year && video.year !== filters.year) {
    return false;
  }

  if (filters.rating && parseFloat(video.rating) < parseFloat(filters.rating)) {
    return false;
  }

  return true;
};

// 🎯 NEW: Advanced Search with Filters
export const advancedSearch = async (searchOptions = {}) => {
  const {
    query = '',
    genre = '',
    year = '',
    rating = '',
    actor = '',
    director = '',
    sortBy = 'relevance', // relevance, views, newest, oldest
    limit = 50
  } = searchOptions;

  try {
    const allVideosResult = await getVideos();
    let videos = Array.isArray(allVideosResult.videos) ? allVideosResult.videos : [];

    // Apply text search if query provided
    if (query.trim().length >= 2) {
      const searchResult = await searchVideos(query, { genre, year, rating });
      videos = searchResult.videos;
    } else {
      // Apply filters only
      videos = applyFilters(videos, { genre, year, rating });
    }

    // Additional actor/director filtering
    if (actor) {
      videos = videos.filter(video => 
        (video.actors || '').toLowerCase().includes(actor.toLowerCase())
      );
    }

    if (director) {
      videos = videos.filter(video => 
        (video.director || '').toLowerCase().includes(director.toLowerCase())
      );
    }

    // Sorting
    switch (sortBy) {
      case 'views':
        videos.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'newest':
        videos.sort((a, b) => {
          const aDate = a.createdAt?.toDate?.() || new Date(0);
          const bDate = b.createdAt?.toDate?.() || new Date(0);
          return bDate - aDate;
        });
        break;
      case 'oldest':
        videos.sort((a, b) => {
          const aDate = a.createdAt?.toDate?.() || new Date(0);
          const bDate = b.createdAt?.toDate?.() || new Date(0);
          return aDate - bDate;
        });
        break;
      case 'rating':
        videos.sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0));
        break;
      // 'relevance' is already handled by searchVideos scoring
    }

    // Apply limit
    if (limit) {
      videos = videos.slice(0, limit);
    }

    return { success: true, videos };
  } catch (error) {
    console.error('❌ Error in advanced search:', error);
    return { success: false, error: error.message };
  }
};

// 🎯 NEW: Auto-suggestions for search
export const getSearchSuggestions = async (searchTerm, limit = 10) => {
  try {
    if (!searchTerm || searchTerm.length < 2) {
      return { success: true, suggestions: [] };
    }

    const allVideosResult = await getVideos();
    const videos = Array.isArray(allVideosResult.videos) ? allVideosResult.videos : [];
    const term = searchTerm.toLowerCase().trim();

    const suggestions = new Set();

    videos.forEach(video => {
      if (!video || !video.title) return;

      const title = video.title.toLowerCase();
      
      if (title.includes(term)) {
        suggestions.add(video.title);
      }

      // Add actor suggestions
      if (video.actors) {
        video.actors.split(',').forEach(actor => {
          const cleanActor = actor.trim().toLowerCase();
          if (cleanActor.includes(term)) {
            suggestions.add(actor.trim());
          }
        });
      }

      // Add director suggestions
      if (video.director && video.director.toLowerCase().includes(term)) {
        suggestions.add(video.director);
      }
    });

    const suggestionsArray = Array.from(suggestions).slice(0, limit);

    return { success: true, suggestions: suggestionsArray };
  } catch (error) {
    console.error('❌ Error getting search suggestions:', error);
    return { success: true, suggestions: [] };
  }
};

// ✅ UPDATED: Get unlimited related videos with RANDOM GENRES (Mixed)
export const getRelatedVideos = async (genre, excludeId, limitCount = null) => {
  try {
    const allVideosResult = await getVideos();
    const videos = Array.isArray(allVideosResult.videos) ? allVideosResult.videos : [];
    
    const allRelatedVideos = videos.filter(video => {
      if (!video || !video.id) return false;
      return video.id !== excludeId && video.isActive !== false;
    });
    
    const shuffledVideos = [...allRelatedVideos].sort(() => Math.random() - 0.5);
    const finalVideos = limitCount ? shuffledVideos.slice(0, limitCount) : shuffledVideos;
    
    console.log(`✅ Found ${finalVideos.length} related videos (random genres mixed)`);
    return { success: true, videos: finalVideos };
  } catch (error) {
    console.error('❌ Error getting related videos:', error);
    return { success: true, videos: [] };
  }
};

// Ad Management (unchanged)
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
    const result = await getVideos();
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
    const result = await getVideos();
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
    const result = await getVideos();
    if (result.success) {
      const sortedByViews = [...result.videos].sort((a, b) => {
        return (b.views || 0) - (a.views || 0);
      });

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
