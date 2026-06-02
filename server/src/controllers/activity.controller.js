import Activity from '../models/Activity.js';
import User from '../models/User.js';
import Question from '../models/Question.js';
import FAQ from '../models/FAQ.js';

export const getActivities = async (req, res) => {
  try {
    const { limit = 50, offset = 0, type, dateFrom, dateTo, userId, search } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (userId) filter.user_id = userId;
    if (dateFrom || dateTo) {
      filter.created_at = {};
      if (dateFrom) filter.created_at.$gte = new Date(dateFrom);
      if (dateTo) filter.created_at.$lte = new Date(dateTo);
    }
    if (search) {
      filter.description = { $regex: search, $options: 'i' };
    }

    const [activities, total] = await Promise.all([
      Activity.find(filter)
        .populate('user_id', 'username email')
        .sort({ created_at: -1 })
        .skip(parseInt(offset))
        .limit(parseInt(limit)),
      Activity.countDocuments(filter)
    ]);

    res.json({ activities, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getActivityStats = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [
      dailyActivity,
      faqStatusDistribution,
      topCategories,
      aiGeneratedCount,
      totalFAQs,
      totalQuestions,
      totalUsers,
      recentUsers,
      totalActivities,
      activityTypeCounts,
      userRegistrations,
      userLogins,
      questionSubmissions
    ] = await Promise.all([
      Activity.aggregate([
        { $match: { created_at: { $gte: thirtyDaysAgo } } },
        { $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
            count: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ]),
      FAQ.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      FAQ.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Activity.countDocuments({
        type: { $in: ['faq_created', 'ai_suggestion'] },
        is_ai_generated: true
      }),
      FAQ.countDocuments(),
      Question.countDocuments(),
      User.countDocuments(),
      User.countDocuments({ last_login: { $gte: sevenDaysAgo } }),
      Activity.countDocuments(),
      Activity.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Activity.aggregate([
        { $match: { type: 'user_registered', created_at: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Activity.aggregate([
        { $match: { type: 'user_login', created_at: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Activity.aggregate([
        { $match: { type: 'question_submitted', created_at: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    const publishedCount = faqStatusDistribution.find(s => s._id === 'published')?.count || 0;
    const conversionRate = totalQuestions > 0 ? ((totalFAQs / totalQuestions) * 100).toFixed(1) : 0;

    res.json({
      dailyActivity,
      faqStatusDistribution,
      topCategories,
      aiGeneratedCount,
      totalFAQs,
      totalPublished: publishedCount,
      totalAI: aiGeneratedCount,
      totalQuestions,
      totalUsers,
      activeUsers7d: recentUsers,
      conversionRate: parseFloat(conversionRate),
      totalActivities,
      activityTypeCounts,
      userRegistrations,
      userLogins,
      questionSubmissions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
