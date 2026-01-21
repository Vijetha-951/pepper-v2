import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { auth } from '../config/firebase';
import './VideoLikeButton.css';

export default function VideoLikeButton({ videoId, initialLikes = 0, initialLiked = false, size = 'medium' }) {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setLikes(initialLikes);
    setIsLiked(initialLiked);
  }, [initialLikes, initialLiked]);

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    setIsLoading(true);
    setIsAnimating(true);

    try {
      let token = '';
      if (auth.currentUser) {
        token = await auth.currentUser.getIdToken();
      }
      
      const response = await fetch(`/api/videos/${videoId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLikes(data.likes);
        setIsLiked(data.liked);
      } else {
        console.error('Failed to like video');
      }
    } catch (error) {
      console.error('Error liking video:', error);
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const sizeClasses = {
    small: 'video-like-btn-small',
    medium: 'video-like-btn-medium',
    large: 'video-like-btn-large'
  };

  return (
    <button
      className={`video-like-btn ${sizeClasses[size]} ${isLiked ? 'liked' : ''} ${isAnimating ? 'animating' : ''}`}
      onClick={handleLike}
      disabled={isLoading}
      title={isLiked ? 'Unlike' : 'Like'}
    >
      <Heart 
        className="like-icon" 
        fill={isLiked ? 'currentColor' : 'none'}
        size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
      />
      <span className="like-count">{likes}</span>
    </button>
  );
}
