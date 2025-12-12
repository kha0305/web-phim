import React from 'react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Navbar from '../components/Navbar';
import { useLanguage } from '../context/LanguageContext';

const TermsOfService = () => {
    const { language } = useLanguage();
    useDocumentTitle(`${language === 'vi' ? 'Điều Khoản Dịch Vụ' : 'Terms of Service'} - PhimChill`);

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
            title: "Terms of Service",
            lastUpdated: "Last updated: December 12, 2025",
            intro: (
                <>
                    Welcome to <strong>PhimChill</strong>. By accessing or using our website, you agree to be bound by these Terms of Service. 
                    If you do not agree with any part of these terms, you may not access the service.
                </>
            ),
            section1: "1. Use of Service",
            section1_content: "You agree to use the service only for lawful purposes and in accordance with these Terms. You must not use the site in any way that causes, or may cause, damage to the website or impairment of the availability or accessibility of the website.",
            section2: "2. Intellectual Property",
            section2_content: "The content, organization, graphics, design, compilation, magnetic translation, digital conversion and other matters related to the Site are protected under applicable copyrights, trademarks and other proprietary (including but not limited to intellectual property) rights.",
            section3: "3. User Accounts",
            section3_content: "If you create an account on the Website, you are responsible for maintaining the security of your account and you are fully responsible for all activities that occur under the account and any other actions taken in connection with it.",
            section4: "4. Disclaimer",
            section4_content: "The materials on PhimChill's website are provided on an 'as is' basis. PhimChill makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.",
            contact: "Contact Us",
            contact_intro: "If you have any questions about these Terms, please contact us at:",
            admin: "PhimChill Administration Team"
        },
        vi: {
            title: "Điều Khoản Dịch Vụ",
            lastUpdated: "Cập nhật lần cuối: 12/12/2025",
            intro: (
                <>
                    Chào mừng bạn đến với <strong>PhimChill</strong>. Bằng cách truy cập hoặc sử dụng trang web của chúng tôi, bạn đồng ý tuân thủ các Điều Khoản Dịch Vụ này. 
                    Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản này, bạn không được phép truy cập dịch vụ.
                </>
            ),
            section1: "1. Sử Dụng Dịch Vụ",
            section1_content: "Bạn đồng ý chỉ sử dụng dịch vụ cho các mục đích hợp pháp và tuân theo các Điều Khoản này. Bạn không được sử dụng trang web theo bất kỳ cách nào gây ra, hoặc có thể gây ra, thiệt hại cho trang web hoặc làm suy giảm khả năng cung cấp hoặc truy cập của trang web.",
            section2: "2. Sở Hữu Trí Tuệ",
            section2_content: "Nội dung, tổ chức, đồ họa, thiết kế, biên soạn, dịch từ tính, chuyển đổi kỹ thuật số và các vấn đề khác liên quan đến Trang web được bảo vệ theo các quyền bản quyền, thương hiệu và các quyền sở hữu khác (bao gồm nhưng không giới hạn ở sở hữu trí tuệ) hiện hành.",
            section3: "3. Tài Khoản Người Dùng",
            section3_content: "Nếu bạn tạo tài khoản trên Trang web, bạn chịu trách nhiệm duy trì bảo mật cho tài khoản của mình và bạn hoàn toàn chịu trách nhiệm cho tất cả các hoạt động diễn ra dưới tài khoản đó và bất kỳ hành động nào khác được thực hiện liên quan đến nó.",
            section4: "4. Từ Chối Trách Nhiệm",
            section4_content: "Các tài liệu trên trang web của PhimChill được cung cấp trên cơ sở 'nguyên trạng'. PhimChill không đưa ra bảo đảm nào, dù rõ ràng hay ngụ ý, và theo đây từ chối và phủ nhận tất cả các bảo đảm khác bao gồm, không giới hạn, các bảo đảm ngụ ý hoặc điều kiện về khả năng bán được, sự phù hợp cho một mục đích cụ thể, hoặc không vi phạm quyền sở hữu trí tuệ hoặc vi phạm quyền khác.",
            contact: "Liên Hệ",
            contact_intro: "Nếu bạn có bất kỳ câu hỏi nào về các Điều Khoản này, vui lòng liên hệ với chúng tôi tại:",
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
                <p style={styles.p}>{t.section1_content}</p>

                <h2 style={styles.h2}>{t.section2}</h2>
                <p style={styles.p}>{t.section2_content}</p>

                <h2 style={styles.h2}>{t.section3}</h2>
                <p style={styles.p}>{t.section3_content}</p>

                <h2 style={styles.h2}>{t.section4}</h2>
                <p style={styles.p}>{t.section4_content}</p>

                <h2 style={styles.h2}>{t.contact}</h2>
                <p style={styles.p}>
                    {t.contact_intro} 
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

export default TermsOfService;
