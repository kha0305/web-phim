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
  
  // Mock Data for Charts
  const chartData = [
    { name: 'Mon', views: 4000, users: 2400 },
    { name: 'Tue', views: 3000, users: 1398 },
    { name: 'Wed', views: 2000, users: 9800 },
    { name: 'Thu', views: 2780, users: 3908 },
    { name: 'Fri', views: 1890, users: 4800 },
    { name: 'Sat', views: 2390, users: 3800 },
    { name: 'Sun', views: 3490, users: 4300 },
  ];
  
  // Notification Form
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState('');


  const [activeTab, setActiveTab] = useState('overview');

  // Mock Data
  const movies = [
      { id: '1', title: 'The Matrix Access', views: 4500, quality: '4K', status: 'Active' },
      { id: '2', title: 'Inception Dream', views: 3200, quality: 'HD', status: 'Active' },
      { id: '3', title: 'Interstellar Space', views: 8900, quality: '4K', status: 'Featured' },
      { id: '4', title: 'Dark Knight Rises', views: 1200, quality: 'FHD', status: 'Hidden' },
  ];

  const users = [
      { id: '1', name: 'Nguyen Van A', email: 'vana@gmail.com', role: 'User', status: 'Active' },
      { id: '2', name: 'Tran Thi B', email: 'thib@gmail.com', role: 'VIP', status: 'Active' },
      { id: '3', name: 'Le Van C', email: 'vanc@gmail.com', role: 'User', status: 'Banned' },
  ];

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
                          <h3>Movies Management</h3>
                          <button className="btn-text" style={{padding: '6px 12px', fontSize: '0.8rem'}}>+ Add Movie</button>
                      </div>
                      <table className="admin-table">
                          <thead>
                              <tr>
                                  <th>ID</th>
                                  <th>Title</th>
                                  <th>Quality</th>
                                  <th>Views</th>
                                  <th>Status</th>
                                  <th>Actions</th>
                              </tr>
                          </thead>
                          <tbody>
                              {movies.map(movie => (
                                  <tr key={movie.id}>
                                      <td>#{movie.id}</td>
                                      <td style={{fontWeight: '500', color: '#fff'}}>{movie.title}</td>
                                      <td><span className="quality-badge" style={{fontSize: '0.75rem'}}>{movie.quality}</span></td>
                                      <td>{movie.views.toLocaleString()}</td>
                                      <td><span className={`status-badge ${movie.status === 'Active' || movie.status === 'Featured' ? 'status-active' : 'status-banned'}`}>{movie.status}</span></td>
                                      <td>
                                          <button className="action-btn">Edit</button>
                                          <button className="action-btn delete">Delete</button>
                                      </td>
                                  </tr>
                              ))}
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
                                  <th>ID</th>
                                  <th>User</th>
                                  <th>Email</th>
                                  <th>Role</th>
                                  <th>Status</th>
                                  <th>Actions</th>
                              </tr>
                          </thead>
                          <tbody>
                              {users.map(u => (
                                  <tr key={u.id}>
                                      <td>#{u.id}</td>
                                      <td style={{fontWeight: '500', color: '#fff'}}>{u.name}</td>
                                      <td>{u.email}</td>
                                      <td>{u.role}</td>
                                      <td><span className={`status-badge ${u.status === 'Active' ? 'status-active' : 'status-banned'}`}>{u.status}</span></td>
                                      <td>
                                          <button className="action-btn">View</button>
                                          <button className="action-btn delete">{u.status === 'Banned' ? 'Unban' : 'Ban'}</button>
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
                        <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
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
                  <div className="avatar-circle">{user?.username?.charAt(0).toUpperCase()}</div>
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
