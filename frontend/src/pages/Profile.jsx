import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import '../profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    watchlistCount: 0,
    historyCount: 0
  });
  // const [loading, setLoading] = useState(true); // Unused
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (user) {
      setEditName(user.username);
      setEditAvatar(user.avatar || '');
      setPreviewUrl(user.avatar || '');
    }
  }, [user]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchStats = async () => {
      try {
        const [watchlistRes, historyRes] = await Promise.all([
          axios.get('/user/watchlist'),
          axios.get('/user/history')
        ]);
        setStats({
          watchlistCount: watchlistRes.data.length || 0,
          historyCount: historyRes.data.length || 0
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, [user, navigate]);

  const handleUpdateProfile = async () => {
    if (!editName.trim()) return;
    
    try {
      const formData = new FormData();
      formData.append('username', editName);
      if (selectedFile) {
        formData.append('avatar', selectedFile);
      } else if (editAvatar !== user.avatar) {
         // If user manually entered a URL (though we are switching to file upload, keeping URL support might be confusing, let's stick to file or existing URL)
         // Actually, let's support both if we keep the text input, but user asked for "upload".
         // Let's prioritize file.
         formData.append('avatarUrl', editAvatar);
      }

      const response = await axios.put('/user/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        updateUser(response.data.user);
        setIsEditing(false);
        setSelectedFile(null);
      }
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to update profile");
    }
  };

  if (!user) return null;

  return (
    <div className="container" style={{ marginTop: '100px', minHeight: '80vh' }}>
      <div className="profile-container">
        {/* Profile Header / Card */}
        <div className="profile-card">
          <div className="profile-header-bg"></div>
          <div className="profile-content">
            <div className="profile-avatar-wrapper">
              {previewUrl ? (
                <img src={previewUrl} alt="Avatar" className="profile-avatar-img" style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '4px solid var(--surface-color)'
                }} />
              ) : (
                <div className="profile-avatar">
                  {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              {isEditing && (
                 <label htmlFor="avatar-upload" style={{
                    position: 'absolute',
                    bottom: '0',
                    right: '0',
                    background: 'var(--primary-color)',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                 }}>
                    📷
                    <input 
                      id="avatar-upload"
                      type="file" 
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                 </label>
              )}
            </div>
            
            <div className="profile-info">
              {isEditing ? (
                <div style={{ width: '100%' }}>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="profile-name-input"
                    placeholder="Username"
                    style={{
                      fontSize: '1.5rem',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '2px solid var(--primary-color)',
                      color: 'white',
                      marginBottom: '1rem',
                      width: '100%',
                      outline: 'none'
                    }}
                  />
                  <input 
                    type="text" 
                    value={editAvatar}
                    onChange={(e) => {
                        setEditAvatar(e.target.value);
                        setPreviewUrl(e.target.value);
                    }}
                    className="profile-avatar-input"
                    placeholder="Or paste Avatar URL..."
                    style={{
                      fontSize: '0.9rem',
                      background: 'rgba(255,255,255,0.1)',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0.5rem',
                      color: 'white',
                      marginBottom: '0.5rem',
                      width: '100%',
                      outline: 'none'
                    }}
                  />
                </div>
              ) : (
                <h1 className="profile-name">{user.username}</h1>
              )}
              <p className="profile-email">{user.email || 'user@example.com'}</p>
              <div className="profile-badges">
                <span className="profile-badge member-badge">Member</span>
                {/* <span className="profile-badge vip-badge">VIP</span> */}
              </div>
            </div>

            <div className="profile-actions">
              {isEditing ? (
                <>
                  <button className="btn btn-primary" onClick={handleUpdateProfile}>
                    {t('save')}
                  </button>
                  <button className="btn btn-outline" onClick={() => {
                    setIsEditing(false);
                    setEditName(user.username);
                    setEditAvatar(user.avatar || '');
                    setPreviewUrl(user.avatar || '');
                    setSelectedFile(null);
                  }}>
                    {t('cancel')}
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                    {t('edit_profile')}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="profile-stats-grid">
            <div className="stat-card" onClick={() => navigate('/watchlist')}>
              <div className="stat-icon">📑</div>
              <div className="stat-number">{stats.watchlistCount}</div>
              <div className="stat-label">{t('my_watchlist')}</div>
            </div>
            <div className="stat-card" onClick={() => navigate('/history')}>
              <div className="stat-icon">🕒</div>
              <div className="stat-number">{stats.historyCount}</div>
              <div className="stat-label">{t('history')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-number">0</div>
              <div className="stat-label">Reviews</div>
            </div>
          </div>
        </div>

        {/* Recent Activity Section (Placeholder) */}
        <div className="profile-section">
          <h2 className="section-title">Account Settings</h2>
          <div className="settings-grid">
             <div className="setting-item">
                <div className="setting-info">
                    <h3>Email Notifications</h3>
                    <p>Receive updates about new movies and episodes</p>
                </div>
                <div className="toggle-switch active"></div>
             </div>
             <div className="setting-item">
                <div className="setting-info">
                    <h3>Autoplay</h3>
                    <p>Autoplay next episode</p>
                </div>
                <div className="toggle-switch active"></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
