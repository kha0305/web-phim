import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';
import { useLanguage } from '../context/LanguageContext';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8 || password.length > 20) {
      setError(t('password_length_error') || 'Mật khẩu phải từ 8 đến 20 ký tự.');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError(t('password_uppercase_error') || 'Mật khẩu phải chứa ít nhất 1 chữ hoa.');
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError(t('password_lowercase_error') || 'Mật khẩu phải chứa ít nhất 1 chữ thường.');
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError(t('password_number_error') || 'Mật khẩu phải chứa ít nhất 1 số.');
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setError(t('password_special_char_error') || 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt.');
      return;
    }
    if (/\s/.test(password)) {
      setError(t('password_whitespace_error') || 'Mật khẩu không được chứa khoảng trắng.');
      return;
    }
    try {
      const response = await axios.post('/auth/register', { username, email, password });
      login(response.data.user, response.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="container" style={{ marginTop: '100px', maxWidth: '400px' }}>
      <h2 style={{ marginBottom: '2rem', textAlign: 'center' }}>{t('register')}</h2>
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input
          type="text"
          placeholder={t('username')}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="search-input"
          style={{ width: '100%' }}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="search-input"
          style={{ width: '100%' }}
          required
        />
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder={t('password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="search-input"
            style={{ width: '100%', paddingRight: '40px' }}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#aaa',
              display: 'flex',
              alignItems: 'center'
            }}
          >
             {showPassword ? (
               <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
             ) : (
               <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 3.12 0 5.91-1.23 7.97-3.21l.47.47 3.12 3.12 1.41-1.41L3.41 2.86 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>
             )}
          </button>
        </div>
        <button type="submit" className="btn btn-primary">{t('register_button')}</button>
      </form>
      <p style={{ marginTop: '1rem', textAlign: 'center', color: '#aaa' }}>
        {t('already_have_account')} <Link to="/login" style={{ color: '#e50914' }}>{t('login')}</Link>
      </p>
    </div>
  );
};

export default Register;
