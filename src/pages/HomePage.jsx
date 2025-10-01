import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVideos } from '../hooks/useVideos';
import VideoList from '../components/User/VideoList';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import AdSlot from '../components/Common/AdSlot';
import SeoHead from '../components/SEO/SeoHead'; // ADD SEO IMPORT

const HomePage = () => {
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get('search');
  const { videos, loading, error, search, loadRandomVideos } = useVideos();
  const [displayVideos, setDisplayVideos] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [lastSearchTerm, setLastSearchTerm] = useState('');

  // Ensure videos is always an array
  const safeVideos = Array.isArray(videos) ? videos : [];

  // SEO Configuration - DYNAMIC BASED ON CONTENT
  const getSeoData = () => {
    if (searchTerm) {
      return {
        title: `Search Results for "${searchTerm}" - MoviesHub | Find & Watch Movies Online`,
        description: `Find and watch ${searchTerm} movies online free in HD quality. Browse ${safeVideos.length} ${searchTerm} movies with instant streaming.`,
        keywords: `${searchTerm} movies, watch ${searchTerm} movies online, ${searchTerm} films, ${searchTerm} cinema, stream ${searchTerm} movies, ${searchTerm} HD`,
        canonical: `/?search=${encodeURIComponent(searchTerm)}`,
        ogTitle: `Search: ${searchTerm} - MoviesHub`,
        ogDescription: `Discover ${safeVideos.length} ${searchTerm} movies available to stream now.`
      };
    }

    // Default SEO for home page
    return {
      title: "MoviesHub - Stream HD Movies Online Free | Latest Hollywood & Bollywood Movies",
      description: "Watch latest movies online free in HD quality. Stream Hollywood, Bollywood, Action, Romance, Comedy movies with English subtitles. No registration required.",
      keywords: "watch movies online, free movies, HD movies, Hollywood movies, Bollywood movies, stream movies, latest movies, action movies, romance movies, comedy movies, drama movies",
      canonical: "/",
      ogTitle: "MoviesHub - Stream HD Movies Online Free",
      ogDescription: "Watch latest movies online free in HD quality. Thousands of movies available for instant streaming."
    };
  };

  // Generate structured data for search results
  const generateSearchStructuredData = () => {
    if (!searchTerm) return null;

    return {
      "@context": "https://schema.org",
      "@type": "SearchResultsPage",
      "name": `Search Results for ${searchTerm}`,
      "description": `Search results for ${searchTerm} movies`,
      "url": `https://movieshub.vercel.app/?search=${encodeURIComponent(searchTerm)}`,
      "mainEntity": {
        "@type": "ItemList",
        "numberOfItems": safeVideos.length,
        "itemListElement": safeVideos.slice(0, 10).map((video, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "Movie",
            "name": video.title,
            "description": video.description,
            "genre": video.genre,
            "url": `https://movieshub.vercel.app/video/${video.id}`
          }
        }))
      }
    };
  };

  // Generate structured data for home page
  const generateHomeStructuredData = () => {
    if (searchTerm) return null;

    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Featured Movies Collection",
      "description": "Collection of featured movies available for streaming",
      "numberOfItems": Math.min(safeVideos.length, 20),
      "itemListElement": safeVideos.slice(0, 20).map((video, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Movie",
          "name": video.title,
          "description": video.description || `Watch ${video.title} online free`,
          "genre": video.genre,
          "url": `https://movieshub.vercel.app/video/${video.id}`
        }
      }))
    };
  };

  useEffect(() => {
    if (searchTerm && searchTerm !== lastSearchTerm) {
      setSearchLoading(true);
      setLastSearchTerm(searchTerm || '');
      search(searchTerm || '').finally(() => {
        setSearchLoading(false);
      });
    } else if (!searchTerm && lastSearchTerm) {
      setLastSearchTerm('');
      // Load random videos when returning from search
      loadRandomVideos();
    } else if (!searchTerm) {
      // Load random videos on first load or refresh
      if (safeVideos.length === 0) {
        loadRandomVideos();
      }
    }
  }, [searchTerm, search, lastSearchTerm, loadRandomVideos]);

  // Update display videos when videos change
  useEffect(() => {
    if (!searchTerm) {
      // For home page, shuffle the videos for random experience
      const shuffled = [...safeVideos].sort(() => Math.random() - 0.5);
      setDisplayVideos(shuffled);
    } else {
      setDisplayVideos(safeVideos);
    }
  }, [safeVideos, searchTerm]);

  // Auto-refresh home page with new random movies every time user comes back
  useEffect(() => {
    if (!searchTerm) {
      const interval = setInterval(() => {
        loadRandomVideos();
      }, 300000); // Refresh every 5 minutes

      return () => clearInterval(interval);
    }
  }, [searchTerm, loadRandomVideos]);

  if (loading && !searchLoading) {
    return (
      <>
        <SeoHead {...getSeoData()} />
        <LoadingSpinner text="Loading movies..." />
      </>
    );
  }

  if (error) {
    return (
      <>
        <SeoHead {...getSeoData()} />
        <div className="error-container">
          <div className="error-message">
            <i className="fas fa-exclamation-triangle"></i>
            <p>Error: {error}</p>
            <button onClick={loadRandomVideos} className="btn btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </>
    );
  }

  const safeDisplayVideos = Array.isArray(displayVideos) ? displayVideos : [];
  const seoData = getSeoData();
  const structuredData = searchTerm ? generateSearchStructuredData() : generateHomeStructuredData();

  return (
    <div className="home-page">
      {/* ADD COMPREHENSIVE SEO OPTIMIZATION */}
      <SeoHead {...seoData} />
      
      {/* ADD STRUCTURED DATA FOR RICH SNIPPETS */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}

      {/* ADD BREADCRUMB STRUCTURED DATA */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://movieshub.vercel.app/"
            },
            ...(searchTerm ? [{
              "@type": "ListItem",
              "position": 2,
              "name": `Search: ${searchTerm}`,
              "item": `https://movieshub.vercel.app/?search=${encodeURIComponent(searchTerm)}`
            }] : [])
          ]
        })}
      </script>

      <div className="container">
        <AdSlot position="header" />
        
        {/* ONLY SHOW HEADER FOR SEARCH RESULTS */}
        {searchTerm && (
          <div className="page-header">
            <h1 className="search-results-title">
              Search Results for "<span className="search-term">{searchTerm}</span>"
              {(searchLoading || loading) && (
                <i className="fas fa-spinner fa-spin loading-icon" aria-label="Loading"></i>
              )}
            </h1>
            
            <div className="search-results-info">
              <p className="results-count" itemScope itemType="https://schema.org/ItemList">
                Found <span itemProp="numberOfItems">{safeDisplayVideos.length}</span> {safeDisplayVideos.length === 1 ? 'movie' : 'movies'}
                {searchLoading && <span className="searching-text">...searching</span>}
              </p>
              {safeDisplayVideos.length === 0 && !searchLoading && (
                <p className="no-results-help">
                  Try different keywords or browse all movies
                </p>
              )}
            </div>
          </div>
        )}

        {/* ADD SCHEMA MARKUP FOR MOVIE LIST */}
        <div 
          itemScope 
          itemType={searchTerm ? "https://schema.org/SearchResultsPage" : "https://schema.org/ItemList"}
          className="movie-list-container"
        >
          <meta itemProp="name" content={seoData.title} />
          <meta itemProp="description" content={seoData.description} />
          
          {searchLoading ? (
            <div className="search-loading">
              <LoadingSpinner text="Searching movies..." />
            </div>
          ) : (
            <VideoList 
              videos={safeDisplayVideos} 
              className="home-grid"
              itemScope
              itemType="https://schema.org/ItemList"
            />
          )}
        </div>
        
        {/* ADD SEO-FRIENDLY PAGINATION INFO */}
        {safeDisplayVideos.length > 0 && (
          <div className="seo-content" style={{display: 'none'}} aria-hidden="true">
            <h2>Movies Available for Streaming</h2>
            <p>
              Watch {safeDisplayVideos.length} {searchTerm ? `${searchTerm} ` : ''}movies online free in HD quality. 
              {searchTerm 
                ? ` Browse our collection of ${searchTerm} movies with instant streaming, no registration required.`
                : ' Stream latest Hollywood, Bollywood, Action, Romance, Comedy movies with English subtitles.'
              }
            </p>
            <ul>
              {safeDisplayVideos.slice(0, 10).map(video => (
                <li key={video.id}>
                  <a href={`/video/${video.id}`}>{video.title}</a> - {video.genre} Movie
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <AdSlot position="footer" />
      </div>
    </div>
  );
};

export default HomePage;
