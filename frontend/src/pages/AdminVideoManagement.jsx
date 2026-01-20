import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Plus, Edit, Trash2, Eye, EyeOff, Heart, ArrowLeft } from 'lucide-react';
import { auth } from '../config/firebase';
import './AdminVideoManagement.css';

export default function AdminVideoManagement() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [stats, setStats] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    thumbnail: '',
    category: 'other',
    duration: '',
    tags: '',
    isActive: true
  });

  useEffect(() => {
    fetchVideos();
    fetchStats();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/videos/admin/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos || []);
      } else {
        setErrorMessage('Failed to load videos');
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      setErrorMessage('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/videos/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate and auto-convert YouTube URL
    let videoUrl = formData.url.trim();
    
    // Auto-convert YouTube watch URL to embed URL
    if (videoUrl.includes('youtube.com/watch?v=')) {
      const videoId = videoUrl.split('watch?v=')[1]?.split('&')[0];
      if (videoId) {
        videoUrl = `https://www.youtube.com/embed/${videoId}`;
        setFormData({ ...formData, url: videoUrl });
      }
    } else if (videoUrl.includes('youtu.be/')) {
      const videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
      if (videoId) {
        videoUrl = `https://www.youtube.com/embed/${videoId}`;
        setFormData({ ...formData, url: videoUrl });
      }
    }
    
    // Validate embed format for YouTube
    if (videoUrl.includes('youtube.com') && !videoUrl.includes('/embed/')) {
      setErrorMessage('❌ YouTube URL must be in embed format: https://www.youtube.com/embed/VIDEO_ID');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }
    
    try {
      const token = await auth.currentUser.getIdToken();
      const url = editingVideo 
        ? `/api/videos/admin/${editingVideo._id}`
        : '/api/videos/admin/create';
      
      const method = editingVideo ? 'PUT' : 'POST';
      
      const videoData = {
        ...formData,
        url: videoUrl,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(videoData)
      });
      
      if (response.ok) {
        setSuccessMessage(editingVideo ? 'Video updated successfully' : 'Video created successfully');
        setShowModal(false);
        resetForm();
        fetchVideos();
        fetchStats();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setErrorMessage(data.message || 'Failed to save video');
      }
    } catch (error) {
      console.error('Error saving video:', error);
      setErrorMessage('Failed to save video');
    }
  };

  const handleDelete = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;
    
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(`/api/videos/admin/${videoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setSuccessMessage('Video deleted successfully');
        fetchVideos();
        fetchStats();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage('Failed to delete video');
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      setErrorMessage('Failed to delete video');
    }
  };

  const handleEdit = (video) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      description: video.description,
      url: video.url,
      thumbnail: video.thumbnail || '',
      category: video.category,
      duration: video.duration || '',
      tags: video.tags?.join(', ') || '',
      isActive: video.isActive
    });
    setShowModal(true);
  };

  const toggleActive = async (video) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(`/api/videos/admin/${video._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !video.isActive })
      });
      
      if (response.ok) {
        setSuccessMessage(`Video ${!video.isActive ? 'activated' : 'deactivated'} successfully`);
        fetchVideos();
        fetchStats();
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error toggling video status:', error);
      setErrorMessage('Failed to update video status');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      url: '',
      thumbnail: '',
      category: 'other',
      duration: '',
      tags: '',
      isActive: true
    });
    setEditingVideo(null);
  };

  return (
    <div className="admin-video-management">
      {/* Header */}
      <div className="header">
        <div>
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          <h1>🎥 Video Management</h1>
          <p>Manage pepper-related videos for customers</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="add-btn">
          <Plus size={20} />
          Add Video
        </button>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="message success-message">{successMessage}</div>
      )}
      {errorMessage && (
        <div className="message error-message">{errorMessage}</div>
      )}

      {/* Stats */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🎬</div>
            <div className="stat-value">{stats.totalVideos}</div>
            <div className="stat-label">Total Videos</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-value">{stats.activeVideos}</div>
            <div className="stat-label">Active Videos</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👁️</div>
            <div className="stat-value">{stats.totalViews}</div>
            <div className="stat-label">Total Views</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">❤️</div>
            <div className="stat-value">{stats.totalLikes}</div>
            <div className="stat-label">Total Likes</div>
          </div>
        </div>
      )}

      {/* Videos Table */}
      <div className="card">
        <h2>All Videos</h2>
        
        {loading ? (
          <div className="loading">Loading videos...</div>
        ) : videos.length === 0 ? (
          <div className="empty-state">
            <Video size={48} />
            <p>No videos yet. Click "Add Video" to get started.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Views</th>
                  <th>Likes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {videos.map(video => (
                  <tr key={video._id}>
                    <td>
                      <div className="video-title-cell">
                        <div className="video-thumbnail" 
                          style={{
                            background: video.thumbnail ? `url(${video.thumbnail})` : '#e5e7eb',
                            backgroundSize: 'cover'
                          }}
                        />
                        <div>
                          <div className="video-title">{video.title}</div>
                          <div className="video-duration">{video.duration || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="category-badge">{video.category}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${video.isActive ? 'active' : 'inactive'}`}>
                        {video.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{video.viewCount || 0}</td>
                    <td>{video.likes || 0}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          onClick={() => toggleActive(video)}
                          className="action-btn"
                          title={video.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {video.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button 
                          onClick={() => handleEdit(video)}
                          className="action-btn"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(video._id)}
                          className="action-btn delete"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingVideo ? 'Edit Video' : 'Add New Video'}</h2>
              <button onClick={() => setShowModal(false)} className="close-btn">×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Video URL * (YouTube embed, Vimeo, etc.)</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://www.youtube.com/embed/VIDEO_ID"
                  required
                />
                <small style={{ display: 'block', marginTop: '0.5rem', color: '#059669', fontWeight: '500' }}>
                  ✅ Correct: https://www.youtube.com/embed/VIDEO_ID<br/>
                  ❌ Wrong: https://www.youtube.com/watch?v=VIDEO_ID
                </small>
                <small style={{ display: 'block', marginTop: '0.25rem', color: '#6b7280' }}>
                  Paste any YouTube URL - it will be auto-converted to embed format
                </small>
              </div>

              <div className="form-group">
                <label>Thumbnail URL</label>
                <input
                  type="url"
                  value={formData.thumbnail}
                  onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                  placeholder="https://example.com/thumbnail.jpg"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="farming">Farming</option>
                    <option value="processing">Processing</option>
                    <option value="cooking">Cooking</option>
                    <option value="benefits">Health Benefits</option>
                    <option value="testimonial">Testimonials</option>
                    <option value="tutorial">Tutorials</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Duration</label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 5:30"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="pepper, farming, organic"
                />
              </div>

              <div className="form-group" style={{ 
                background: formData.isActive ? '#f0fdf4' : '#fef2f2',
                padding: '1rem',
                borderRadius: '8px',
                border: formData.isActive ? '2px solid #10b981' : '2px solid #dc2626'
              }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: formData.isActive ? '#059669' : '#dc2626',
                  margin: 0
                }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <span>
                    {formData.isActive ? '✅ Active - Visible to all users' : '❌ Inactive - Hidden from users'}
                  </span>
                </label>
                <small style={{ 
                  display: 'block', 
                  marginTop: '0.5rem', 
                  marginLeft: '2rem',
                  color: '#6b7280',
                  fontSize: '0.875rem'
                }}>
                  {formData.isActive 
                    ? 'This video will appear in the user dashboard' 
                    : 'This video will NOT be visible to users'}
                </small>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {editingVideo ? 'Update Video' : 'Add Video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
