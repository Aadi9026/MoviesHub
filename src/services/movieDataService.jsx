// Movie Data Fetcher Service - LANDSCAPE IMAGES ONLY
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

// Fetch movie by IMDb ID - LANDSCAPE IMAGES ONLY
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
      
      // Get TMDB ID first, then fetch LANDSCAPE images only
      const tmdbId = await getTMDBIdFromIMDb(imdbId);
      let landscapeImage = '';
      
      if (tmdbId) {
        landscapeImage = await fetchLandscapeImageByID(tmdbId);
      }
      
      // If no landscape image, try search as fallback
      if (!landscapeImage) {
        landscapeImage = await fetchLandscapeImageBySearch(omdbData.Title, omdbData.Year);
      }
      
      return {
        success: true,
        data: formatOMDBData(omdbData, landscapeImage),
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

// Fetch movie by TMDB ID - LANDSCAPE IMAGES ONLY
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
      // Get LANDSCAPE image only
      const landscapeImage = await fetchLandscapeImageByID(tmdbId);
      
      return {
        success: true,
        data: formatTMDBData(data, landscapeImage),
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

// Search movie by title across multiple APIs - LANDSCAPE IMAGES ONLY
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
      
      // Get LANDSCAPE image only
      let landscapeImage = await fetchLandscapeImageBySearch(omdbData.Title, omdbData.Year);
      
      // If search fails, try to get TMDB ID from IMDb ID
      if (!landscapeImage && omdbData.imdbID) {
        const tmdbId = await getTMDBIdFromIMDb(omdbData.imdbID);
        if (tmdbId) {
          landscapeImage = await fetchLandscapeImageByID(tmdbId);
        }
      }
      
      return {
        success: true,
        data: formatOMDBData(omdbData, landscapeImage),
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
      
      // Get LANDSCAPE image only for the found movie
      const landscapeImage = await fetchLandscapeImageByID(movie.id);
      
      const formattedData = formatTMDBData(movie, landscapeImage);
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

// NEW: Fetch LANDSCAPE image only by movie ID
const fetchLandscapeImageByID = async (tmdbId) => {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}/images?api_key=${TMDB_API_KEY}`
    );
    
    if (!response.ok) {
      return '';
    }
    
    const data = await response.json();
    
    // ONLY USE BACKDROPS (landscape images)
    if (data.backdrops && data.backdrops.length > 0) {
      // Sort by quality and aspect ratio closest to 16:9
      const sortedBackdrops = data.backdrops.sort((a, b) => {
        // Calculate aspect ratios
        const aspectA = a.width / a.height;
        const aspectB = b.width / b.height;
        
        // Target 16:9 aspect ratio (1.777...)
        const targetAspect = 16/9;
        const aspectDiffA = Math.abs(aspectA - targetAspect);
        const aspectDiffB = Math.abs(aspectB - targetAspect);
        
        // Prefer images closer to 16:9
        if (Math.abs(aspectDiffA - aspectDiffB) > 0.1) {
          return aspectDiffA - aspectDiffB;
        }
        
        // Then prefer higher resolution
        return (b.width * b.height) - (a.width * a.height);
      });
      
      // Take the best landscape backdrop
      const bestLandscape = sortedBackdrops[0];
      if (bestLandscape && bestLandscape.file_path) {
        // Use w1280 for high quality landscape (1280x720 = 16:9)
        return `https://image.tmdb.org/t/p/w1280${bestLandscape.file_path}`;
      }
    }
    
    // NO FALLBACK TO POSTERS - return empty if no landscape found
    return '';
    
  } catch (error) {
    console.error('Error fetching landscape image by ID:', error);
    return '';
  }
};

// NEW: Fetch LANDSCAPE image only by search
const fetchLandscapeImageBySearch = async (title, year) => {
  try {
    const searchResponse = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=en-US&page=1${year ? `&year=${year}` : ''}`
    );
    
    if (!searchResponse.ok) {
      return '';
    }
    
    const searchData = await searchResponse.json();
    
    if (searchData.results && searchData.results.length > 0) {
      const movie = searchData.results[0];
      
      // ONLY use backdrop_path (landscape), NEVER poster_path
      if (movie.backdrop_path) {
        return `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`;
      }
    }
    
    // NO FALLBACK TO POSTERS
    return '';
    
  } catch (error) {
    console.error('Error fetching landscape image by search:', error);
    return '';
  }
};

// Format OMDB data to our schema - LANDSCAPE IMAGES ONLY
const formatOMDBData = (data, landscapeImage = '') => {
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
    
    // IMAGES - LANDSCAPE ONLY, NO POSTERS
    thumbnail: landscapeImage, // Only landscape
    poster: landscapeImage, // Only landscape (same as thumbnail)
    landscapeImage: landscapeImage, // Specific landscape field
    backdrop: landscapeImage, // Same as landscape
    hasLandscapeImage: !!landscapeImage,
    imageType: landscapeImage ? 'Landscape 16:9' : 'No Landscape Available',
    aspectRatio: landscapeImage ? '16:9' : 'N/A',
    
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

// Format TMDB data to our schema - LANDSCAPE IMAGES ONLY
const formatTMDBData = (data, landscapeImage = '') => {
  const year = data.release_date ? new Date(data.release_date).getFullYear().toString() : '';
  
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
    
    // IMAGES - LANDSCAPE ONLY, NO POSTERS
    thumbnail: landscapeImage,
    poster: landscapeImage,
    landscapeImage: landscapeImage,
    backdrop: landscapeImage,
    hasLandscapeImage: !!landscapeImage,
    imageType: landscapeImage ? 'Landscape 16:9' : 'No Landscape Available',
    aspectRatio: landscapeImage ? '16:9' : 'N/A',
    
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

// DISPLAY FUNCTION FOR LANDSCAPE IMAGES ONLY
export const displayMovieData = async (movieData) => {
  if (!movieData || !movieData.success) {
    return `
    <div style="padding: 20px; background: #fee; border: 1px solid #fcc; border-radius: 5px; color: #c00;">
      <strong>Error:</strong> ${movieData?.error || 'Failed to fetch movie data'}
    </div>
    `;
  }
  
  const data = movieData.data;
  
  // Test the LANDSCAPE image URL
  const landscapeImageUrl = data.landscapeImage;
  const imageTest = landscapeImageUrl ? await testImageUrl(landscapeImageUrl) : { works: false, error: 'No landscape image available' };
  
  let imageHtml = '';
  if (imageTest.works) {
    imageHtml = `
    <div style="flex: 0 0 500px;">
      <img src="${landscapeImageUrl}" alt="${data.title}" 
           style="width: 100%; height: 281px; object-fit: cover; border-radius: 8px; border: 3px solid #4CAF50;"
           onerror="this.onerror=null; this.src='https://via.placeholder.com/500x281/4CAF50/white?text=Landscape+16:9+Image';">
      <div style="text-align: center; margin-top: 8px;">
        <span style="color: #4CAF50; font-size: 14px; font-weight: bold;">✅ LANDSCAPE 16:9 BACKDROP</span>
      </div>
      <div style="text-align: center; font-size: 11px; color: #666; word-break: break-all; margin-top: 3px; padding: 5px; background: #f0f8f0; border-radius: 3px;">
        <strong>Aspect Ratio:</strong> ${data.aspectRatio} | <strong>Type:</strong> ${data.imageType}
      </div>
      <div style="text-align: center; font-size: 10px; color: #888; margin-top: 3px;">
        ${landscapeImageUrl.substring(0, 60)}...
      </div>
    </div>
    `;
  } else {
    // NO FALLBACK TO POSTERS - show message instead
    imageHtml = `
    <div style="flex: 0 0 500px; text-align: center; padding: 50px 20px; background: linear-gradient(135deg, #f5f5f5, #e0e0e0); border-radius: 8px; border: 2px dashed #9E9E9E;">
      <div style="font-size: 64px; color: #9E9E9E;">🏞️</div>
      <div style="color: #757575; margin-top: 15px; font-weight: bold; font-size: 16px;">No Landscape Image Available</div>
      <div style="color: #9E9E9E; margin-top: 10px; font-size: 13px;">This movie doesn't have landscape backdrops in TMDB</div>
      <div style="background: #FFEB3B; color: #FF6F00; padding: 8px; border-radius: 4px; margin-top: 15px; font-size: 12px; border: 1px solid #FFC107;">
        <strong>Note:</strong> Only fetching landscape 16:9 backdrops - no poster images
      </div>
    </div>
    `;
  }
  
  return `
  <div style="border: 2px solid #4CAF50; border-radius: 10px; padding: 20px; background: white; margin: 20px 0;">
    <div style="background: #4CAF50; color: white; padding: 12px; border-radius: 5px; margin: -20px -20px 20px -20px;">
      <h3 style="margin: 0;">✅ Movie Data Fetched Successfully</h3>
      <small>TMDB API: ✅ Active | Image Policy: 🏞️ LANDSCAPE ONLY | Status: ${data.imageType}</small>
    </div>
    
    <div style="display: flex; gap: 25px; margin-bottom: 20px; align-items: flex-start;">
      ${imageHtml}
      
      <div style="flex: 1;">
        <h2 style="color: #333; margin-top: 0; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">${data.titleWithYear}</h2>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin: 20px 0;">
          <div style="background: #E8F5E8; padding: 10px; border-radius: 6px; border-left: 4px solid #4CAF50;">
            <strong>Rating:</strong><br>${data.rating}/10
          </div>
          <div style="background: #E8F5E8; padding: 10px; border-radius: 6px; border-left: 4px solid #4CAF50;">
            <strong>Duration:</strong><br>${data.duration} min
          </div>
          <div style="background: #E8F5E8; padding: 10px; border-radius: 6px; border-left: 4px solid #4CAF50;">
            <strong>Genre:</strong><br>${data.genre}
          </div>
          <div style="background: #E8F5E8; padding: 10px; border-radius: 6px; border-left: 4px solid #4CAF50;">
            <strong>Year:</strong><br>${data.year}
          </div>
        </div>
        
        <div style="background: #f8fff8; padding: 20px; border-radius: 6px; border-left: 4px solid #4CAF50; border: 1px solid #E8F5E8;">
          <strong style="color: #2E7D32;">Description:</strong><br>
          <div style="margin-top: 8px; line-height: 1.6; color: #555;">${data.description || 'No description available.'}</div>
        </div>
      </div>
    </div>
    
    <div style="background: #E8F5E8; padding: 20px; border-radius: 6px; border: 1px solid #C8E6C9;">
      <h4 style="margin-top: 0; color: #2E7D32;">Add Download & Embed Information</h4>
      
      <div style="display: grid; gap: 12px;">
        <div>
          <label style="display: block; margin-bottom: 6px; font-weight: bold; color: #333;">Download Link:</label>
          <input type="url" placeholder="https://example.com/download-movie" 
                 style="width: 100%; padding: 10px; border: 1px solid #81C784; border-radius: 4px; background: #fff;">
        </div>
        
        <div>
          <label style="display: block; margin-bottom: 6px; font-weight: bold; color: #333;">Embed Code:</label>
          <textarea placeholder="Paste embed code here..." 
                    style="width: 100%; height: 90px; padding: 10px; border: 1px solid #81C784; border-radius: 4px; background: #fff; resize: vertical;"></textarea>
        </div>
      </div>
    </div>
  </div>
  `;
};

// Debug function for landscape images only
export const debugLandscapeImages = async (identifier) => {
  console.log('🏞️ Debugging LANDSCAPE images only for:', identifier);
  
  const result = await fetchMovieData(identifier);
  
  if (result.success) {
    console.log('🎬 Movie:', result.data.titleWithYear);
    console.log('📊 Image Type:', result.data.imageType);
    console.log('📐 Aspect Ratio:', result.data.aspectRatio);
    console.log('✅ Has Landscape Image:', result.data.hasLandscapeImage);
    
    // Test only landscape URL
    if (result.data.landscapeImage) {
      const test = await testImageUrl(result.data.landscapeImage);
      console.log('🏞️ LANDSCAPE IMAGE:', test.works ? '✅ WORKS' : '❌ FAILED');
      console.log('   URL:', result.data.landscapeImage);
      if (!test.works) console.log('   Error:', test.error);
    } else {
      console.log('🏞️ LANDSCAPE IMAGE: ❌ NOT AVAILABLE');
      console.log('   Note: Only fetching landscape backdrops, no poster fallback');
    }
  } else {
    console.log('❌ Error:', result.error);
  }
  
  return result;
};

// Test movies for landscape images
export const testLandscapeImageMovies = async () => {
  const movies = [
    'Avengers: Endgame', // Should have landscape backdrops
    'The Dark Knight',
    'Dune',
    'Interstellar',
    'Blade Runner 2049'
  ];
  
  console.log('🎯 Testing LANDSCAPE-ONLY images for movies:\n');
  
  for (const movie of movies) {
    console.log(`\n--- Testing: ${movie} ---`);
    await debugLandscapeImages(movie);
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
      
      displayElement.innerHTML = `
        <div style="padding: 30px; text-align: center; color: #4CAF50; background: #f8fff8; border-radius: 8px; border: 2px dashed #4CAF50;">
          <div style="font-size: 48px; margin-bottom: 10px;">🏞️</div>
          <div style="font-size: 16px; font-weight: bold;">Fetching movie data with LANDSCAPE images only...</div>
          <div style="font-size: 12px; color: #666; margin-top: 5px;">No poster images will be used</div>
        </div>
      `;
      
      const result = await fetchMovieData(identifier);
      const html = await displayMovieData(result);
      displayElement.innerHTML = html;
    });
  }
};
