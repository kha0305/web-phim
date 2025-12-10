const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendOtpEmail = async (email, otp) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;
    const mailOptions = {
        from: `"PhimChill Security" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Security Verification Code',
        html: `<h1>${otp}</h1><p>Use this code to verify your request.</p>`
    };
    try { await transporter.sendMail(mailOptions); } catch (e) { console.error(e); }
};

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

module.exports = { transporter, sendOtpEmail, generateOTP };
