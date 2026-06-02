import Discussion from '../models/Discussion.js';
import Reply from '../models/Reply.js';
import User from '../models/User.js';

// Create a new discussion
export const createDiscussion = async (req, res) => {
  try {
    const { title, text, category } = req.body;
    if (!title || !text) return res.status(400).json({ error: 'Title and text are required.' });

    const discussion = new Discussion({
      title,
      text,
      category: category || 'general',
      author: req.user._id
    });

    await discussion.save();
    res.status(201).json(discussion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// List discussions with pagination
export const listDiscussions = async (req, res) => {
  try {
    const { page = 1, limit = 20, category } = req.query;
    const filter = {};
    if (category) filter.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const discussions = await Discussion.find(filter)
      .populate('author', 'username email')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Discussion.countDocuments(filter);
    res.json({ discussions, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a discussion with its replies
export const getDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    const discussion = await Discussion.findById(id).populate('author', 'username email');
    if (!discussion) return res.status(404).json({ error: 'Discussion not found.' });

    const replies = await Reply.find({ discussion: id })
      .populate('author', 'username email')
      .sort({ created_at: 1 });

    res.json({ discussion, replies });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Post a reply to a discussion (or as a child reply)
export const createReply = async (req, res) => {
  try {
    const { id } = req.params; // discussion id
    const { parentId, text } = req.body;
    if (!text) return res.status(400).json({ error: 'Reply text is required.' });

    const discussion = await Discussion.findById(id);
    if (!discussion) return res.status(404).json({ error: 'Discussion not found.' });

    const reply = new Reply({
      discussion: id,
      parent: parentId || null,
      author: req.user._id,
      text
    });

    await reply.save();

    discussion.replies_count = (discussion.replies_count || 0) + 1;
    await discussion.save();

    res.status(201).json(reply);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Vote on a reply: body { vote: 1 | -1 }
export const voteReply = async (req, res) => {
  try {
    const { id } = req.params; // reply id
    const { vote } = req.body;
    if (![1, -1].includes(vote)) return res.status(400).json({ error: 'Vote must be 1 or -1.' });

    const reply = await Reply.findById(id);
    if (!reply) return res.status(404).json({ error: 'Reply not found.' });

    const userId = req.user._id.toString();
    const hasUp = reply.upvotes.map(String).includes(userId);
    const hasDown = reply.downvotes.map(String).includes(userId);

    if (vote === 1) {
      if (hasUp) return res.json({ message: 'Already upvoted.' });
      if (hasDown) {
        reply.downvotes = reply.downvotes.filter(u => u.toString() !== userId);
      }
      reply.upvotes.push(req.user._id);
    } else {
      if (hasDown) return res.json({ message: 'Already downvoted.' });
      if (hasUp) {
        reply.upvotes = reply.upvotes.filter(u => u.toString() !== userId);
      }
      reply.downvotes.push(req.user._id);
    }

    // moderation logic
    if (reply.upvotes.length >= 10) reply.isFaqCandidate = true;
    if (reply.downvotes.length >= 5) reply.isFlagged = true;

    await reply.save();

    res.json({ 
      message: 'Vote recorded.',
      upvotes: reply.upvotes.length,
      downvotes: reply.downvotes.length,
      isFaqCandidate: reply.isFaqCandidate,
      isFlagged: reply.isFlagged
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
