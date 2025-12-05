import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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
      // Basic client-side check, backend will enforce too
      // navigate('/'); // Commented out for dev if we want to view it, but actually we should redirect
    }
    fetchStats();
  }, [user]);

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
    } catch (error) {
        setFeedback('Failed to send notification.');
    } finally {
        setSending(false);
    }
  };

  if (!user || user.role !== 'admin') {
      return (
          <div className="container" style={{marginTop: '100px', textAlign: 'center'}}>
              <h1>Access Denied</h1>
              <p>You must be an administrator to view this page.</p>
          </div>
      );
  }

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  return (
    <div className="container" style={{ marginTop: '80px', minHeight: '80vh' }}>
      <h1>Admin Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <div className="stat-card" style={{ background: '#222', padding: '20px', borderRadius: '8px' }}>
            <h3>Users</h3>
            <p style={{ fontSize: '2rem', color: 'var(--primary-color)' }}>{stats?.userCount}</p>
        </div>
        <div className="stat-card" style={{ background: '#222', padding: '20px', borderRadius: '8px' }}>
            <h3>Comments</h3>
            <p style={{ fontSize: '2rem', color: 'var(--primary-color)' }}>{stats?.commentCount}</p>
        </div>
        <div className="stat-card" style={{ background: '#222', padding: '20px', borderRadius: '8px' }}>
            <h3>Total Views</h3>
            <p style={{ fontSize: '2rem', color: 'var(--primary-color)' }}>{stats?.viewCount}</p>
        </div>
      </div>

      {/* Access Token Warning */}
      {!import.meta.env.VITE_API_URL && (
         <div style={{marginTop: '20px', padding: '10px', background: '#332b00', border: '1px solid #ffd700'}}>
             ⚠️ Warning: Env variables might not be set correctly.
         </div>
      )}

      {/* Send Notification */}
      <div style={{ marginTop: '40px', background: '#1a1a1a', padding: '20px', borderRadius: '8px' }}>
          <h2>Send System Notification</h2>
          {feedback && <p style={{color: feedback.includes('success') ? 'green' : 'red'}}>{feedback}</p>}
          <form onSubmit={handleSendNotification} style={{marginTop: '15px'}}>
              <div style={{marginBottom: '10px'}}>
                  <input 
                    type="text" 
                    placeholder="Title"
                    className="form-input"
                    value={notifTitle}
                    onChange={e => setNotifTitle(e.target.value)}
                    required
                  />
              </div>
              <div style={{marginBottom: '10px'}}>
                  <textarea 
                    placeholder="Message"
                    className="form-input"
                    value={notifMessage}
                    onChange={e => setNotifMessage(e.target.value)}
                    required
                    style={{minHeight: '100px'}}
                  />
              </div>
              <button className="btn btn-primary" disabled={sending}>
                  {sending ? 'Sending...' : 'Send to All Users'}
              </button>
          </form>
      </div>
    </div>
  );
};

export default AdminDashboard;
