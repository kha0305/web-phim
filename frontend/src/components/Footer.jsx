import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <Link to="/" className="logo">PhimChill</Link>
            <p className="footer-text">
              Xem phim online miễn phí chất lượng cao với phụ đề tiếng Việt - thuyết minh - lồng tiếng. 
              Mọt phim có nhiều thể loại phim phong phú, đặc sắc, nhiều bộ phim hay nhất - mới nhất.
            </p>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-title">{t('categories') || 'Thể loại'}</h4>
            <div className="footer-links">
              <Link to="/?genre=hanh-dong">Hành Động</Link>
              <Link to="/?genre=tinh-cam">Tình Cảm</Link>
              <Link to="/?genre=hai-huoc">Hài Hước</Link>
              <Link to="/?genre=co-trang">Cổ Trang</Link>
              <Link to="/?genre=tam-ly">Tâm Lý</Link>
              <Link to="/?genre=hinh-su">Hình Sự</Link>
            </div>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-title">{t('help') || 'Trợ giúp'}</h4>
            <div className="footer-links">
              <Link to="/">{t('faq') || 'Hỏi đáp'}</Link>
              <Link to="/">{t('contact') || 'Liên hệ'}</Link>
              <Link to="/">{t('terms') || 'Điều khoản sử dụng'}</Link>
              <Link to="/">{t('privacy') || 'Chính sách bảo mật'}</Link>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} PhimChill. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
