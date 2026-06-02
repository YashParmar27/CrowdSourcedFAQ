import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  category: { type: String, default: 'general' },
  source: { type: String, default: 'manual' },
  status: {
    type: String,
    enum: ['new', 'grouped', 'reviewed', 'converted_to_faq', 'rejected'],
    default: 'new'
  },
  submitted_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  is_guest: { type: Boolean, default: false },
  guest_email: { type: String, default: null },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

questionSchema.index({ status: 1, category: 1 });

export default mongoose.model('Question', questionSchema);