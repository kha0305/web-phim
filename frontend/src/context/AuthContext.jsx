import React, { createContext, useState, useContext, useEffect } from 'react';

import axios from '../api/axios';
import Toast from '../components/Toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState(localStorage.getItem('token'));

  const [favorites, setFavorites] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (user && token) {
        try {
          const response = await axios.get(`/watchlist/${user.id}`);
          // Assuming response.data is array of movies with slug/id
          setFavorites(response.data.map(m => m.slug || m._id || m.id));
        } catch (error) {
          console.error("Failed to fetch favorites:", error);
        }
      } else {
        setFavorites([]);
      }
    };

    fetchFavorites();
  }, [user, token]);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setFavorites([]);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    notify("Đã đăng xuất thành công", "success");
  };

  const updateUser = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const notify = (message, type = 'info') => {
    setToast({ message, type });
  };

  const toggleFavorite = async (movieId) => {
    if (!user) {
      notify("Vui lòng đăng nhập để sử dụng tính năng này", "error");
      return;
    }

    try {
      if (favorites.includes(movieId)) {
        await axios.delete(`/watchlist/${movieId}`);
        setFavorites(prev => prev.filter(id => id !== movieId));
        notify("Đã xóa khỏi danh sách yêu thích", "success");
      } else {
        await axios.post('/watchlist', { movieId });
        setFavorites(prev => [...prev, movieId]);
        notify("Đã thêm vào danh sách yêu thích", "success");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      notify("Có lỗi xảy ra, vui lòng thử lại", "error");
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, token, favorites, toggleFavorite, notify }}>
      {children}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
