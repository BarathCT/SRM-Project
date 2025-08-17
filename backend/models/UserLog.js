import mongoose from 'mongoose';

const userLogSchema = new mongoose.Schema({
  actor: { // Who did the action
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    email: String,
    role: String,
  },
  action: { type: String, enum: ['create', 'update', 'delete'], required: true },
  targetUser: { // On whom the action was performed
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    email: String,
    role: String,
  },
  before: Object,   // User data before update/delete (null for create)
  after: Object,    // User data after create/update (null for delete)
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('UserLog', userLogSchema);