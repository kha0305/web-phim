import React from 'react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Navbar from '../components/Navbar';

const PrivacyPolicy = () => {
    useDocumentTitle('Privacy Policy - PhimChill');

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

    return (
        <>
            <Navbar />
            <div style={styles.container}>
                <h1 style={styles.h1}>Privacy Policy</h1>
                <p style={styles.p}>Last updated: December 12, 2025</p>

                <p style={styles.p}>
                    Welcome to <strong>PhimChill</strong>. We respect your privacy and are committed to protecting your personal data. 
                    This privacy policy will inform you as to how we look after your personal data when you visit our website 
                    and tell you about your privacy rights and how the law protects you.
                </p>

                <h2 style={styles.h2}>1. Information We Collect</h2>
                <p style={styles.p}>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:</p>
                <ul style={styles.ul}>
                    <li style={styles.li}><strong>Identity Data:</strong> includes username, or similar identifier, and social media profile information (if you login via Facebook/Google).</li>
                    <li style={styles.li}><strong>Contact Data:</strong> includes email address.</li>
                    <li style={styles.li}><strong>Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version.</li>
                    <li style={styles.li}><strong>Usage Data:</strong> includes information about how you use our website, such as watch history and favorites.</li>
                </ul>

                <h2 style={styles.h2}>2. How We Use Your Data</h2>
                <p style={styles.p}>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
                <ul style={styles.ul}>
                    <li style={styles.li}>To register you as a new customer.</li>
                    <li style={styles.li}>To provide customized movie recommendations.</li>
                    <li style={styles.li}>To manage our relationship with you (e.g., providing notifications).</li>
                    <li style={styles.li}>To improve our website, products/services, marketing and customer relationships.</li>
                </ul>

                <h2 style={styles.h2}>3. Facebook Data Deletion Instructions</h2>
                <p style={styles.p}>
                    According to Facebook policy, we have to provide User Data Deletion Callback URL or Data Deletion Instructions URL. 
                    If you want to delete your data from our App, you can remove your information by following these steps:
                </p>
                <ol style={{...styles.ul, paddingLeft: '20px'}}>
                    <li style={styles.li}>Go to your Facebook Account's Setting & Privacy. Click "Settings".</li>
                    <li style={styles.li}>Look for "Apps and Websites" and you will see all of the apps and websites you linked with your Facebook.</li>
                    <li style={styles.li}>Search and Click "PhimChill" in the search bar.</li>
                    <li style={styles.li}>Scroll and click "Remove".</li>
                    <li style={styles.li}>Congratulations, you have successfully removed your app activities.</li>
                </ol>

                <h2 style={styles.h2}>4. Contact Us</h2>
                <p style={styles.p}>
                    If you have any questions about this privacy policy or our privacy practices, please contact us at: 
                    <br />
                    Email: support@phimchill.com
                </p>
                
                <div style={styles.contact}>
                    <p style={{margin:0}}>PhimChill Administration Team</p>
                </div>
            </div>
        </>
    );
};

export default PrivacyPolicy;
