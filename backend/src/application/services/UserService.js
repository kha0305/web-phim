const { User, Otp } = require('../../infrastructure/database');
const { put } = require('@vercel/blob');
const bcrypt = require('bcryptjs');
const { generateOTP, sendOtpEmail } = require('../../shared/utils');

class UserService {
    async updateProfile(req, res) {
        try {
            const { username, gender, avatarUrl } = req.body;
            const userId = req.user.id;
            
            if (!username) return res.status(400).json({ error: "Username is required" });

            const user = await User.findByPk(userId);
            if (!user) return res.status(404).json({ error: "User not found" });

            user.username = username;
            if (gender) user.gender = gender;

            if (req.file) {
                 if (!process.env.BLOB_READ_WRITE_TOKEN) {
                     return res.status(500).json({ error: "Server configuration error: Missing Blob Token" });
                 }
                 try {
                     const filename = `${Date.now()}-${req.file.originalname}`;
                     const blob = await put(filename, req.file.buffer, { 
                         access: 'public',
                         token: process.env.BLOB_READ_WRITE_TOKEN
                     });
                     user.avatar = blob.url;
                 } catch (uploadError) {
                     return res.status(500).json({ error: "Failed to upload image" });
                 }
            } else if (avatarUrl) {
                user.avatar = avatarUrl;
            }

            await user.save();
            res.json({ success: true, user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar, gender: user.gender } });
        } catch (error) {
            console.error("Update profile error:", error);
            res.status(500).json({ error: "Failed to update profile" });
        }
    }

    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user.id;

            if (!currentPassword || !newPassword) return res.status(400).json({ error: "Missing fields" });

            const user = await User.findByPk(userId);
            if (!user) return res.status(404).json({ error: "User not found" });

            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) return res.status(400).json({ error: "Incorrect current password" });

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
            await user.save();

            res.json({ success: true, message: "Password changed successfully" });
        } catch (error) {
            res.status(500).json({ error: "Failed to change password" });
        }
    }

    async requestEmailChange(req, res) {
        try {
            const { newEmail } = req.body;
            if (!newEmail) return res.status(400).json({ error: "New email is required" });

            const existingUser = await User.findOne({ where: { email: newEmail } });
            if (existingUser) return res.status(400).json({ error: "Email already in use" });

            const otp = generateOTP();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

            await Otp.destroy({ where: { email: newEmail } });
            await Otp.create({ email: newEmail, otp, expiresAt });
            await sendOtpEmail(newEmail, otp);

            res.json({ success: true, message: "OTP sent to new email" });
        } catch (error) {
            res.status(500).json({ error: "Failed to send OTP" });
        }
    }

    async verifyEmailChange(req, res) {
        try {
            const { newEmail, otp } = req.body;
            const userId = req.user.id;
            
            if (!newEmail || !otp) return res.status(400).json({ error: "Missing fields" });

            const record = await Otp.findOne({ where: { email: newEmail, otp } });
            if (!record) return res.status(400).json({ error: "Invalid OTP" });
            if (new Date() > record.expiresAt) return res.status(400).json({ error: "OTP expired" });

            const user = await User.findByPk(userId);
            if (!user) return res.status(404).json({ error: "User not found" });

            user.email = newEmail;
            await user.save();
            await record.destroy();

            res.json({ success: true, message: "Email updated successfully", user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar } });
        } catch (error) {
            res.status(500).json({ error: "Failed to update email" });
        }
    }
}

module.exports = UserService;
