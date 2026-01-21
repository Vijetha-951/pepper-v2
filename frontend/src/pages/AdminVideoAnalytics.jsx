import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, Eye, Heart, Users, Video, ArrowLeft,
  Calendar, Award, Activity
} from 'lucide-react';
import { auth } from '../config/firebase';
import './AdminVideoAnalytics.css';

export default function AdminVideoAnalytics() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoAnalytics, setVideoAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/videos/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVideoAnalytics = async (videoId) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(`/api/videos/admin/${videoId}/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setVideoAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching video analytics:', error);
    }
  };

  const handleVideoClick = (video) => {
    setSelectedVideo(video);
    fetchVideoAnalytics(video._id);
  };

  if (loading) {
    return <div className="analytics-loading">Loading analytics...</div>;
  }

  if (!stats) {
    return (
      <div className="analytics-error">
        <h2>Failed to load analytics</h2>
        <p>Please ensure you are logged in as an admin (vj.vijetha01@gmail.com).</p>
        <button className="back-btn" onClick={() => navigate('/login')}>
          Go to Login
        </button>
      </div>
    );
  }

  if (selectedVideo && videoAnalytics) {
    const viewsChartData = videoAnalytics.analytics.viewsByDay.map(item => ({
      date: item._id,
      views: item.count
    }));

    const likesChartData = videoAnalytics.analytics.likesByDay.map(item => ({
      date: item._id,
      likes: item.count
    }));

    return (
      <div className="video-analytics-detail">
        <button className="back-btn" onClick={() => setSelectedVideo(null)}>
          <ArrowLeft /> Back to Overview
        </button>

        <div className="analytics-header">
          <h1>{videoAnalytics.video.title}</h1>
          <span className="category-badge">{videoAnalytics.video.category}</span>
        </div>

        <div className="detail-stats-grid">
          <div className="detail-stat-card">
            <Eye className="stat-icon" />
            <div className="stat-content">
              <div className="stat-value">{videoAnalytics.analytics.totalViews}</div>
              <div className="stat-label">Total Views</div>
            </div>
          </div>

          <div className="detail-stat-card">
            <Heart className="stat-icon" />
            <div className="stat-content">
              <div className="stat-value">{videoAnalytics.analytics.totalLikes}</div>
              <div className="stat-label">Total Likes</div>
            </div>
          </div>

          <div className="detail-stat-card">
            <Users className="stat-icon" />
            <div className="stat-content">
              <div className="stat-value">{videoAnalytics.analytics.uniqueViewers}</div>
              <div className="stat-label">Unique Viewers</div>
            </div>
          </div>

          <div className="detail-stat-card">
            <TrendingUp className="stat-icon" />
            <div className="stat-content">
              <div className="stat-value">{videoAnalytics.analytics.engagementRate}%</div>
              <div className="stat-label">Engagement Rate</div>
            </div>
          </div>
        </div>

        <div className="charts-grid">
          <div className="chart-card">
            <h3><Activity /> Views Over Time (Last 30 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={viewsChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="views" stroke="#3498db" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3><Heart /> Likes Over Time (Last 30 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={likesChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="likes" stroke="#e74c3c" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="activity-lists">
          <div className="activity-card">
            <h3><Heart /> Recent Likes ({videoAnalytics.analytics.recentLikes.length})</h3>
            <div className="activity-list">
              {videoAnalytics.analytics.recentLikes.slice(0, 10).map((like, index) => (
                <div key={index} className="activity-item">
                  <span className="user-name">{like.userName || like.userEmail || 'User'}</span>
                  <span className="activity-time">
                    {new Date(like.likedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="activity-card">
            <h3><Eye /> Recent Views ({videoAnalytics.analytics.recentViews.length})</h3>
            <div className="activity-list">
              {videoAnalytics.analytics.recentViews.slice(0, 10).map((view, index) => (
                <div key={index} className="activity-item">
                  <span className="user-name">{view.userName || view.userEmail || 'User'}</span>
                  <span className="activity-time">
                    {new Date(view.viewedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const categoryData = stats.videosByCategory ? stats.videosByCategory.map(item => ({
    name: item._id,
    value: item.count
  })) : [];

  const COLORS = ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c', '#34495e'];

  return (
    <div className="admin-video-analytics">
      <div className="analytics-header">
        <div>
          <h1><TrendingUp /> Video Analytics Dashboard</h1>
          <p>Track video performance and user engagement</p>
        </div>
        <button className="manage-btn" onClick={() => navigate('/admin-videos')}>
          <Video /> Manage Videos
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <Video className="stat-icon" />
          <div className="stat-content">
            <div className="stat-value">{stats.totalVideos}</div>
            <div className="stat-label">Total Videos</div>
            <div className="stat-sublabel">{stats.activeVideos} active</div>
          </div>
        </div>

        <div className="stat-card">
          <Eye className="stat-icon" />
          <div className="stat-content">
            <div className="stat-value">{stats.totalViews.toLocaleString()}</div>
            <div className="stat-label">Total Views</div>
            <div className="stat-sublabel">{stats.recentViews} in last 7 days</div>
          </div>
        </div>

        <div className="stat-card">
          <Heart className="stat-icon" />
          <div className="stat-content">
            <div className="stat-value">{stats.totalLikes.toLocaleString()}</div>
            <div className="stat-label">Total Likes</div>
            <div className="stat-sublabel">{stats.recentLikes} in last 7 days</div>
          </div>
        </div>

        <div className="stat-card">
          <Users className="stat-icon" />
          <div className="stat-content">
            <div className="stat-value">{stats.uniqueViewers}</div>
            <div className="stat-label">Unique Viewers</div>
            <div className="stat-sublabel">{stats.engagementRate}% engagement</div>
          </div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <h3><Activity /> Videos by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3><Award /> Top 10 Most Viewed Videos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.mostViewed}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="title" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="viewCount" fill="#3498db" name="Views" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="videos-table-card">
        <h3><Award /> Top Performing Videos</h3>
        <div className="videos-table">
          <table>
            <thead>
              <tr>
                <th>Video</th>
                <th>Category</th>
                <th>Views</th>
                <th>Likes</th>
                <th>Engagement</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {stats.mostViewed.slice(0, 10).map(video => (
                <tr key={video._id}>
                  <td className="video-title">{video.title}</td>
                  <td>
                    <span className="category-badge">{video.category}</span>
                  </td>
                  <td>
                    <span className="stat-badge">
                      <Eye size={14} /> {video.viewCount}
                    </span>
                  </td>
                  <td>
                    <span className="stat-badge">
                      <Heart size={14} /> {video.likes}
                    </span>
                  </td>
                  <td>
                    {video.viewCount > 0 
                      ? ((video.likes / video.viewCount) * 100).toFixed(1) + '%'
                      : '0%'
                    }
                  </td>
                  <td>
                    <button 
                      className="details-btn"
                      onClick={() => handleVideoClick(video)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
