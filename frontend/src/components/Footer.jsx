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
            <h4 className="footer-title">{t('categories')}</h4>
            <div className="footer-links">
              <Link to="/?genre=hanh-dong">{t('hanh-dong')}</Link>
              <Link to="/?genre=tinh-cam">{t('tinh-cam')}</Link>
              <Link to="/?genre=hai-huoc">{t('hai-huoc')}</Link>
              <Link to="/?genre=co-trang">{t('co-trang')}</Link>
              <Link to="/?genre=tam-ly">{t('tam-ly')}</Link>
              <Link to="/?genre=hinh-su">{t('hinh-su')}</Link>
            </div>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-title">{t('help')}</h4>
            <div className="footer-links">
              <Link to="/faq">{t('faq')}</Link>
              <a href="mailto:support@phimchill.com">{t('contact')}</a>
              <Link to="/terms-of-service">{t('terms')}</Link>
              <Link to="/privacy-policy">{t('privacy')}</Link>
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
