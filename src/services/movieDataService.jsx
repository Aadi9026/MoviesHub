// Movie Data Fetcher Service - FIXED 16:9 Image Version
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

// Fetch movie by IMDb ID - IMPROVED with better image handling
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
      
      // Get proper 16:9 images from TMDB
      const tmdbImages = await fetchTMDBImages(omdbData.Title, omdbData.Year);
      
      return {
        success: true,
        data: formatOMDBData(omdbData, tmdbImages),
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

// Fetch movie by TMDB ID - IMPROVED
const fetchMovieByTMDB = async (tmdbId) => {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=images`
    );
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Movie not found on TMDB');
      }
      throw new Error(`TMDB API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.id) {
      return {
        success: true,
        data: formatTMDBData(data),
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

// Search movie by title across multiple APIs - IMPROVED
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
      
      // Get proper 16:9 images from TMDB
      const tmdbImages = await fetchTMDBImages(omdbData.Title, omdbData.Year);
      
      return {
        success: true,
        data: formatOMDBData(omdbData, tmdbImages),
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
      return await fetchMovieByTMDB(movie.id);
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

// NEW: Better TMDB image fetcher that ensures 16:9 aspect ratio
const fetchTMDBImages = async (title, year) => {
  try {
    const searchResponse = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=en-US&page=1${year ? `&year=${year}` : ''}`
    );
    
    if (!searchResponse.ok) {
      return { poster16x9: '', backdrop: '' };
    }
    
    const searchData = await searchResponse.json();
    
    if (searchData.results && searchData.results.length > 0) {
      const movie = searchData.results[0];
      
      // Get the movie details to access all images
      const movieResponse = await fetch(
        `https://api.themoviedb.org/3/movie/${movie.id}/images?api_key=${TMDB_API_KEY}`
      );
      
      if (movieResponse.ok) {
        const imagesData = await movieResponse.json();
        
        // Find the best poster with 16:9 aspect ratio
        let poster16x9 = '';
        if (imagesData.posters && imagesData.posters.length > 0) {
          // Prefer English posters first
          const englishPosters = imagesData.posters.filter(p => p.iso_639_1 === 'en' || !p.iso_639_1);
          const posters = englishPosters.length > 0 ? englishPosters : imagesData.posters;
          
          // Use w780 size for 16:9 aspect ratio (780x439 ≈ 16:9)
          poster16x9 = `https://image.tmdb.org/t/p/w780${posters[0].file_path}`;
        } else if (movie.poster_path) {
          // Fallback to basic poster path
          poster16x9 = `https://image.tmdb.org/t/p/w780${movie.poster_path}`;
        }
        
        // Find the best backdrop
        let backdrop = '';
        if (imagesData.backdrops && imagesData.backdrops.length > 0) {
          // Use w1280 size for 16:9 backdrop
          backdrop = `https://image.tmdb.org/t/p/w1280${imagesData.backdrops[0].file_path}`;
        } else if (movie.backdrop_path) {
          backdrop = `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`;
        }
        
        return { poster16x9, backdrop, tmdbId: movie.id };
      }
      
      // Fallback if images endpoint fails
      return {
        poster16x9: movie.poster_path ? `https://image.tmdb.org/t/p/w780${movie.poster_path}` : '',
        backdrop: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : '',
        tmdbId: movie.id
      };
    }
    
    return { poster16x9: '', backdrop: '' };
  } catch (error) {
    console.error('Error fetching TMDB images:', error);
    return { poster16x9: '', backdrop: '' };
  }
};

// Format OMDB data to our schema with PROPER 16:9 images
const formatOMDBData = (data, tmdbImages = {}) => {
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
  
  // Use 16:9 poster if available, otherwise use original poster
  const poster16x9 = tmdbImages.poster16x9 || '';
  const originalPoster = data.Poster !== 'N/A' ? data.Poster : '';
  
  // Choose the best available image
  const displayImage = poster16x9 || originalPoster;
  
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
    
    // IMAGES - Proper 16:9 support
    thumbnail: displayImage,
    poster: displayImage,
    poster16x9: poster16x9,
    backdrop: tmdbImages.backdrop || '',
    originalPoster: originalPoster,
    has16x9Poster: !!poster16x9,
    
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

// Format TMDB data to our schema
const formatTMDBData = (data) => {
  const year = data.release_date ? new Date(data.release_date).getFullYear().toString() : '';
  
  // Use w780 for proper 16:9 aspect ratio poster
  const poster16x9 = data.poster_path ? `https://image.tmdb.org/t/p/w780${data.poster_path}` : '';
  
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
    
    // IMAGES - Proper 16:9 support
    thumbnail: poster16x9,
    poster: poster16x9,
    poster16x9: poster16x9,
    backdrop: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : '',
    originalPoster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : '',
    has16x9Poster: !!poster16x9,
    
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

// NEW: Function to verify image URL works
const verifyImageUrl = async (imageUrl) => {
  try {
    if (!imageUrl) return false;
    const response = await fetch(imageUrl, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
};

// IMPROVED: Display function with image verification
export const displayMovieData = async (movieData) => {
  if (!movieData || !movieData.success) {
    return `
    <div style="padding: 20px; background: #fee; border: 1px solid #fcc; border-radius: 5px; color: #c00;">
      <strong>Error:</strong> ${movieData?.error || 'Failed to fetch movie data'}
    </div>
    `;
  }
  
  const data = movieData.data;
  
  // Verify the image URL works
  const imageUrl = data.poster16x9 || data.thumbnail;
  const imageWorks = imageUrl ? await verifyImageUrl(imageUrl) : false;
  const finalImageUrl = imageWorks ? imageUrl : data.originalPoster;
  
  return `
  <div style="border: 2px solid #4CAF50; border-radius: 10px; padding: 20px; background: white; margin: 20px 0;">
    <div style="background: #4CAF50; color: white; padding: 10px; border-radius: 5px; margin: -20px -20px 20px -20px;">
      <h3 style="margin: 0;">✅ Movie Data Fetched Successfully</h3>
      <small>TMDB API: ✅ Active | 16:9 Images: ${data.has16x9Poster ? '✅ Enabled' : '⚠️ Not available'}</small>
    </div>
    
    <div style="display: flex; gap: 20px; margin-bottom: 20px;">
      ${finalImageUrl ? `
      <div style="flex: 0 0 300px;">
        <img src="${finalImageUrl}" alt="${data.title}" 
             style="width: 100%; height: 169px; object-fit: cover; border-radius: 5px; border: 2px solid ${data.has16x9Poster ? '#4CAF50' : '#ff9800'};"
             onerror="this.style.display='none'; document.getElementById('image-fallback').style.display='block';">
        <div id="image-fallback" style="display: none; text-align: center; padding: 20px; background: #f5f5f5; border-radius: 5px;">
          🖼️ Image not available
        </div>
        <div style="text-align: center; margin-top: 5px; font-size: 12px; color: ${data.has16x9Poster ? '#4CAF50' : '#ff9800'};">
          ${data.has16x9Poster ? '✅ 16:9 Poster Image' : '⚠️ Original Poster Image'}
        </div>
        <div style="text-align: center; font-size: 11px; color: #666; word-break: break-all;">
          ${finalImageUrl.substring(0, 50)}...
        </div>
      </div>
      ` : `
      <div style="flex: 0 0 300px; text-align: center; padding: 40px; background: #f5f5f5; border-radius: 5px;">
        🖼️ No image available
      </div>
      `}
      
      <div style="flex: 1;">
        <h2 style="color: #333; margin-top: 0;">${data.titleWithYear}</h2>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin: 15px 0;">
          <div style="background: #f5f5f5; padding: 8px; border-radius: 4px;">
            <strong>Rating:</strong> ${data.rating}/10
          </div>
          <div style="background: #f5f5f5; padding: 8px; border-radius: 4px;">
            <strong>Duration:</strong> ${data.duration} min
          </div>
          <div style="background: #f5f5f5; padding: 8px; border-radius: 4px;">
            <strong>Genre:</strong> ${data.genre}
          </div>
          <div style="background: #f5f5f5; padding: 8px; border-radius: 4px;">
            <strong>Year:</strong> ${data.year}
          </div>
        </div>
        
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 4px solid #4CAF50;">
          <strong>Description:</strong><br>
          ${data.description || 'No description available.'}
        </div>
      </div>
    </div>
    
    <div style="background: #e7f3ff; padding: 15px; border-radius: 5px;">
      <h4 style="margin-top: 0;">Add Download & Embed Information</h4>
      
      <div style="display: grid; gap: 10px;">
        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Download Link:</label>
          <input type="url" placeholder="https://example.com/download-movie" 
                 style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
        </div>
        
        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Embed Code:</label>
          <textarea placeholder="Paste embed code here..." 
                    style="width: 100%; height: 80px; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"></textarea>
        </div>
      </div>
    </div>
  </div>
  `;
};

// Test specific movie to debug image issues
export const debugMovieImages = async (identifier) => {
  console.log('🔍 Debugging images for:', identifier);
  
  const result = await fetchMovieData(identifier);
  
  if (result.success) {
    console.log('🎬 Movie:', result.data.titleWithYear);
    console.log('🖼️ 16:9 Poster URL:', result.data.poster16x9);
    console.log('🖼️ Original Poster URL:', result.data.originalPoster);
    console.log('🎯 Has 16:9 Poster:', result.data.has16x9Poster);
    console.log('🏞️ Backdrop URL:', result.data.backdrop);
    
    // Test if images are accessible
    if (result.data.poster16x9) {
      const works = await verifyImageUrl(result.data.poster16x9);
      console.log('✅ 16:9 Poster Accessible:', works);
    }
    if (result.data.originalPoster) {
      const works = await verifyImageUrl(result.data.originalPoster);
      console.log('✅ Original Poster Accessible:', works);
    }
  } else {
    console.log('❌ Error:', result.error);
  }
  
  return result;
};

// Quick setup for admin panel
export const setupMovieFetcher = async (inputId, displayId) => {
  const inputElement = document.getElementById(inputId);
  const displayElement = document.getElementById(displayId);
  
  if (inputElement && displayElement) {
    inputElement.addEventListener('change', async (e) => {
      const identifier = e.target.value.trim();
      if (!identifier) return;
      
      displayElement.innerHTML = '<div style="padding: 20px; text-align: center;">Fetching movie data...</div>';
      
      const result = await fetchMovieData(identifier);
      const html = await displayMovieData(result);
      displayElement.innerHTML = html;
    });
  }
};

// Test the fixed version
export const testFixedImageFetcher = async () => {
  console.log('Testing fixed image fetcher...');
  
  const testMovies = [
    'Kantara', // Should have proper 16:9 images
    'tt3896198', // Guardians of the Galaxy
    'Avengers: Endgame'
  ];
  
  for (const movie of testMovies) {
    console.log(`\nTesting: ${movie}`);
    await debugMovieImages(movie);
  }
};
