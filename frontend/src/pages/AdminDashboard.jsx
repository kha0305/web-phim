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
    } catch (error) {
        setFeedback('Failed to send notification.');
    } finally {
        setSending(false);
    }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  return (
    <div className="admin-dashboard-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p className="admin-subtitle">Welcome back, {user?.username}!</p>
      </div>
      
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>Users</h3>
              <p className="stat-value">{stats?.userCount}</p>
            </div>
        </div>
        <div className="stat-card">
            <div className="stat-icon">💬</div>
             <div className="stat-info">
              <h3>Comments</h3>
              <p className="stat-value">{stats?.commentCount}</p>
            </div>
        </div>
        <div className="stat-card">
            <div className="stat-icon">👁️</div>
             <div className="stat-info">
              <h3>Total Views</h3>
              <p className="stat-value">{stats?.viewCount}</p>
            </div>
        </div>
      </div>

       <div className="dashboard-content">
          {/* Send Notification */}
          <div className="dashboard-section notification-section">
              <h2>📢 System Notification</h2>
              <p className="section-desc">Send a broadcast message to all users.</p>
              
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
                        placeholder="e.g. System Update, New Feature..."
                        className="form-input"
                        value={notifTitle}
                        onChange={e => setNotifTitle(e.target.value)}
                        required
                      />
                  </div>
                  <div className="form-group">
                      <label>Message</label>
                      <textarea 
                        placeholder="Write your message here..."
                        className="form-input"
                        value={notifMessage}
                        onChange={e => setNotifMessage(e.target.value)}
                        required
                        rows="4"
                      />
                  </div>
                  <button className="btn btn-primary send-btn" disabled={sending}>
                      {sending ? 'Sending...' : '🚀 Send Notification'}
                  </button>
              </form>
          </div>

          {/* Top Views - Placeholder if data exists */}
          {stats?.topViews && stats.topViews.length > 0 && (
             <div className="dashboard-section top-views-section">
                <h2>🔥 Top Viewed Movies</h2>
                 <div className="top-views-list">
                    {stats.topViews.map((view, index) => (
                      <div key={index} className="top-view-item">
                          <span className="rank">#{index + 1}</span>
                          <span className="movie-id">ID: {view.movieId}</span>
                          <span className="views">{view.count} views</span>
                      </div>
                    ))}
                 </div>
             </div>
          )}
       </div>
    </div>
  );
};

export default AdminDashboard;
