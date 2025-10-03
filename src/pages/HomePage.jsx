import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVideos } from '../hooks/useVideos';
import VideoList from '../components/User/VideoList';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import AdSlot from '../components/Common/AdSlot';
import SeoHead from '../components/SEO/SeoHead'; // ONLY THIS IMPORT IS REQUIRED

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
        title: `Search Results for "${searchTerm}" - YTMoviesHub | Find & Watch Movies Online`,
        description: `Find and watch ${searchTerm} movies online free in HD quality. Browse ${safeVideos.length} ${searchTerm} movies with instant streaming.`,
        keywords: `${searchTerm} movies, watch ${searchTerm} movies online, ${searchTerm} films, ${searchTerm} cinema, stream ${searchTerm} movies, ${searchTerm} HD`,
      };
    }

    // Default SEO for home page
    return {
      title: "YTMoviesHub - Stream HD Movies Online Free | Latest Hollywood & Bollywood Movies",
      description: "Watch latest movies online free in HD quality. Stream Hollywood, Bollywood, Action, Romance, Comedy movies with English subtitles. No registration required.",
      keywords: "watch movies online, free movies, HD movies, Hollywood movies, Bollywood movies, stream movies, latest movies, action movies, romance movies, comedy movies, drama movies",
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
      "url": `https://ytmovieshub.website/?search=${encodeURIComponent(searchTerm)}`,
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
            "url": `https://ytmovieshub.website/video/${video.id}`
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
          "url": `https://ytmovieshub.website/video/${video.id}`
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
      loadRandomVideos();
    } else if (!searchTerm) {
      if (safeVideos.length === 0) {
        loadRandomVideos();
      }
    }
  }, [searchTerm, search, lastSearchTerm, loadRandomVideos]);

  useEffect(() => {
    if (!searchTerm) {
      const shuffled = [...safeVideos].sort(() => Math.random() - 0.5);
      setDisplayVideos(shuffled);
    } else {
      setDisplayVideos(safeVideos);
    }
  }, [safeVideos, searchTerm]);

  useEffect(() => {
    if (!searchTerm) {
      const interval = setInterval(() => {
        loadRandomVideos();
      }, 300000);

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
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          <p>Error: {error}</p>
          <button onClick={loadRandomVideos} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </>
    );
  }

  const safeDisplayVideos = Array.isArray(displayVideos) ? displayVideos : [];
  const seoData = getSeoData();
  const structuredData = searchTerm ? generateSearchStructuredData() : generateHomeStructuredData();

  return (
    <div className="home-page">
      {/* SEO COMPONENTS - WORK WITHOUT CSS */}
      <SeoHead {...seoData} />
      
      {/* STRUCTURED DATA - WORKS WITHOUT CSS */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}

      <div className="container">
        <AdSlot position="header" />
        
        {searchTerm && (
          <div className="page-header">
            <h1>
              Search Results for "{searchTerm}"
              {(searchLoading || loading) && (
                <i className="fas fa-spinner fa-spin" style={{marginLeft: '10px'}}></i>
              )}
            </h1>
            
            <div className="search-results-info">
              <p className="results-count">
                Found {safeDisplayVideos.length} {safeDisplayVideos.length === 1 ? 'movie' : 'movies'}
                {searchLoading && '...'}
              </p>
              {safeDisplayVideos.length === 0 && !searchLoading && (
                <p className="no-results-help">
                  Try different keywords or browse all movies
                </p>
              )}
            </div>
          </div>
        )}

        {searchLoading ? (
          <div className="search-loading">
            <LoadingSpinner text="Searching movies..." />
          </div>
        ) : (
          <VideoList videos={safeDisplayVideos} className="home-grid" />
        )}
        
        <AdSlot position="footer" />
      </div>
    </div>
  );
};

export default HomePage;
