import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Comments = ({ movieId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    fetchComments();
  }, [movieId]);

  const fetchComments = async () => {
    try {
      const response = await axios.get(`/comments/${movieId}`);
      setComments(response.data);
    } catch (error) {
      console.error("Failed to fetch comments", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const response = await axios.post('/comments', {
        movieId,
        content: newComment
      });
      setComments([response.data, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error("Failed to post comment", error);
      alert("Lỗi khi đăng bình luận");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="comments-section" style={{ marginTop: '2rem', padding: '1rem', background: '#1a1a1a', borderRadius: '8px' }}>
      <h3 style={{ marginBottom: '1rem', color: '#e50914' }}>{t('comments') || 'Bình luận'}</h3>
      
      {/* Comment Form */}
      {user ? (
        <form onSubmit={handleSubmit} style={{ marginBottom: '2rem', display: 'flex', gap: '10px' }}>
          <img 
             src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=random`} 
             alt="User" 
             style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <div style={{ flex: 1 }}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Viết bình luận của bạn..."
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #333',
                background: '#0f0f0f',
                color: 'white',
                minHeight: '80px',
                resize: 'vertical'
              }}
            />
            <button 
              type="submit" 
              disabled={submitting || !newComment.trim()}
              className="btn btn-primary"
              style={{ marginTop: '10px', padding: '8px 16px', fontSize: '0.9rem' }}
            >
              {submitting ? 'Đang gửi...' : 'Gửi bình luận'}
            </button>
          </div>
        </form>
      ) : (
        <div style={{ padding: '1rem', textAlign: 'center', background: '#0f0f0f', borderRadius: '8px', marginBottom: '2rem', color: '#aaa' }}>
          Vui lòng <a href="/login" style={{ color: '#e50914' }}>đăng nhập</a> để bình luận.
        </div>
      )}

      {/* Comment List */}
      <div className="comments-list">
        {comments.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>Chưa có bình luận nào.</p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="comment-item" style={{ display: 'flex', gap: '12px', marginBottom: '1.5rem', borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
              <div style={{ flexShrink: 0 }}>
                <img 
                  src={comment.User?.avatar || `https://ui-avatars.com/api/?name=${comment.User?.username || 'User'}&background=random`} 
                  alt={comment.User?.username} 
                  style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 'bold', color: '#ddd' }}>{comment.User?.username || 'Người dùng ẩn danh'}</span>
                  <span style={{ fontSize: '0.8rem', color: '#666' }}>
                    {new Date(comment.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <p style={{ color: '#bbb', lineHeight: '1.4' }}>{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Comments;
