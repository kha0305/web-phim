import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';


import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Mock Data Removed
  
  // Notification Form
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState('');


  const [activeTab, setActiveTab] = useState('overview');
  const [movies, setMovies] = useState([]);
  const [usersList, setUsersList] = useState([]);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
    }
    fetchStats();
    if (activeTab === 'movies') fetchMovies();
    if (activeTab === 'users') fetchUsers();
  }, [user, navigate, activeTab]);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/admin/stats');
      setStats(response.data);
    } catch {
      // console.error("Failed to fetch admin stats");
    } finally {
      setLoading(false);
    }
  };

  const fetchMovies = async () => {
      try {
          const res = await axios.get('/admin/movies');
          setMovies(res.data);
      } catch (err) {
          console.error("Failed to fetch movies", err);
      }
  }

  const fetchUsers = async () => {
      try {
          const res = await axios.get('/admin/users');
          setUsersList(res.data);
      } catch (err) {
          console.error("Failed to fetch users", err);
      }
  }

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

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label" style={{ color: '#888', marginBottom: '5px' }}>{`${label}`}</p>
          <p className="intro" style={{ color: '#fff', margin: 0 }}>{`Views: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  const renderContent = () => {
      switch(activeTab) {
          case 'movies':
              return (
                  <div className="dashboard-card">
                      <div className="card-header">
                          <h3>Movies Management (Top Viewed)</h3>
                      </div>
                      <table className="admin-table">
                          <thead>
                              <tr>
                                  <th>Movie ID</th>
                                  <th>Movie Name</th>
                                  <th>Year</th>
                                  <th>Views</th>
                                  <th>Actions</th>
                              </tr>
                          </thead>
                          <tbody>
                              {movies.map(movie => (
                                  <tr key={movie.id}>
                                      <td style={{fontWeight: '500', color: '#fff', fontSize:'0.85rem'}}>{movie.movieId}</td>
                                      <td>
                                          <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                              {movie.poster_url && <img src={movie.poster_url} alt="" style={{width:'30px', height:'45px', objectFit:'cover', borderRadius:'4px'}} />}
                                              <span style={{color: '#e0e0e0', fontWeight:'500'}}>{movie.name || 'Loading...'}</span>
                                          </div>
                                      </td>
                                      <td>{movie.year}</td>
                                      <td>{movie.count?.toLocaleString()}</td>
                                      <td>
                                          <button className="action-btn">View</button>
                                      </td>
                                  </tr>
                              ))}
                              {movies.length === 0 && <tr><td colSpan="5" style={{textAlign:'center'}}>No data available</td></tr>}
                          </tbody>
                      </table>
                  </div>
              );
          case 'users':
               return (
                  <div className="dashboard-card">
                      <div className="card-header">
                          <h3>User Management</h3>
                      </div>
                      <table className="admin-table">
                          <thead>
                              <tr>
                                  <th>User</th>
                                  <th>Email</th>
                                  <th>Role</th>
                                  <th>Joined</th>
                                  <th>Actions</th>
                              </tr>
                          </thead>
                          <tbody>
                              {usersList.map(u => (
                                  <tr key={u.id}>
                                      <td style={{fontWeight: '500', color: '#fff'}}>
                                          <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                              {u.avatar ? 
                                                <img src={u.avatar} alt="avt" style={{width:'24px', height:'24px', borderRadius:'50%', objectFit:'cover'}} /> 
                                                : <div className="avatar-circle" style={{width:'24px', height:'24px', fontSize:'0.7rem'}}>{u.username?.charAt(0).toUpperCase()}</div>
                                              }
                                              {u.username}
                                          </div>
                                      </td>
                                      <td>{u.email}</td>
                                      <td>{u.role}</td>
                                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                                      <td>
                                          <button className="action-btn delete">Ban</button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              );
          case 'settings':
              return (
                  <div className="dashboard-card" style={{maxWidth: '600px'}}>
                       <div className="card-header">
                          <h3>General Settings</h3>
                      </div>
                      <div style={{padding: '2rem'}}>
                          <div className="form-group">
                              <label>Site Name</label>
                              <input type="text" className="form-input" defaultValue="WebPhim Project" />
                          </div>
                          <div className="form-group">
                              <label>Maintenance Mode</label>
                              <select className="form-input">
                                  <option value="off">Off</option>
                                  <option value="on">On</option>
                              </select>
                          </div>
                           <div className="form-actions">
                              <button className="btn-text">Save Changes</button>
                          </div>
                      </div>
                  </div>
              )
          default: // Overview
              return (
                <>
                {/* Stats Grid */}
                <div className="stats-grid">
                  <div className="stat-card">
                      <div className="stat-info">
                        <h3>Total Registered Users</h3>
                        <p className="stat-value">{stats?.userCount}</p>
                        <div className="stat-sub">
                            <span className="text-success">+12%</span> vs last week
                        </div>
                      </div>
                  </div>
                  <div className="stat-card">
                       <div className="stat-info">
                        <h3>Total Comments</h3>
                        <p className="stat-value">{stats?.commentCount}</p>
                         <div className="stat-sub">
                            <span className="text-neutral">Stable</span>
                        </div>
                      </div>
                  </div>
                  <div className="stat-card">
                       <div className="stat-info">
                        <h3>Total Page Views</h3>
                        <p className="stat-value">{stats?.viewCount}</p>
                         <div className="stat-sub">
                            <span className="text-success">+5%</span> vs yesterday
                         </div>
                      </div>
                  </div>
                </div>
                
                {/* Analytics Chart Section */}
                <div className="dashboard-card chart-card">
                    <div className="card-header no-border">
                        <h3>Traffic Overview (Last 7 Days)</h3>
                    </div>
                    <div style={{ width: '100%', height: 300, padding: '0 20px 20px 0' }}>
                        <ResponsiveContainer>
                        <AreaChart data={stats?.chartData || []} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#e50914" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#e50914" stopOpacity={0}/>
                            </linearGradient>
                            </defs>
                            <XAxis dataKey="name" stroke="#444" tick={{fill: '#666'}} tickLine={false} axisLine={false} />
                            <YAxis stroke="#444" tick={{fill: '#666'}} tickLine={false} axisLine={false} />
                            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="views" stroke="#e50914" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" />
                        </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
        
                <div className="dashboard-content-layout">
                    {/* Left Column: Notifications */}
                    <div className="content-left">
                        <div className="dashboard-card notification-card">
                            <div className="card-header no-border">
                                <h3>SYSTEM BROADCAST</h3>
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
                                <div className="form-actions">
                                     <button className="btn-text" disabled={sending}>
                                        {sending ? 'SENDING...' : 'SEND NOTIFICATION'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
        
                    {/* Right Column: Top Content */}
                    <div className="content-right">
                        {stats?.topViews && stats.topViews.length > 0 && (
                        <div className="dashboard-card top-views-card">
                            <div className="card-header">
                                <h3>TOP TRENDING MOVIES</h3>
                                <button className="btn-link">View Report</button>
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
                </>
              );
      }
  };

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <div className="admin-header-nav">
        <div className="admin-container-inner">
           <div className="header-top">
              <div className="brand-section">
                 <div className="brand-name">baokha / <span className="text-white">WebPhim Project</span></div>
              </div>
              <div className="user-section">
                  {user?.avatar ? 
                    <img src={user.avatar} alt="admin" style={{width:'32px', height:'32px', borderRadius:'50%', objectFit:'cover', border: '1px solid #333'}} /> 
                    : <div className="avatar-circle">{user?.username?.charAt(0).toUpperCase()}</div>
                  }
              </div>
           </div>
           
           <div className="header-tabs">
              <div className={`tab-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</div>
              <div className={`tab-item ${activeTab === 'movies' ? 'active' : ''}`} onClick={() => setActiveTab('movies')}>Movies</div>
              <div className={`tab-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Users</div>
              <div className={`tab-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>Settings</div>
           </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-main">
        <div className="admin-container-inner">
             {renderContent()}
       </div>
      </div>
    </div>
  );
};
export default AdminDashboard;
