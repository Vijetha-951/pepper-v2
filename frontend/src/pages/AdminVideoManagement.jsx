import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Plus, Edit, Trash2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
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
  const [uploadMethod, setUploadMethod] = useState('file'); // 'url' or 'file' - default to 'file' for upload
  const [videoFile, setVideoFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
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
      if (!auth.currentUser) {
        console.error('❌ No user logged in');
        setErrorMessage('Please log in to continue');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/videos/admin/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401) {
        setErrorMessage('Unauthorized: Admin access required');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos || []);
      } else {
        setErrorMessage('Failed to load videos');
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      setErrorMessage('Error loading videos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      if (!auth.currentUser) {
        console.error('❌ No user logged in');
        setErrorMessage('Please log in as admin');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const token = await auth.currentUser.getIdToken();
      console.log('📊 Fetching stats with token:', token.substring(0, 20) + '...');
      
      const response = await fetch('/api/videos/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Stats response status:', response.status);
      
      if (response.status === 401) {
        setErrorMessage('Unauthorized: Please log in as admin (vj.vijetha01@gmail.com)');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Stats data:', data);
        setStats(data.stats);
      } else {
        const errorData = await response.text();
        console.error('❌ Stats error:', errorData);
        setErrorMessage('Failed to load stats');
      }
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
      setErrorMessage('Error: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if using file upload method
    if (uploadMethod === 'file') {
      if (!videoFile) {
        setErrorMessage('❌ Please select a video file to upload');
        setTimeout(() => setErrorMessage(''), 3000);
        return;
      }
      
      // Handle file upload
      return handleFileUpload();
    }
    
    // Handle URL-based video (existing logic)
    // Validate and auto-convert YouTube URL
    let videoUrl = formData.url.trim();
    let videoId = '';
    
    // Extract video ID from various formats
    if (videoUrl.includes('youtube.com/watch?v=')) {
      videoId = videoUrl.split('watch?v=')[1]?.split('&')[0];
    } else if (videoUrl.includes('youtu.be/')) {
      videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
    } else if (videoUrl.includes('youtube.com/embed/')) {
      const parts = videoUrl.split('/embed/');
      videoId = parts[parts.length - 1]?.split('?')[0];
    } else if (videoUrl.includes('youtube.com/shorts/')) {
      videoId = videoUrl.split('/shorts/')[1]?.split('?')[0];
    } else if (!videoUrl.includes('/') && videoUrl.length > 5) {
      // If it looks like a video ID already
      videoId = videoUrl;
    }

    if (videoId) {
      videoUrl = `https://www.youtube.com/embed/${videoId}`;
      setFormData(prev => ({ ...prev, url: videoUrl }));
    }
    
    // Final validation for YouTube
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

  const handleFileUpload = async () => {
    if (!videoFile) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const token = await auth.currentUser.getIdToken();
      const formDataToSend = new FormData();
      
      formDataToSend.append('video', videoFile);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('thumbnail', formData.thumbnail || '');
      formDataToSend.append('category', formData.category);
      formDataToSend.append('duration', formData.duration || '');
      formDataToSend.append('tags', formData.tags || '');
      
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percentComplete);
        }
      });
      
      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 201) {
          setSuccessMessage('✅ Video uploaded successfully!');
          setShowModal(false);
          resetForm();
          fetchVideos();
          fetchStats();
          setTimeout(() => setSuccessMessage(''), 3000);
        } else {
          const response = JSON.parse(xhr.responseText);
          setErrorMessage(response.message || '❌ Failed to upload video');
          setTimeout(() => setErrorMessage(''), 5000);
        }
        setIsUploading(false);
        setUploadProgress(0);
      });
      
      // Handle errors
      xhr.addEventListener('error', () => {
        setErrorMessage('❌ Upload failed. Please try again.');
        setTimeout(() => setErrorMessage(''), 5000);
        setIsUploading(false);
        setUploadProgress(0);
      });
      
      xhr.open('POST', '/api/videos/admin/upload');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formDataToSend);
      
    } catch (error) {
      console.error('Error uploading video:', error);
      setErrorMessage('❌ Failed to upload video: ' + error.message);
      setTimeout(() => setErrorMessage(''), 5000);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 500MB)
      if (file.size > 500 * 1024 * 1024) {
        setErrorMessage('❌ File size must be less than 500MB');
        setTimeout(() => setErrorMessage(''), 5000);
        return;
      }
      
      // Check file type
      const allowedTypes = ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo', 'video/x-flv', 'video/webm', 'video/x-matroska'];
      if (!allowedTypes.includes(file.type)) {
        setErrorMessage('❌ Only video files are allowed (MP4, AVI, MOV, WMV, FLV, WebM, MKV)');
        setTimeout(() => setErrorMessage(''), 5000);
        return;
      }
      
      setVideoFile(file);
      setSuccessMessage(`✅ Selected: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
      setTimeout(() => setSuccessMessage(''), 3000);
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
    setUploadMethod('file');
    setVideoFile(null);
    setUploadProgress(0);
    setIsUploading(false);
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
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => navigate('/admin-video-analytics')} 
            className="analytics-btn"
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600'
            }}
          >
            📊 View Analytics
          </button>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="add-btn">
            <Plus size={20} />
            Add Video
          </button>
        </div>
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
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
        <button 
          onClick={() => { fetchStats(); fetchVideos(); }}
          style={{
            padding: '0.5rem 1rem',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🔄 Refresh Stats
        </button>
      </div>

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

              {!editingVideo && (
                <div className="form-group">
                  <label>Upload Method *</label>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="uploadMethod"
                        value="url"
                        checked={uploadMethod === 'url'}
                        onChange={(e) => setUploadMethod(e.target.value)}
                      />
                      <span>YouTube/Vimeo URL</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="uploadMethod"
                        value="file"
                        checked={uploadMethod === 'file'}
                        onChange={(e) => setUploadMethod(e.target.value)}
                      />
                      <span>Upload Video File</span>
                    </label>
                  </div>
                </div>
              )}

              {uploadMethod === 'url' ? (
                <div className="form-group">
                  <label>Video URL * (YouTube embed, Vimeo, etc.)</label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://www.youtube.com/embed/VIDEO_ID"
                    required={uploadMethod === 'url'}
                  />
                  <small style={{ display: 'block', marginTop: '0.5rem', color: '#059669', fontWeight: '500' }}>
                    ✅ Correct: https://www.youtube.com/embed/VIDEO_ID<br/>
                    ❌ Wrong: https://www.youtube.com/watch?v=VIDEO_ID
                  </small>
                  <small style={{ display: 'block', marginTop: '0.25rem', color: '#6b7280' }}>
                    Paste any YouTube URL - it will be auto-converted to embed format
                  </small>
                </div>
              ) : (
                <div className="form-group">
                  <label>Video File * (Max 500MB)</label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    required={uploadMethod === 'file' && !videoFile}
                    style={{
                      padding: '0.75rem',
                      border: '2px dashed #d1d5db',
                      borderRadius: '8px',
                      width: '100%',
                      cursor: 'pointer'
                    }}
                  />
                  {videoFile && (
                    <div style={{ 
                      marginTop: '0.5rem', 
                      padding: '0.5rem', 
                      background: '#f0fdf4', 
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      color: '#059669'
                    }}>
                      ✅ {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </div>
                  )}
                  <small style={{ display: 'block', marginTop: '0.5rem', color: '#6b7280' }}>
                    Supported formats: MP4, AVI, MOV, WMV, FLV, WebM, MKV
                  </small>
                </div>
              )}

              {isUploading && (
                <div className="form-group">
                  <div style={{ marginBottom: '0.5rem', color: '#6b7280' }}>
                    Uploading... {uploadProgress}%
                  </div>
                  <div style={{ 
                    width: '100%', 
                    height: '8px', 
                    background: '#e5e7eb', 
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${uploadProgress}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #10b981, #059669)',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              )}

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
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="cancel-btn"
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={isUploading}
                  style={{ opacity: isUploading ? 0.6 : 1 }}
                >
                  {isUploading 
                    ? `Uploading... ${uploadProgress}%` 
                    : editingVideo 
                      ? 'Update Video' 
                      : uploadMethod === 'file' 
                        ? 'Upload Video' 
                        : 'Add Video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
