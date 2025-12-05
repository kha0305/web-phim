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
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        <input
          type="password"
          placeholder={t('password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="search-input"
          style={{ width: '100%' }}
          required
        />
        <button type="submit" className="btn btn-primary">{t('register_button')}</button>
      </form>
      <p style={{ marginTop: '1rem', textAlign: 'center', color: '#aaa' }}>
        {t('already_have_account')} <Link to="/login" style={{ color: '#e50914' }}>{t('login')}</Link>
      </p>
    </div>
  );
};

export default Register;
