import mongoose from 'mongoose';

const discussionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  text: { type: String, required: true },
  category: { type: String, default: 'general' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  replies_count: { type: Number, default: 0 },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  promoted_to_faq: { type: Boolean, default: false },
  promoted_faq_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FAQ', default: null },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

discussionSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

discussionSchema.index({ created_at: -1 });
discussionSchema.index({ category: 1 });

export default mongoose.model('Discussion', discussionSchema);
