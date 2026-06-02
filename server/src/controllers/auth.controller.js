import User from '../models/User.js';
import Activity from '../models/Activity.js';
import Notification from '../models/Notification.js';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../services/email.service.js';

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists.' });
    }

    const isAdminEmail = process.env.ADMIN_EMAIL && email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();
    const user = new User({ 
      username, 
      email, 
      password_hash: password,
      role: isAdminEmail ? 'ADMIN' : 'USER'
    });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    const activity = new Activity({
      type: 'user_registered',
      description: `User registered: ${username} (${email})`,
      entity_type: 'User',
      entity_id: user._id,
      user_id: user._id,
      user_email: email,
      user_name: username,
      metadata: { role: user.role }
    });
    await activity.save();

    const notification = new Notification({
      user_id: user._id,
      email: user.email,
      type: 'welcome',
      title: 'Welcome to FAQ Generator!',
      message: `Welcome ${username}! Thank you for joining FAQ Generator. Start by submitting your first question!`,
      metadata: { role: user.role }
    });
    await notification.save();

    await sendEmail('welcome', {
      username: user.username,
      email: user.email,
      role: user.role,
      client_url: process.env.CLIENT_URL || 'http://localhost:5173',
      created_at: user.created_at
    }, { to: user.email });

    res.status(201).json({
      token,
      user: { id: user._id, username: user.username, email: user.email, role: user.role, created_at: user.created_at }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    user.last_login = new Date();
    user.login_count = (user.login_count || 0) + 1;
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    const activity = new Activity({
      type: 'user_login',
      description: `User logged in: ${user.username} (${user.email})`,
      entity_type: 'User',
      entity_id: user._id,
      user_id: user._id,
      user_email: email,
      user_name: user.username,
      metadata: { login_count: user.login_count }
    });
    await activity.save();

    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email, role: user.role, created_at: user.created_at }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};