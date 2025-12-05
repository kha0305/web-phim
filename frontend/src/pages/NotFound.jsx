import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const NotFound = () => {
  const { t } = useLanguage();

  return (
    <div className="not-found-container" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <h1 style={{ fontSize: '6rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>404</h1>
      <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>{t('page_not_found') || 'Trang không tồn tại'}</h2>
      <p style={{ maxWidth: '600px', marginBottom: '2rem', color: '#aaa', fontSize: '1.2rem' }}>
        {t('page_not_found_desc') || 'Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị thay đổi đường dẫn.'}
      </p>
      <Link to="/" className="btn btn-primary" style={{ padding: '12px 30px', fontSize: '1.1rem' }}>
        {t('back_home') || 'Về Trang Chủ'}
      </Link>
    </div>
  );
};

export default NotFound;
