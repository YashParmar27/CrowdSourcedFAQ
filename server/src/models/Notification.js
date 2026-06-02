import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true },
  type: {
    type: String,
    enum: [
      'question_approved',
      'question_rejected', 
      'question_reviewing',
      'question_converted_to_faq',
      'faq_published',
      'welcome'
    ],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  related_question_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  related_faq_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FAQ' },
  is_read: { type: Boolean, default: false },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  created_at: { type: Date, default: Date.now }
});

notificationSchema.index({ user_id: 1, is_read: 1, created_at: -1 });

export default mongoose.model('Notification', notificationSchema);