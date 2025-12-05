import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await axios.post('/auth/forgot-password', { email });
      setStep(2);
      setMessage('OTP sent to your email.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await axios.post('/auth/verify-otp', { email, otp });
      setStep(3);
      setMessage('OTP verified. Please enter new password.');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await axios.post('/auth/reset-password', { email, otp, newPassword });
      setMessage('Password reset successfully. Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ marginTop: '100px', maxWidth: '400px' }}>
      <h2 style={{ marginBottom: '2rem', textAlign: 'center' }}>
        {step === 1 ? 'Forgot Password' : step === 2 ? 'Verify OTP' : 'Reset Password'}
      </h2>
      
      {message && <div style={{ color: '#4caf50', marginBottom: '1rem', textAlign: 'center' }}>{message}</div>}
      {error && <div style={{ color: '#e50914', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

      {step === 1 && (
        <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ color: '#aaa', textAlign: 'center', fontSize: '0.9rem' }}>
            Enter your email address to receive a verification code.
          </p>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="search-input"
            style={{ width: '100%' }}
            required
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
           <p style={{ color: '#aaa', textAlign: 'center', fontSize: '0.9rem' }}>
            Enter the 6-digit code sent to {email}
          </p>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="search-input"
            style={{ width: '100%', textAlign: 'center', letterSpacing: '5px', fontSize: '1.2rem' }}
            required
            maxLength={6}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
          <button 
            type="button" 
            className="btn btn-outline" 
            onClick={() => setStep(1)}
            disabled={loading}
          >
            Back
          </button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="search-input"
            style={{ width: '100%' }}
            required
            minLength={6}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}

      <p style={{ marginTop: '1.5rem', textAlign: 'center', color: '#aaa' }}>
        <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>Back to Login</Link>
      </p>
    </div>
  );
};

export default ForgotPassword;
