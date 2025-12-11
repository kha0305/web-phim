import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Notification Form
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
    }
    fetchStats();
  }, [user, navigate]);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch admin stats", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
        await axios.post('/admin/notify', {
            title: notifTitle,
            message: notifMessage
        });
        setFeedback('Notification sent successfully!');
        setNotifTitle('');
        setNotifMessage('');
        setTimeout(() => setFeedback(''), 3000);
    } catch {
        setFeedback('Failed to send notification.');
    } finally {
        setSending(false);
    }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="sidebar-logo">🎬 AdminPanel</div>
        <ul className="sidebar-menu">
          <li className="active">📊 Dashboard</li>
          <li onClick={() => alert('Feature coming soon!')}>🎥 Movies</li>
          <li onClick={() => alert('Feature coming soon!')}>👥 Users</li>
          <li onClick={() => alert('Feature coming soon!')}>⚙️ Settings</li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="admin-main">
        <div className="admin-topbar">
          <h2>Overview</h2>
          <div className="admin-profile">
             <span>Hello, <b>{user?.username}</b></span>
             <div className="avatar-circle">{user?.username?.charAt(0).toUpperCase()}</div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
              <div className="stat-icon users-icon">👥</div>
              <div className="stat-info">
                <h3>Total Users</h3>
                <p className="stat-value">{stats?.userCount}</p>
                <span className="stat-trend positive">↑ 12% this week</span>
              </div>
          </div>
          <div className="stat-card">
              <div className="stat-icon comments-icon">💬</div>
               <div className="stat-info">
                <h3>Comments</h3>
                <p className="stat-value">{stats?.commentCount}</p>
                 <span className="stat-trend neutral">• Stable</span>
              </div>
          </div>
          <div className="stat-card">
              <div className="stat-icon views-icon">👁️</div>
               <div className="stat-info">
                <h3>Total Views</h3>
                <p className="stat-value">{stats?.viewCount}</p>
                 <span className="stat-trend positive">↑ 5% today</span>
              </div>
          </div>
        </div>

        <div className="dashboard-content-layout">
            {/* Left Column: Notifications & Quick Actions */}
            <div className="content-left">
                <div className="dashboard-card notification-card">
                    <div className="card-header">
                        <h3>📢 Broadcast Notification</h3>
                    </div>
                    {feedback && (
                        <div className={`feedback-msg ${feedback.includes('success') ? 'success' : 'error'}`}>
                        {feedback}
                        </div>
                    )}
                    <form onSubmit={handleSendNotification} className="notification-form">
                        <div className="form-group">
                            <label>Title</label>
                            <input 
                                type="text" 
                                placeholder="System Update..."
                                className="form-input"
                                value={notifTitle}
                                onChange={e => setNotifTitle(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Message</label>
                            <textarea 
                                placeholder="Message content..."
                                className="form-input"
                                value={notifMessage}
                                onChange={e => setNotifMessage(e.target.value)}
                                required
                                rows="3"
                            />
                        </div>
                        <button className="btn btn-primary send-btn" disabled={sending}>
                            {sending ? 'Sending...' : '🚀 Send'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Right Column: Top Content */}
            <div className="content-right">
                {stats?.topViews && stats.topViews.length > 0 && (
                <div className="dashboard-card top-views-card">
                    <div className="card-header">
                        <h3>🔥 Top Trending Movies</h3>
                        <button className="btn-sm">View All</button>
                    </div>
                    <div className="top-views-list">
                        {stats.topViews.map((view, index) => (
                        <div key={index} className="top-view-item">
                            <div className="rank-badge">{index + 1}</div>
                            <div className="movie-info">
                                <span className="movie-id">{view.movieId}</span>
                                <div className="progress-bg"><div style={{width: `${Math.random() * 60 + 40}%`}} className="progress-fill"></div></div>
                            </div>
                            <span className="views-badge">{view.count} views</span>
                        </div>
                        ))}
                    </div>
                </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
