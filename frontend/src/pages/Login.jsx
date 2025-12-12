import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';
import { useLanguage } from '../context/LanguageContext';
import { GoogleLogin } from '@react-oauth/google';
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props';

import useDocumentTitle from '../hooks/useDocumentTitle';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false); // Add agreed state
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  useDocumentTitle(`${t('login')} - PhimChill`);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate agreement
    if (!agreed) {
      setError(t('agree_terms_error') || 'Bạn phải đồng ý với Điều Khoản và Chính Sách.');
      return;
    }

    try {
      const response = await axios.post('/auth/login', { username, password });
      login(response.data.user, response.data.token);
      navigate('/');
    } catch (error) {
      console.error("Login error:", error);
      setError('Invalid credentials');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
      // For social login, we might skip this or enforce it too. 
      // The user asked for "login must tick", so enforcing it here too is safer, 
      // BUT Google button handles its own click. 
      // Usually social login implies agreement. 
      // However, if the user insists on ticking for login, I should probably block the social actions too if not agreed.
      
      if (!agreed) {
        setError(t('agree_terms_error') || 'Bạn phải đồng ý với Điều Khoản và Chính Sách.');
        return;
      }

      try {
          const res = await axios.post('/auth/google', { token: credentialResponse.credential });
          login(res.data.user, res.data.token);
          navigate('/');
      } catch (error) {
          console.error("Google Login Failed", error);
          setError('Google Login Failed');
      }
  };

  const responseFacebook = async (response) => {
    if (!agreed) {
        setError(t('agree_terms_error') || 'Bạn phải đồng ý với Điều Khoản và Chính Sách.');
        return;
    }

    if (response.accessToken) {
        try {
            const res = await axios.post('/auth/facebook', { 
                accessToken: response.accessToken, 
                userID: response.userID 
            });
            login(res.data.user, res.data.token);
            navigate('/');
        } catch (error) {
            console.error("Facebook Login Failed", error);
            setError('Facebook Login Failed');
        }
    }
  };

  return (
    <div className="container" style={{ marginTop: '100px', maxWidth: '400px' }}>
      <h2 style={{ marginBottom: '2rem', textAlign: 'center' }}>{t('login')}</h2>
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input
          type="text"
          placeholder={t('username')}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="search-input"
          style={{ width: '100%' }}
        />
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder={t('password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="search-input"
            style={{ width: '100%', paddingRight: '40px' }}
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

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <input 
            type="checkbox" 
            id="agree_terms" 
            checked={agreed} 
            onChange={(e) => setAgreed(e.target.checked)} 
            style={{ marginTop: '5px' }}
          />
          <label htmlFor="agree_terms" style={{ color: '#ccc', fontSize: '0.9rem', lineHeight: '1.4' }}>
            <span dangerouslySetInnerHTML={{ __html: t('agree_terms')?.replace('Điều Khoản Dịch Vụ', '<a href="/terms-of-service" target="_blank" style="color: #e50914">Điều Khoản Dịch Vụ</a>').replace('Chính Sách Quyền Riêng Tư', '<a href="/privacy-policy" target="_blank" style="color: #e50914">Chính Sách Quyền Riêng Tư</a>').replace('Terms of Service', '<a href="/terms-of-service" target="_blank" style="color: #e50914">Terms of Service</a>').replace('Privacy Policy', '<a href="/privacy-policy" target="_blank" style="color: #e50914">Privacy Policy</a>') }}></span>
          </label>
        </div>

        <button type="submit" className="btn btn-primary" disabled={!agreed} style={{ opacity: agreed ? 1 : 0.5 }}>{t('login_button')}</button>
      </form>
      
      <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
        <div style={{ flex: 1, height: '1px', background: '#333' }}></div>
        <span style={{ padding: '0 10px', color: '#666' }}>OR</span>
        <div style={{ flex: 1, height: '1px', background: '#333' }}></div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', opacity: agreed ? 1 : 0.5, pointerEvents: agreed ? 'auto' : 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Login Failed')}
                theme="filled_black"
                shape="pill"
            />
          </div>

          <FacebookLogin
            appId="747959397676893"
            autoLoad={false}
            fields="name,email,picture"
            callback={responseFacebook}
            render={renderProps => (
              <button onClick={renderProps.onClick} style={{
                  backgroundColor: '#1877f2', color: 'white', padding: '10px', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold'
              }}>
                Login with Facebook
              </button>
            )}
          />
      </div>

      <p style={{ marginTop: '1rem', textAlign: 'center', color: '#aaa' }}>
        <Link to="/forgot-password" style={{ color: '#aaa', fontSize: '0.9rem' }}>Forgot Password?</Link>
      </p>
      <p style={{ marginTop: '0.5rem', textAlign: 'center', color: '#aaa' }}>
        {t('dont_have_account')} <Link to="/register" style={{ color: '#e50914' }}>{t('register')}</Link>
      </p>
    </div>
  );
};

export default Login;
