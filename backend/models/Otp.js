import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please fill a valid email address'
    ]
  },
  otp: {
    type: String,
    required: true,
    minlength: 6,
    maxlength: 6
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiration
  },
  attempts: {
    type: Number,
    default: 0,
    max: 3 // Maximum verification attempts
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '10m' // Auto-delete after 10 minutes
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Index for faster queries
otpSchema.index({ email: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to create OTP
otpSchema.statics.createOTP = async function(email) {
  await this.deleteMany({ email });
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return this.create({ email, otp });
};

// Static method to verify OTP (does NOT mark as used)
otpSchema.statics.verifyOTP = async function(email, otp) {
  const otpDoc = await this.findOneAndUpdate(
    {
      email,
      expiresAt: { $gt: new Date() },
      isUsed: false,
      attempts: { $lt: 3 }
    },
    { $inc: { attempts: 1 } },
    { new: true, sort: { createdAt: -1 } }
  );
  if (!otpDoc) throw new Error('No active OTP found or maximum attempts reached');
  if (otpDoc.otp !== otp) throw new Error('Invalid OTP');
  return true;
};

// Static method to consume OTP (marks as used)
otpSchema.statics.consumeOTP = async function(email, otp) {
  const otpDoc = await this.findOneAndUpdate(
    {
      email,
      otp,
      expiresAt: { $gt: new Date() },
      isUsed: false,
      attempts: { $lt: 3 }
    },
    { isUsed: true },
    { new: true, sort: { createdAt: -1 } }
  );
  if (!otpDoc) throw new Error('Invalid or expired OTP');
  return true;
};

const OTP = mongoose.model('OTP', otpSchema);
export default OTP;