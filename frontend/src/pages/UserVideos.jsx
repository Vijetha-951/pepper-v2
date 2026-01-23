import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video as VideoIcon, Play, Eye, Heart, Filter, Search, ArrowLeft } from 'lucide-react';
import { auth } from '../config/firebase';
import VideoLikeButton from '../components/VideoLikeButton';
import './UserVideos.css';

export default function UserVideos() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchVideos();
  }, []);

  useEffect(() => {
    filterVideos();
  }, [videos, selectedCategory, searchQuery]);

  const fetchCategories = async () => {
    try {
      let token = '';
      if (auth.currentUser) {
        token = await auth.currentUser.getIdToken();
      }
      
      const response = await fetch('/api/videos/categories/list', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchVideos = async () => {
    try {
      let token = '';
      if (auth.currentUser) {
        token = await auth.currentUser.getIdToken();
      }

      const response = await fetch('/api/videos', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setVideos(data.videos);
        setFilteredVideos(data.videos);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterVideos = () => {
    let filtered = videos;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(v => v.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(v => 
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredVideos(filtered);
  };

  const handleVideoClick = async (video) => {
    try {
      let token = '';
      if (auth.currentUser) {
        token = await auth.currentUser.getIdToken();
      }

      const response = await fetch(`/api/videos/${video._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setSelectedVideo({
          ...data.video,
          hasLiked: data.video.hasLiked
        });
      }
    } catch (error) {
      console.error('Error fetching video:', error);
    }
  };

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    
    // Extract video ID from various formats
    let videoId = '';
    
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('watch?v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('youtube.com/embed/')) {
      // Handle cases like /embed/embed/ or /embed/videoId
      const parts = url.split('/embed/');
      videoId = parts[parts.length - 1]?.split('?')[0];
    } else if (url.includes('youtube.com/shorts/')) {
      videoId = url.split('/shorts/')[1]?.split('?')[0];
    } else {
      // If it's just the ID or something else
      videoId = url;
    }
    
    return `https://www.youtube.com/embed/${videoId}`;
  };

  if (loading) {
    return <div className="user-videos-loading">Loading videos...</div>;
  }

  if (selectedVideo) {
    return (
      <div className="video-player-page">
        <button className="back-btn" onClick={() => setSelectedVideo(null)}>
          <ArrowLeft /> Back to Videos
        </button>
        
        <div className="video-player-container">
          <div className="video-player">
            <iframe
              src={getYouTubeEmbedUrl(selectedVideo.url)}
              title={selectedVideo.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>

          <div className="video-info">
            <h1>{selectedVideo.title}</h1>
            
            <div className="video-stats">
              <span className="stat">
                <Eye size={18} /> {selectedVideo.viewCount} views
              </span>
              <VideoLikeButton 
                videoId={selectedVideo._id}
                initialLikes={selectedVideo.likes}
                initialLiked={selectedVideo.hasLiked}
                size="large"
              />
            </div>

            <div className="video-meta">
              <span className="category-badge">{selectedVideo.category}</span>
              {selectedVideo.duration && (
                <span className="duration">{selectedVideo.duration}</span>
              )}
            </div>

            <div className="video-description">
              <h3>About</h3>
              <p>{selectedVideo.description}</p>
            </div>

            {selectedVideo.tags && selectedVideo.tags.length > 0 && (
              <div className="video-tags">
                {selectedVideo.tags.map((tag, index) => (
                  <span key={index} className="tag">#{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-videos-page">
      <div className="videos-header">
        <h1><VideoIcon /> Video Library</h1>
        <p>Learn about pepper farming, recipes, and more</p>
      </div>

      <div className="videos-filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="category-filter">
          <Filter size={20} />
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="videos-grid">
        {filteredVideos.length === 0 ? (
          <div className="no-videos">
            <VideoIcon size={48} />
            <p>No videos found</p>
          </div>
        ) : (
          filteredVideos.map(video => (
            <div 
              key={video._id} 
              className="video-card"
              onClick={() => handleVideoClick(video)}
            >
              <div className="video-thumbnail">
                {video.thumbnail ? (
                  <img src={video.thumbnail} alt={video.title} />
                ) : (
                  <div className="thumbnail-placeholder">
                    <Play size={48} />
                  </div>
                )}
                <div className="play-overlay">
                  <Play size={48} />
                </div>
              </div>

              <div className="video-card-content">
                <h3>{video.title}</h3>
                <p className="video-description">{video.description}</p>
                
                <div className="video-card-footer">
                  <span className="views">
                    <Eye size={16} /> {video.viewCount}
                  </span>
                  <span className="likes">
                    <Heart size={16} /> {video.likes}
                  </span>
                  <span className="category-badge-small">{video.category}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
