import User from '../models/User.js';
import Question from '../models/Question.js';
import FAQ from '../models/FAQ.js';

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password_hash').sort({ created_at: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password_hash');

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const questionCount = await Question.countDocuments({ submitted_by: id });
    const faqCount = await FAQ.countDocuments({ 
      source_questions: { $elemMatch: { $exists: true } } 
    });

    res.json({ 
      ...user.toObject(),
      stats: {
        questions_submitted: questionCount,
        faqs_created_from_questions: faqCount
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role } = req.body;

    const updateFields = { updated_at: Date.now() };
    if (username) updateFields.username = username;
    if (email) updateFields.email = email;
    if (role) {
      if (!['USER', 'ADMIN'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role.' });
      }
      updateFields.role = role;
    }

    const user = await User.findByIdAndUpdate(id, updateFields, { new: true }).select('-password_hash');

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user._id.toString() === id) {
      return res.status(400).json({ error: 'Cannot delete your own account.' });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ message: 'User deleted.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: 'ADMIN' });
    const totalLoginsResult = await User.aggregate([
      { $group: { _id: null, total: { $sum: { $ifNull: ['$login_count', 0] } } } }
    ]);

    res.json({ 
      totalUsers, 
      adminCount, 
      userCount: totalUsers - adminCount,
      totalLogins: totalLoginsResult[0]?.total || 0,
      questionsToday: await Question.countDocuments({
        created_at: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      questionsThisWeek: await Question.countDocuments({
        created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),
      questionsThisMonth: await Question.countDocuments({
        created_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
      totalQuestions: await Question.countDocuments(),
      totalPublishedFaqs: await FAQ.countDocuments({ status: 'published' }),
      totalDraftFaqs: await FAQ.countDocuments({ status: 'draft' })
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const checkUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const existingUser = await User.findOne({ username });
    res.json({ available: !existingUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};