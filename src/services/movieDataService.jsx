// Movie Data Fetcher Service - HORIZONTAL 16:9 IMAGES
const TMDB_API_KEY = '3aad529c86f3fd8fb8ac9fb059421be5'; // Your TMDB API key
const OMDB_API_KEY = '53cca1db'; // Your OMDB API key

export const fetchMovieData = async (identifier) => {
  try {
    console.log('Fetching movie data for:', identifier);
    
    if (!identifier || identifier.trim() === '') {
      return {
        success: false,
        error: 'Please enter a movie title, IMDb ID, or TMDB ID',
        data: null
      };
    }
    
    // Clean the identifier
    identifier = identifier.trim();
    
    // Check if it's an IMDb ID (starts with tt)
    if (identifier.startsWith('tt')) {
      return await fetchMovieByIMDb(identifier);
    }
    
    // Check if it's a TMDB ID (numeric)
    if (/^\d+$/.test(identifier)) {
      return await fetchMovieByTMDB(identifier);
    }
    
    // Otherwise treat it as a movie title
    return await fetchMovieByTitle(identifier);
    
  } catch (error) {
    console.error('Error fetching movie data:', error);
    return { 
      success: false, 
      error: error.message,
      data: null
    };
  }
};

// Fetch movie by IMDb ID - FOCUS ON HORIZONTAL IMAGES
const fetchMovieByIMDb = async (imdbId) => {
  try {
    // First try OMDB API with your key
    const omdbResponse = await fetch(
      `https://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_API_KEY}&plot=full`
    );
    
    if (!omdbResponse.ok) {
      throw new Error(`OMDB API error: ${omdbResponse.status}`);
    }
    
    const omdbData = await omdbResponse.json();
    
    if (omdbData.Response === 'True') {
      console.log('Found movie via OMDB:', omdbData.Title);
      
      // Get TMDB ID first, then fetch HORIZONTAL 16:9 images
      const tmdbId = await getTMDBIdFromIMDb(imdbId);
      let horizontalImages = { horizontal16x9: '', backdrop: '' };
      
      if (tmdbId) {
        horizontalImages = await fetchHorizontalImagesByID(tmdbId);
      }
      
      // If no horizontal images, try search as fallback
      if (!horizontalImages.horizontal16x9) {
        horizontalImages = await fetchHorizontalImagesBySearch(omdbData.Title, omdbData.Year);
      }
      
      return {
        success: true,
        data: formatOMDBData(omdbData, horizontalImages),
        source: 'omdb'
      };
    } else {
      throw new Error(omdbData.Error || 'Movie not found on OMDB');
    }
    
  } catch (error) {
    console.error('Error in fetchMovieByIMDb:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

// Fetch movie by TMDB ID - FOCUS ON HORIZONTAL IMAGES
const fetchMovieByTMDB = async (tmdbId) => {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`
    );
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Movie not found on TMDB');
      }
      throw new Error(`TMDB API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.id) {
      // Get HORIZONTAL 16:9 images
      const horizontalImages = await fetchHorizontalImagesByID(tmdbId);
      
      return {
        success: true,
        data: formatTMDBData(data, horizontalImages),
        source: 'tmdb'
      };
    }
    
    throw new Error('Movie not found on TMDB');
  } catch (error) {
    console.error('Error in fetchMovieByTMDB:', error);
    // Fallback to OMDB search
    return await searchMovieByTitle(tmdbId);
  }
};

// Search movie by title
const fetchMovieByTitle = async (title) => {
  return await searchMovieByTitle(title);
};

// Search movie by title across multiple APIs - FOCUS ON HORIZONTAL IMAGES
const searchMovieByTitle = async (title) => {
  try {
    // First try OMDB with your API key
    const omdbResponse = await fetch(
      `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${OMDB_API_KEY}&plot=full`
    );
    
    if (!omdbResponse.ok) {
      throw new Error(`OMDB API error: ${omdbResponse.status}`);
    }
    
    const omdbData = await omdbResponse.json();
    
    if (omdbData.Response === 'True') {
      console.log('Found movie via OMDB title search:', omdbData.Title);
      
      // Get HORIZONTAL 16:9 images using multiple methods
      let horizontalImages = await fetchHorizontalImagesBySearch(omdbData.Title, omdbData.Year);
      
      // If search fails, try to get TMDB ID from IMDb ID
      if (!horizontalImages.horizontal16x9 && omdbData.imdbID) {
        const tmdbId = await getTMDBIdFromIMDb(omdbData.imdbID);
        if (tmdbId) {
          horizontalImages = await fetchHorizontalImagesByID(tmdbId);
        }
      }
      
      return {
        success: true,
        data: formatOMDBData(omdbData, horizontalImages),
        source: 'omdb'
      };
    }
    
    // Fallback to TMDB search
    console.log('Trying TMDB fallback for title:', title);
    const tmdbResponse = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=en-US&page=1&include_adult=false`
    );
    
    if (!tmdbResponse.ok) {
      throw new Error(`TMDB search error: ${tmdbResponse.status}`);
    }
    
    const tmdbData = await tmdbResponse.json();
    
    if (tmdbData.results && tmdbData.results.length > 0) {
      const movie = tmdbData.results[0];
      console.log('Found movie via TMDB:', movie.title);
      
      // Get HORIZONTAL 16:9 images for the found movie
      const horizontalImages = await fetchHorizontalImagesByID(movie.id);
      
      const formattedData = formatTMDBData(movie, horizontalImages);
      return {
        success: true,
        data: formattedData,
        source: 'tmdb'
      };
    }
    
    throw new Error(`Movie "${title}" not found on any database`);
    
  } catch (error) {
    console.error('Error in searchMovieByTitle:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

// Get TMDB ID from IMDb ID
const getTMDBIdFromIMDb = async (imdbId) => {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/find/${imdbId}?api_key=${TMDB_API_KEY}&language=en-US&external_source=imdb_id`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data.movie_results && data.movie_results.length > 0) {
      return data.movie_results[0].id;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting TMDB ID from IMDb:', error);
    return null;
  }
};

// NEW: Fetch HORIZONTAL 16:9 images by movie ID
const fetchHorizontalImagesByID = async (tmdbId) => {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}/images?api_key=${TMDB_API_KEY}`
    );
    
    if (!response.ok) {
      return { horizontal16x9: '', backdrop: '' };
    }
    
    const data = await response.json();
    
    let horizontal16x9 = '';
    let backdrop = '';
    
    // PRIORITIZE HORIZONTAL BACKDROPS (16:9 aspect ratio)
    if (data.backdrops && data.backdrops.length > 0) {
      // Sort by quality (width * height) and prefer 16:9 aspect ratio
      const sortedBackdrops = data.backdrops.sort((a, b) => {
        // Calculate aspect ratios
        const aspectA = a.width / a.height;
        const aspectB = b.width / b.height;
        
        // Prefer images closer to 16:9 (1.777)
        const targetAspect = 16/9; // 1.777...
        const aspectDiffA = Math.abs(aspectA - targetAspect);
        const aspectDiffB = Math.abs(aspectB - targetAspect);
        
        // If similar aspect ratio, prefer higher resolution
        if (Math.abs(aspectDiffA - aspectDiffB) < 0.1) {
          return (b.width * b.height) - (a.width * a.height);
        }
        
        // Otherwise prefer closer to 16:9
        return aspectDiffA - aspectDiffB;
      });
      
      if (sortedBackdrops[0] && sortedBackdrops[0].file_path) {
        // Use w1280 for high quality 16:9 backdrop (1280x720)
        horizontal16x9 = `https://image.tmdb.org/t/p/w1280${sortedBackdrops[0].file_path}`;
        backdrop = horizontal16x9; // Same image for both fields
      }
    }
    
    // If no good backdrops found, try to find horizontal posters
    if (!horizontal16x9 && data.posters && data.posters.length > 0) {
      // Look for horizontal posters (aspect ratio > 1.2)
      const horizontalPosters = data.posters.filter(poster => {
        const aspectRatio = poster.width / poster.height;
        return aspectRatio > 1.2; // Horizontal-ish
      });
      
      if (horizontalPosters.length > 0) {
        const bestHorizontal = horizontalPosters.sort((a, b) => (b.width * b.height) - (a.width * a.height))[0];
        horizontal16x9 = `https://image.tmdb.org/t/p/w780${bestHorizontal.file_path}`;
      }
    }
    
    return { horizontal16x9, backdrop: horizontal16x9 || backdrop, tmdbId };
  } catch (error) {
    console.error('Error fetching horizontal images by ID:', error);
    return { horizontal16x9: '', backdrop: '' };
  }
};

// NEW: Fetch HORIZONTAL 16:9 images by search
const fetchHorizontalImagesBySearch = async (title, year) => {
  try {
    const searchResponse = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=en-US&page=1${year ? `&year=${year}` : ''}`
    );
    
    if (!searchResponse.ok) {
      return { horizontal16x9: '', backdrop: '' };
    }
    
    const searchData = await searchResponse.json();
    
    if (searchData.results && searchData.results.length > 0) {
      const movie = searchData.results[0];
      let horizontal16x9 = '';
      
      // Get backdrop if available (usually horizontal 16:9)
      if (movie.backdrop_path) {
        horizontal16x9 = `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`;
      }
      
      return { 
        horizontal16x9, 
        backdrop: horizontal16x9,
        tmdbId: movie.id 
      };
    }
    
    return { horizontal16x9: '', backdrop: '' };
  } catch (error) {
    console.error('Error fetching horizontal images by search:', error);
    return { horizontal16x9: '', backdrop: '' };
  }
};

// Format OMDB data to our schema - FOCUS ON HORIZONTAL IMAGES
const formatOMDBData = (data, horizontalImages = {}) => {
  // Extract year from "2020–2021" or "2020" format
  let year = data.Year || '';
  if (year.includes('–')) {
    year = year.split('–')[0];
  }
  year = year.replace(/[^0-9]/g, ''); // Remove non-numeric characters
  
  // Extract duration from "136 min" format
  let duration = 120;
  if (data.Runtime && data.Runtime !== 'N/A') {
    const runtimeMatch = data.Runtime.match(/(\d+)/);
    duration = runtimeMatch ? parseInt(runtimeMatch[1]) : 120;
  }
  
  // Extract rating
  let rating = 'N/A';
  if (data.imdbRating && data.imdbRating !== 'N/A') {
    rating = parseFloat(data.imdbRating).toFixed(1);
  }
  
  // Use HORIZONTAL 16:9 image as primary
  const horizontal16x9 = horizontalImages.horizontal16x9 || '';
  const originalPoster = data.Poster !== 'N/A' ? data.Poster : '';
  
  // Create title with year
  const titleWithYear = year ? `${data.Title} (${year})` : data.Title;
  const displayTitle = year ? `${data.Title} ${year}` : data.Title;
  
  return {
    // Title with year included
    title: data.Title || '',
    titleWithYear: titleWithYear,
    displayTitle: displayTitle,
    originalTitle: data.Title || '',
    
    // Basic info
    description: data.Plot || '',
    genre: data.Genre?.split(', ')[0] || 'Unknown',
    allGenres: data.Genre?.split(', ') || ['Unknown'],
    duration: duration,
    year: year,
    rating: rating,
    
    // IMAGES - HORIZONTAL 16:9 FOCUS
    thumbnail: horizontal16x9 || originalPoster, // Use horizontal as thumbnail
    poster: horizontal16x9 || originalPoster, // Use horizontal as poster
    horizontal16x9: horizontal16x9, // Specific horizontal image
    backdrop: horizontalImages.backdrop || horizontal16x9, // Same as horizontal
    originalPoster: originalPoster,
    hasHorizontalImage: !!horizontal16x9,
    imageType: horizontal16x9 ? 'Horizontal 16:9' : (originalPoster ? 'Vertical Poster' : 'No Image'),
    aspectRatio: horizontal16x9 ? '16:9' : (originalPoster ? '2:3' : 'Unknown'),
    
    // Additional details
    actors: data.Actors?.split(', ') || [],
    director: data.Director?.split(', ') || [],
    releaseDate: data.Released || '',
    country: data.Country?.split(', ') || [],
    language: data.Language?.split(', ') || [],
    production: data.Production || '',
    imdbID: data.imdbID || '',
    type: data.Type || 'movie',
    rated: data.Rated || '',
    awards: data.Awards || '',
    
    // Quality options
    qualities: ['480p', '720p', '1080p'],
    
    // Additional fields for your post
    downloadLink: '',
    embedCode: '',
    
    // Metadata
    source: 'omdb',
    fetchedAt: new Date().toISOString()
  };
};

// Format TMDB data to our schema - FOCUS ON HORIZONTAL IMAGES
const formatTMDBData = (data, horizontalImages = {}) => {
  const year = data.release_date ? new Date(data.release_date).getFullYear().toString() : '';
  
  // Use horizontal images as primary
  const horizontal16x9 = horizontalImages.horizontal16x9 || 
                        (data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : '');
  
  const titleWithYear = year ? `${data.title} (${year})` : data.title;
  const displayTitle = year ? `${data.title} ${year}` : data.title;
  
  return {
    // Title with year
    title: data.title || '',
    titleWithYear: titleWithYear,
    displayTitle: displayTitle,
    originalTitle: data.original_title || '',
    
    // Basic info
    description: data.overview || '',
    genre: data.genres?.[0]?.name || 'Unknown',
    allGenres: data.genres?.map(g => g.name) || ['Unknown'],
    duration: data.runtime || 120,
    year: year,
    rating: data.vote_average ? data.vote_average.toFixed(1) : 'N/A',
    
    // IMAGES - HORIZONTAL 16:9 FOCUS
    thumbnail: horizontal16x9,
    poster: horizontal16x9,
    horizontal16x9: horizontal16x9,
    backdrop: horizontal16x9,
    originalPoster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : '',
    hasHorizontalImage: !!horizontal16x9,
    imageType: horizontal16x9 ? 'Horizontal 16:9' : 'No Image',
    aspectRatio: horizontal16x9 ? '16:9' : 'Unknown',
    
    // Additional details
    releaseDate: data.release_date || '',
    country: data.production_countries?.map(c => c.name) || [],
    language: data.original_language || '',
    production: data.production_companies?.[0]?.name || '',
    budget: data.budget || 0,
    revenue: data.revenue || 0,
    tagline: data.tagline || '',
    status: data.status || '',
    imdbID: data.imdb_id || '',
    
    // Quality options
    qualities: ['480p', '720p', '1080p'],
    
    // Additional fields for your post
    downloadLink: '',
    embedCode: '',
    
    // Metadata
    source: 'tmdb',
    fetchedAt: new Date().toISOString()
  };
};

// Function to test image URLs
const testImageUrl = async (url) => {
  try {
    if (!url) return { works: false, error: 'No URL provided' };
    
    const response = await fetch(url, { method: 'HEAD' });
    if (response.ok) {
      return { works: true, contentType: response.headers.get('content-type') };
    } else {
      return { works: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    return { works: false, error: error.message };
  }
};

// DISPLAY FUNCTION FOR HORIZONTAL IMAGES
export const displayMovieData = async (movieData) => {
  if (!movieData || !movieData.success) {
    return `
    <div style="padding: 20px; background: #fee; border: 1px solid #fcc; border-radius: 5px; color: #c00;">
      <strong>Error:</strong> ${movieData?.error || 'Failed to fetch movie data'}
    </div>
    `;
  }
  
  const data = movieData.data;
  
  // Test the HORIZONTAL image URL
  const horizontalImageUrl = data.horizontal16x9;
  const imageTest = horizontalImageUrl ? await testImageUrl(horizontalImageUrl) : { works: false, error: 'No horizontal image URL' };
  
  let imageHtml = '';
  if (imageTest.works) {
    imageHtml = `
    <div style="flex: 0 0 400px;">
      <img src="${horizontalImageUrl}" alt="${data.title}" 
           style="width: 100%; height: 225px; object-fit: cover; border-radius: 8px; border: 3px solid #2196F3;"
           onerror="this.onerror=null; this.src='https://via.placeholder.com/400x225/2196F3/white?text=16:9+Horizontal+Image';">
      <div style="text-align: center; margin-top: 8px;">
        <span style="color: #2196F3; font-size: 12px; font-weight: bold;">✅ HORIZONTAL 16:9 IMAGE</span>
      </div>
      <div style="text-align: center; font-size: 10px; color: #666; word-break: break-all; margin-top: 3px;">
        Aspect Ratio: ${data.aspectRatio} | ${horizontalImageUrl.substring(0, 50)}...
      </div>
    </div>
    `;
  } else {
    // Fallback to original poster (vertical)
    const fallbackTest = data.originalPoster ? await testImageUrl(data.originalPoster) : { works: false };
    
    if (fallbackTest.works) {
      imageHtml = `
      <div style="flex: 0 0 200px;">
        <img src="${data.originalPoster}" alt="${data.title}" 
             style="width: 100%; max-height: 300px; object-fit: contain; border-radius: 5px; border: 2px solid #ff9800;">
        <div style="text-align: center; margin-top: 8px;">
          <span style="color: #ff9800; font-size: 12px;">⚠️ VERTICAL POSTER (Fallback)</span>
        </div>
        <div style="text-align: center; font-size: 10px; color: #666;">
          Aspect Ratio: 2:3
        </div>
      </div>
      `;
    } else {
      imageHtml = `
      <div style="flex: 0 0 400px; text-align: center; padding: 40px; background: #f5f5f5; border-radius: 8px; border: 2px dashed #ccc;">
        <div style="font-size: 48px; color: #ccc;">🏞️</div>
        <div style="color: #666; margin-top: 10px; font-weight: bold;">No Horizontal Image Available</div>
        <div style="font-size: 11px; color: #999; margin-top: 5px;">${imageTest.error}</div>
        <div style="font-size: 10px; color: #666; margin-top: 10px; background: #e0e0e0; padding: 5px; border-radius: 3px;">
          Looking for 16:9 horizontal backdrops...
        </div>
      </div>
      `;
    }
  }
  
  return `
  <div style="border: 2px solid #2196F3; border-radius: 10px; padding: 20px; background: white; margin: 20px 0;">
    <div style="background: #2196F3; color: white; padding: 10px; border-radius: 5px; margin: -20px -20px 20px -20px;">
      <h3 style="margin: 0;">✅ Movie Data Fetched Successfully</h3>
      <small>TMDB API: ✅ Active | Image Type: ${data.imageType} | Aspect Ratio: ${data.aspectRatio}</small>
    </div>
    
    <div style="display: flex; gap: 20px; margin-bottom: 20px; align-items: flex-start;">
      ${imageHtml}
      
      <div style="flex: 1;">
        <h2 style="color: #333; margin-top: 0;">${data.titleWithYear}</h2>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin: 15px 0;">
          <div style="background: #e3f2fd; padding: 8px; border-radius: 4px; border-left: 3px solid #2196F3;">
            <strong>Rating:</strong> ${data.rating}/10
          </div>
          <div style="background: #e3f2fd; padding: 8px; border-radius: 4px; border-left: 3px solid #2196F3;">
            <strong>Duration:</strong> ${data.duration} min
          </div>
          <div style="background: #e3f2fd; padding: 8px; border-radius: 4px; border-left: 3px solid #2196F3;">
            <strong>Genre:</strong> ${data.genre}
          </div>
          <div style="background: #e3f2fd; padding: 8px; border-radius: 4px; border-left: 3px solid #2196F3;">
            <strong>Year:</strong> ${data.year}
          </div>
        </div>
        
        <div style="background: #f3f8ff; padding: 15px; border-radius: 5px; border-left: 4px solid #2196F3;">
          <strong>Description:</strong><br>
          ${data.description || 'No description available.'}
        </div>
      </div>
    </div>
    
    <div style="background: #e3f2fd; padding: 15px; border-radius: 5px;">
      <h4 style="margin-top: 0; color: #1565C0;">Add Download & Embed Information</h4>
      
      <div style="display: grid; gap: 10px;">
        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">Download Link:</label>
          <input type="url" placeholder="https://example.com/download-movie" 
                 style="width: 100%; padding: 8px; border: 1px solid #90CAF9; border-radius: 4px;">
        </div>
        
        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">Embed Code:</label>
          <textarea placeholder="Paste embed code here..." 
                    style="width: 100%; height: 80px; padding: 8px; border: 1px solid #90CAF9; border-radius: 4px;"></textarea>
        </div>
      </div>
    </div>
  </div>
  `;
};

// Debug function for horizontal images
export const debugHorizontalImages = async (identifier) => {
  console.log('🔍 Debugging HORIZONTAL images for:', identifier);
  
  const result = await fetchMovieData(identifier);
  
  if (result.success) {
    console.log('🎬 Movie:', result.data.titleWithYear);
    console.log('📊 Image Type:', result.data.imageType);
    console.log('📐 Aspect Ratio:', result.data.aspectRatio);
    console.log('🖼️ Has Horizontal Image:', result.data.hasHorizontalImage);
    
    // Test image URLs
    const imagesToTest = [
      { name: 'HORIZONTAL 16:9', url: result.data.horizontal16x9 },
      { name: 'Original Poster', url: result.data.originalPoster }
    ];
    
    for (const img of imagesToTest) {
      if (img.url) {
        const test = await testImageUrl(img.url);
        console.log(`🏞️ ${img.name}:`, test.works ? '✅ WORKS' : '❌ FAILED');
        console.log(`   URL: ${img.url}`);
        if (!test.works) console.log(`   Error: ${test.error}`);
      } else {
        console.log(`🏞️ ${img.name}: ❌ NO URL`);
      }
    }
  } else {
    console.log('❌ Error:', result.error);
  }
  
  return result;
};

// Test movies that should have good horizontal images
export const testHorizontalImageMovies = async () => {
  const movies = [
    'Avengers: Endgame', // Big movie with many backdrops
    'The Dark Knight',
    'Inception',
    'Dune',
    'Interstellar'
  ];
  
  console.log('🎯 Testing HORIZONTAL 16:9 images for popular movies:\n');
  
  for (const movie of movies) {
    console.log(`\n--- Testing: ${movie} ---`);
    await debugHorizontalImages(movie);
  }
};

// Quick setup for admin panel
export const setupMovieFetcher = async (inputId, displayId) => {
  const inputElement = document.getElementById(inputId);
  const displayElement = document.getElementById(displayId);
  
  if (inputElement && displayElement) {
    inputElement.addEventListener('change', async (e) => {
      const identifier = e.target.value.trim();
      if (!identifier) return;
      
      displayElement.innerHTML = '<div style="padding: 20px; text-align: center; color: #2196F3;">🔄 Fetching movie data with HORIZONTAL images...</div>';
      
      const result = await fetchMovieData(identifier);
      const html = await displayMovieData(result);
      displayElement.innerHTML = html;
    });
  }
};
