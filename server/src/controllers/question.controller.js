import Question from '../models/Question.js';
import Activity from '../models/Activity.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { sendEmail, sendUserNotification } from '../services/email.service.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const submitQuestion = async (req, res) => {
  try {
    const { text, category, source, email } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Question text is required.' });
    }

    const question = new Question({
      text,
      category: category || 'general',
      source: source || 'manual',
      is_guest: !req.user,
      guest_email: email || null,
      submitted_by: req.user?._id || null
    });

    await question.save();

    const activity = new Activity({
      type: 'question_submitted',
      description: `New question submitted: ${text.substring(0, 50)}...`,
      entity_type: 'Question',
      entity_id: question._id,
      user_id: req.user?._id || null,
      user_email: req.user?.email || email,
      user_name: req.user?.username || 'Guest',
      metadata: { category: category || 'general', source: source || 'manual', is_guest: !req.user }
    });
    await activity.save();

    await sendEmail('questionSubmitted', {
      question: { text, category: category || 'general', source: source || 'manual' },
      user_name: req.user?.username || null,
      user_email: req.user?.email || email,
      timestamp: new Date()
    });

    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getQuestions = async (req, res) => {
  try {
    const { status, category } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (category) filter.category = category;

    const questions = await Question.find(filter)
      .populate('submitted_by', 'username email')
      .sort({ created_at: -1 });
    
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyQuestions = async (req, res) => {
  try {
    if (!req.user) {
      return res.json([]);
    }

    let questions = await Question.find({ submitted_by: req.user._id })
      .populate('submitted_by', 'username email')
      .sort({ created_at: -1 });
    
    if (questions.length === 0) {
      questions = await Question.find({})
        .populate('submitted_by', 'username email')
        .sort({ created_at: -1 });
    }
    
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateQuestionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['new', 'grouped', 'reviewed', 'converted_to_faq', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const question = await Question.findById(id).populate('submitted_by', 'username email');
    if (!question) {
      return res.status(404).json({ error: 'Question not found.' });
    }

    await Question.findByIdAndUpdate(id, { status, updated_at: Date.now() }, { new: true });

    if (question.submitted_by && !question.is_guest) {
      const user = question.submitted_by;
      const userEmail = user.email;
      const userName = user.username;

      let notificationType = '';
      let notificationTitle = '';
      let notificationMessage = '';
      let emailType = '';

      switch (status) {
        case 'reviewed':
          notificationType = 'question_reviewing';
          notificationTitle = 'Your Question Is Being Reviewed';
          notificationMessage = `Your question "${question.text.substring(0, 50)}..." is now being actively reviewed by our team.`;
          emailType = 'questionReviewing';
          break;
        case 'converted_to_faq':
          notificationType = 'question_converted_to_faq';
          notificationTitle = 'Your Question Became an FAQ!';
          notificationMessage = `Great news! Your question "${question.text.substring(0, 50)}..." has been converted into an FAQ.`;
          emailType = 'questionConvertedToFAQ';
          break;
        case 'rejected':
          notificationType = 'question_rejected';
          notificationTitle = 'Your Question Was Not Approved';
          notificationMessage = `Unfortunately, your question "${question.text.substring(0, 50)}..." was not approved at this time.`;
          emailType = 'questionRejected';
          break;
        default:
          break;
      }

      if (notificationType) {
        const notification = new Notification({
          user_id: user._id,
          email: userEmail,
          type: notificationType,
          title: notificationTitle,
          message: notificationMessage,
          related_question_id: question._id,
          metadata: { status, category: question.category }
        });
        await notification.save();

        await sendEmail(emailType, {
          question: { text: question.text, category: question.category },
          user_name: userName,
          user_email: userEmail,
          timestamp: new Date()
        }, { to: userEmail });
      }
    }

    const updatedQuestion = await Question.findById(id).populate('submitted_by', 'username email');
    res.json(updatedQuestion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const groupQuestions = async (req, res) => {
  try {
    const { questionIds, category } = req.body;

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ error: 'Question IDs are required.' });
    }

    const questions = await Question.find({ _id: { $in: questionIds } });
    
    if (questions.length !== questionIds.length) {
      return res.status(404).json({ error: 'Some questions not found.' });
    }

    await Question.updateMany(
      { _id: { $in: questionIds } },
      { status: 'grouped', category: category || questions[0].category, updated_at: Date.now() }
    );

    const updated = await Question.find({ _id: { $in: questionIds } });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const suggestFAQ = async (req, res) => {
  try {
    const { questionIds } = req.body;

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ error: 'Question IDs are required.' });
    }

    const questions = await Question.find({ _id: { $in: questionIds } });

    if (questions.length === 0) {
      return res.status(404).json({ error: 'No questions found.' });
    }

    const questionTexts = questions.map(q => q.text).join('\n');
    
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Based on these user questions, generate one comprehensive FAQ pair:\n\nQuestions:\n${questionTexts}\n\nGenerate a JSON response with this exact structure:
{
  "question": "A clear, concise question that covers the intent of all the input questions",
  "answer": "A comprehensive, helpful answer that addresses all the input questions"
}
Only return valid JSON, no markdown or extra text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let faqData;
    try {
      faqData = JSON.parse(text);
    } catch {
      return res.status(500).json({ error: 'Failed to parse AI response.', raw: text });
    }

    const activity = new Activity({
      type: 'ai_suggestion',
      description: `AI suggested FAQ: ${faqData.question.substring(0, 50)}...`,
      entity_type: 'FAQ',
      user_id: req.user?._id,
      user_email: req.user?.email,
      user_name: req.user?.username,
      metadata: { source_questions_count: questionIds.length, category: questions[0].category },
      is_ai_generated: true
    });
    await activity.save();

    await sendEmail('aiSuggestion', {
      suggestion: faqData,
      source_count: questionIds.length,
      user_name: req.user?.username,
      user_email: req.user?.email,
      timestamp: new Date()
    });

    res.json({
      suggested: faqData,
      source_questions: questionIds,
      category: questions[0].category
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findByIdAndDelete(id);

    if (!question) {
      return res.status(404).json({ error: 'Question not found.' });
    }

    res.json({ message: 'Question deleted.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};