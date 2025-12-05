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

  // Email Change State
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    if (user) {
      setEditName(user.username);
      setEditAvatar(user.avatar || '');
      setPreviewUrl(user.avatar || '');
      setNewEmail(user.email || '');
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
          axios.get(`/watchlist/${user.id}`),
          axios.get(`/history/${user.id}`)
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

  const handleRequestEmailChange = async () => {
    if (!newEmail || newEmail === user.email) return;
    setEmailError('');
    setEmailMessage('');
    try {
      await axios.post('/user/request-email-change', { newEmail });
      setShowOtpModal(true);
      setEmailMessage('OTP sent to ' + newEmail);
    } catch (error) {
      setEmailError(error.response?.data?.error || 'Failed to send OTP');
    }
  };

  const handleVerifyEmailChange = async () => {
    if (!otp) return;
    setEmailError('');
    setEmailMessage('');
    try {
      const response = await axios.post('/user/verify-email-change', { newEmail, otp });
      updateUser(response.data.user);
      setShowOtpModal(false);
      setIsEditingEmail(false);
      setOtp('');
      alert('Email updated successfully!');
    } catch (error) {
      setEmailError(error.response?.data?.error || 'Invalid OTP');
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
                }} 
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = `https://ui-avatars.com/api/?name=${user.username}&background=random`;
                }}
                />
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
              
              {/* Email Section */}
              <div className="profile-email-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
                {isEditingEmail ? (
                  <>
                    <input 
                      type="email" 
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid #444',
                        borderRadius: '4px',
                        padding: '5px 10px',
                        color: 'white',
                        outline: 'none'
                      }}
                    />
                    <button onClick={handleRequestEmailChange} className="btn-sm btn-primary">Verify</button>
                    <button onClick={() => { setIsEditingEmail(false); setNewEmail(user.email || ''); }} className="btn-sm btn-outline">Cancel</button>
                  </>
                ) : (
                  <>
                    <p className="profile-email">{user.email || 'No email set'}</p>
                    <button onClick={() => setIsEditingEmail(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa' }}>✏️</button>
                  </>
                )}
              </div>
              {emailError && <p style={{ color: 'red', fontSize: '0.8rem' }}>{emailError}</p>}
              {emailMessage && <p style={{ color: 'green', fontSize: '0.8rem' }}>{emailMessage}</p>}

              {/* OTP Modal */}
              {showOtpModal && (
                <div style={{
                  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                  background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                  <div style={{ background: '#222', padding: '20px', borderRadius: '8px', width: '300px', textAlign: 'center' }}>
                    <h3>Verify Email</h3>
                    <p style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '15px' }}>Enter the OTP sent to {newEmail}</p>
                    <input 
                      type="text" 
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter OTP"
                      style={{ width: '100%', padding: '10px', marginBottom: '15px', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '2px' }}
                    />
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                      <button onClick={handleVerifyEmailChange} className="btn btn-primary">Confirm</button>
                      <button onClick={() => setShowOtpModal(false)} className="btn btn-outline">Close</button>
                    </div>
                  </div>
                </div>
              )}
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
