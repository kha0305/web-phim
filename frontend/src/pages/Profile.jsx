import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import './ProfileNew.css'; // Import new CSS

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('info'); // 'info' or 'password'
  
  // Info State
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('other');
  const [previewUrl, setPreviewUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setDisplayName(user.username || '');
      setEmail(user.email || '');
      setGender(user.gender || 'other');
      setPreviewUrl(user.avatar || '');
    } else {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpdateInfo = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('username', displayName);
      formData.append('gender', gender);
      if (selectedFile) {
        formData.append('avatar', selectedFile);
      }

      const response = await axios.put('/user/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        updateUser(response.data.user);
        setMessage('Cập nhật thông tin thành công!');
        setSelectedFile(null);
      }
    } catch (err) {
      console.error(err);
      setError('Cập nhật thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await axios.post('/user/change-password', {
        currentPassword,
        newPassword
      });

      if (response.data.success) {
        setMessage('Đổi mật khẩu thành công!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Đổi mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="profile-page-container">
      <div className="profile-card-wrapper">
        {/* Header */}
        <div className="profile-header">
          <h2>
            Quản lý tài khoản
          </h2>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <div 
            className={`profile-tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            Thông tin
          </div>
          <div 
            className={`profile-tab ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            Mật khẩu
          </div>
        </div>

        {/* Body */}
        <div className="profile-content-body">
          {message && <div style={{ color: '#4caf50', marginBottom: '1rem' }}>{message}</div>}
          {error && <div style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</div>}

          {activeTab === 'info' && (
            <div>
              <h3 className="section-title">Cập nhật thông tin tài khoản</h3>
              <div className="profile-form-grid">
                {/* Left Column */}
                <div className="form-column-left">
                  <div className="form-group">
                    <label>Tên hiển thị</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Email</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      value={email}
                      disabled // Email change is handled separately or not allowed here directly
                      style={{ opacity: 0.7 }}
                    />
                    {/* Optional: Add link to change email if needed */}
                  </div>

                  <div className="form-group">
                    <label>Giới tính</label>
                    <div className="gender-options">
                      <label className="gender-option">
                        <input 
                          type="radio" 
                          name="gender" 
                          value="male"
                          checked={gender === 'male'}
                          onChange={(e) => setGender(e.target.value)}
                          className="gender-radio"
                        />
                        Nam
                      </label>
                      <label className="gender-option">
                        <input 
                          type="radio" 
                          name="gender" 
                          value="female"
                          checked={gender === 'female'}
                          onChange={(e) => setGender(e.target.value)}
                          className="gender-radio"
                        />
                        Nữ
                      </label>
                      <label className="gender-option">
                        <input 
                          type="radio" 
                          name="gender" 
                          value="other"
                          checked={gender === 'other'}
                          onChange={(e) => setGender(e.target.value)}
                          className="gender-radio"
                        />
                        Không xác định
                      </label>
                    </div>
                  </div>

                  <button className="btn-yellow" onClick={handleUpdateInfo} disabled={loading}>
                    {loading ? 'Đang cập nhật...' : 'Cập nhật'}
                  </button>
                </div>

                {/* Right Column (Avatar) */}
                <div className="avatar-section">
                  <div className="avatar-preview">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Avatar" onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = `https://ui-avatars.com/api/?name=${user.username}&background=random`;
                      }} />
                    ) : (
                      <div className="avatar-placeholder">
                        {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                  </div>
                  
                  <label className="upload-btn">
                    <span>⬆️</span> Tải lên
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange}
                      style={{ display: 'none' }} 
                    />
                  </label>
                  
                  <button className="available-btn">
                    📷 Ảnh có sẵn
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <div>
              <h3 className="section-title">Thay đổi mật khẩu tài khoản</h3>
              <div className="password-grid">
                <div className="form-column-left">
                  <div className="form-group">
                    <label>Mật khẩu hiện tại</label>
                    <input 
                      type="password" 
                      className="form-input" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Mật khẩu mới</label>
                    <input 
                      type="password" 
                      className="form-input" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Xác nhận mật khẩu</label>
                    <input 
                      type="password" 
                      className="form-input" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  
                  <button className="btn-yellow" onClick={handleChangePassword} disabled={loading}>
                    {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                  </button>
                </div>

                <div className="password-requirements">
                  <ul>
                    <li>Sử dụng tối thiểu 6 ký tự và tối đa 30 ký tự</li>
                    <li>Bao gồm số, chữ thường, chữ in hoa và ký tự đặc biệt</li>
                    <li>Không được chứa khoảng trắng</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
