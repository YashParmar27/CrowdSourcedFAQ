import mongoose from 'mongoose';

const replySchema = new mongoose.Schema({
  discussion: { type: mongoose.Schema.Types.ObjectId, ref: 'Discussion', required: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Reply', default: null },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isFaqCandidate: { type: Boolean, default: false },
  isFlagged: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

replySchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

replySchema.index({ discussion: 1, created_at: 1 });

export default mongoose.model('Reply', replySchema);
