import React from 'react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Navbar from '../components/Navbar';
import { useLanguage } from '../context/LanguageContext';

const PrivacyPolicy = () => {
    const { language } = useLanguage();
    useDocumentTitle(`${language === 'vi' ? 'Chính Sách Quyền Riêng Tư' : 'Privacy Policy'} - PhimChill`);

    const styles = {
        container: {
            padding: '2rem',
            color: '#fff',
            maxWidth: '800px',
            margin: '80px auto 0', // Account for navbar
            lineHeight: '1.6',
            backgroundColor: '#1a1a1a', 
            borderRadius: '8px'
        },
        h1: { fontSize: '2rem', marginBottom: '1.5rem', color: '#e50914' },
        h2: { fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: '#f5f5f5' },
        p: { marginBottom: '1rem', color: '#ccc' },
        ul: { marginBottom: '1rem', paddingLeft: '20px', color: '#ccc' },
        li: { marginBottom: '0.5rem' },
        contact: { fontStyle: 'italic', marginTop: '2rem', borderTop: '1px solid #333', paddingTop: '1rem' }
    };

    const content = {
        en: {
            title: "Privacy Policy",
            lastUpdated: "Last updated: December 12, 2025",
            intro: (
                <>
                    Welcome to <strong>PhimChill</strong>. We respect your privacy and are committed to protecting your personal data. 
                    This privacy policy will inform you as to how we look after your personal data when you visit our website 
                    and tell you about your privacy rights and how the law protects you.
                </>
            ),
            section1: "1. Information We Collect",
            section1_intro: "We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:",
            section1_list: [
                <React.Fragment key="1"><strong>Identity Data:</strong> includes username, or similar identifier, and social media profile information (if you login via Facebook/Google).</React.Fragment>,
                <React.Fragment key="2"><strong>Contact Data:</strong> includes email address.</React.Fragment>,
                <React.Fragment key="3"><strong>Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version.</React.Fragment>,
                <React.Fragment key="4"><strong>Usage Data:</strong> includes information about how you use our website, such as watch history and favorites.</React.Fragment>
            ],
            section2: "2. How We Use Your Data",
            section2_intro: "We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:",
            section2_list: [
                "To register you as a new customer.",
                "To provide customized movie recommendations.",
                "To manage our relationship with you (e.g., providing notifications).",
                "To improve our website, products/services, marketing and customer relationships."
            ],
            section3: "3. Facebook Data Deletion Instructions",
            section3_intro: "According to Facebook policy, we have to provide User Data Deletion Callback URL or Data Deletion Instructions URL. If you want to delete your data from our App, you can remove your information by following these steps:",
            section3_steps: [
                'Go to your Facebook Account\'s Setting & Privacy. Click "Settings".',
                'Look for "Apps and Websites" and you will see all of the apps and websites you linked with your Facebook.',
                'Search and Click "PhimChill" in the search bar.',
                'Scroll and click "Remove".',
                'Congratulations, you have successfully removed your app activities.'
            ],
            section4: "4. Contact Us",
            section4_intro: "If you have any questions about this privacy policy or our privacy practices, please contact us at:",
            admin: "PhimChill Administration Team"
        },
        vi: {
            title: "Chính Sách Quyền Riêng Tư",
            lastUpdated: "Cập nhật lần cuối: 12/12/2025",
            intro: (
                <>
                    Chào mừng bạn đến với <strong>PhimChill</strong>. Chúng tôi tôn trọng quyền riêng tư và cam kết bảo vệ dữ liệu cá nhân của bạn. 
                    Chính sách này sẽ thông báo cho bạn về cách chúng tôi quản lý dữ liệu cá nhân khi bạn truy cập trang web, 
                    cũng như quyền riêng tư của bạn và cách luật pháp bảo vệ bạn.
                </>
            ),
            section1: "1. Thông Tin Chúng Tôi Thu Thập",
            section1_intro: "Chúng tôi có thể thu thập, sử dụng, lưu trữ và chuyển giao các loại dữ liệu cá nhân khác nhau về bạn, bao gồm:",
            section1_list: [
                <React.Fragment key="1"><strong>Dữ liệu Định danh:</strong> bao gồm tên đăng nhập, hoặc định danh tương tự, và thông tin hồ sơ mạng xã hội (nếu bạn đăng nhập qua Facebook/Google).</React.Fragment>,
                <React.Fragment key="2"><strong>Dữ liệu Liên hệ:</strong> bao gồm địa chỉ email.</React.Fragment>,
                <React.Fragment key="3"><strong>Dữ liệu Kỹ thuật:</strong> bao gồm địa chỉ IP, dữ liệu đăng nhập, loại trình duyệt và phiên bản.</React.Fragment>,
                <React.Fragment key="4"><strong>Dữ liệu Sử dụng:</strong> bao gồm thông tin về cách bạn sử dụng trang web, như lịch sử xem và danh sách yêu thích.</React.Fragment>
            ],
            section2: "2. Cách Chúng Tôi Sử Dụng Dữ Liệu",
            section2_intro: "Chúng tôi chỉ sử dụng dữ liệu cá nhân của bạn khi luật pháp cho phép. Phổ biến nhất là trong các trường hợp sau:",
            section2_list: [
                "Để đăng ký bạn là thành viên mới.",
                "Để cung cấp gợi ý phim phù hợp với sở thích.",
                "Để quản lý mối quan hệ với bạn (ví dụ: gửi thông báo).",
                "Để cải thiện trang web, sản phẩm/dịch vụ, tiếp thị và trải nghiệm khách hàng."
            ],
            section3: "3. Hướng Dẫn Xóa Dữ Liệu Facebook",
            section3_intro: "Theo chính sách của Facebook, chúng tôi phải cung cấp URL Hướng dẫn Xóa dữ liệu. Nếu bạn muốn xóa dữ liệu của mình khỏi Ứng dụng của chúng tôi, bạn có thể thực hiện theo các bước sau:",
            section3_steps: [
                'Truy cập Cài đặt & Quyền riêng tư của tài khoản Facebook. Nhấn "Cài đặt".',
                'Tìm mục "Ứng dụng và Trang web", bạn sẽ thấy các ứng dụng đã liên kết với Facebook của mình.',
                'Tìm kiếm và nhấn vào "PhimChill" ("web-movie").',
                'Kéo xuống và nhấn "Gỡ" (Remove).',
                'Chúc mừng, bạn đã gỡ bỏ thành công hoạt động ứng dụng của mình.'
            ],
            section4: "4. Liên Hệ",
            section4_intro: "Nếu bạn có bất kỳ câu hỏi nào về chính sách quyền riêng tư này, vui lòng liên hệ với chúng tôi tại:",
            admin: "Ban Quản Trị PhimChill"
        }
    };

    const t = content[language] || content.en;

    return (
        <>
            <Navbar />
            <div style={styles.container}>
                <h1 style={styles.h1}>{t.title}</h1>
                <p style={styles.p}>{t.lastUpdated}</p>

                <p style={styles.p}>
                    {t.intro}
                </p>

                <h2 style={styles.h2}>{t.section1}</h2>
                <p style={styles.p}>{t.section1_intro}</p>
                <ul style={styles.ul}>
                    {t.section1_list.map((item, index) => (
                        <li key={index} style={styles.li}>{item}</li>
                    ))}
                </ul>

                <h2 style={styles.h2}>{t.section2}</h2>
                <p style={styles.p}>{t.section2_intro}</p>
                <ul style={styles.ul}>
                    {t.section2_list.map((item, index) => (
                        <li key={index} style={styles.li}>{item}</li>
                    ))}
                </ul>

                <h2 style={styles.h2}>{t.section3}</h2>
                <p style={styles.p}>
                    {t.section3_intro}
                </p>
                <ol style={{...styles.ul, paddingLeft: '20px'}}>
                    {t.section3_steps.map((item, index) => (
                        <li key={index} style={styles.li}>{item}</li>
                    ))}
                </ol>

                <h2 style={styles.h2}>{t.section4}</h2>
                <p style={styles.p}>
                    {t.section4_intro} 
                    <br />
                    Email: support@phimchill.com
                </p>
                
                <div style={styles.contact}>
                    <p style={{margin:0}}>{t.admin}</p>
                </div>
            </div>
        </>
    );
};

export default PrivacyPolicy;
