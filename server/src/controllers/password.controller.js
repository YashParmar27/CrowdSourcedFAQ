import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../services/email.service.js';

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const user = await User.findOne({ email });
    // Always return success message to avoid leaking account existence
    if (!user) return res.status(200).json({ message: 'If an account exists, an email was sent.' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5174'}/reset-password?token=${token}`;

    await sendEmail('forgotPassword', {
      username: user.username,
      reset_url: resetUrl,
      client_url: process.env.CLIENT_URL || 'http://localhost:5174',
      timestamp: new Date()
    }, { to: user.email });

    res.json({ message: 'If an account exists, an email was sent.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and new password are required.' });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid or expired token.' });
    }

    const user = await User.findById(payload.userId);
    if (!user) return res.status(400).json({ error: 'User not found.' });

    user.password_hash = password; // pre-save hook will hash
    await user.save();

    await sendEmail('passwordResetConfirmation', {
      username: user.username,
      client_url: process.env.CLIENT_URL || 'http://localhost:5174',
      timestamp: new Date()
    }, { to: user.email });

    res.json({ message: 'Password reset successful.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
