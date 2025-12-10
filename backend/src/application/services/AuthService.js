const { User, Otp } = require('../../infrastructure/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_change_this';

const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS
  }
});

const sendWelcomeEmail = async (email, username) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;
  const mailOptions = {
    from: `"PhimChill Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Welcome to PhimChill! 🎉',
    html: `<h1>Welcome ${username}!</h1><p>Start watching now on PhimChill.</p>`
  };
  try { await transporter.sendMail(mailOptions); } catch (e) { console.error(e); }
};

const sendOtpEmail = async (email, otp) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;
    const mailOptions = {
        from: `"PhimChill Security" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your OTP Code',
        html: `<h1>${otp}</h1><p>Use this code to reset your password.</p>`
    };
    try { await transporter.sendMail(mailOptions); } catch (e) { console.error(e); }
};

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

class AuthService {
    async register(req, res) {
        try {
            const { username, password, email } = req.body;
            if (!username || !password || !email) return res.status(400).json({ error: "Missing fields" });
            
            const existingUser = await User.findOne({ where: { username } });
            if (existingUser) return res.status(400).json({ error: "Username already exists" });

            const existingEmail = await User.findOne({ where: { email } });
            if (existingEmail) return res.status(400).json({ error: "Email already exists" });

            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = await User.create({ username, password: hashedPassword, email });

            sendWelcomeEmail(email, username);

            const token = jwt.sign({ id: newUser.id, username: newUser.username, role: newUser.role }, JWT_SECRET);
            res.json({ 
                user: { id: newUser.id, username: newUser.username, email: newUser.email, role: newUser.role, avatar: newUser.avatar },
                token 
            });
        } catch (error) {
            console.error("Register error:", error);
            res.status(500).json({ error: "Register failed" });
        }
    }

    async login(req, res) {
        try {
            const { username, password } = req.body;
            const user = await User.findOne({ where: { username } });

            if (!user) return res.status(401).json({ error: "Invalid credentials" });

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

            const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
            res.json({ 
                user: { id: user.id, username: user.username, email: user.email, role: user.role, avatar: user.avatar },
                token 
            });
        } catch (error) {
            console.error("Login error:", error);
            res.status(500).json({ error: "Login failed" });
        }
    }

    async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            if (!email) return res.status(400).json({ error: "Email is required" });

            const user = await User.findOne({ where: { email } });
            if (!user) return res.status(404).json({ error: "User not found" });

            const otp = generateOTP();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

            await Otp.destroy({ where: { email } });
            await Otp.create({ email, otp, expiresAt });
            await sendOtpEmail(email, otp);

            res.json({ success: true, message: "OTP sent to email" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to send OTP" });
        }
    }

    async verifyOtp(req, res) {
        try {
            const { email, otp } = req.body;
            if (!email || !otp) return res.status(400).json({ error: "Missing fields" });

            const record = await Otp.findOne({ where: { email, otp } });
            if (!record) return res.status(400).json({ error: "Invalid OTP" });
            if (new Date() > record.expiresAt) return res.status(400).json({ error: "OTP expired" });

            res.json({ success: true, message: "OTP verified" });
        } catch (error) {
            res.status(500).json({ error: "Verification failed" });
        }
    }

    async resetPassword(req, res) {
        try {
            const { email, otp, newPassword } = req.body;
            if (!email || !otp || !newPassword) return res.status(400).json({ error: "Missing fields" });

            const record = await Otp.findOne({ where: { email, otp } });
            if (!record || new Date() > record.expiresAt) return res.status(400).json({ error: "Invalid or expired OTP" });

            const user = await User.findOne({ where: { email } });
            if (!user) return res.status(404).json({ error: "User not found" });

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
            await user.save();
            await record.destroy();

            res.json({ success: true, message: "Password reset successfully" });
        } catch (error) {
            res.status(500).json({ error: "Failed to reset password" });
        }
    }
}

// Helper exports if needed elsewhere
AuthService.generateOTP = generateOTP;
AuthService.sendOtpEmail = sendOtpEmail;

module.exports = AuthService;
