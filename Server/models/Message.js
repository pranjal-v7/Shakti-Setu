const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  consultation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consultation',
    required: true
  },
  senderType: {
    type: String,
    enum: ['user', 'lawyer'],
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  content: {
    type: String,
    trim: true,
    maxlength: 2000,
    default: ''
  },
  messageType: {
    type: String,
    enum: ['text', 'file'],
    default: 'text'
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  // File fields (only used when messageType === 'file')
  fileName: {
    type: String,
    default: ''
  },
  fileUrl: {
    type: String,
    default: ''
  },
  fileType: {
    type: String,
    default: ''
  },
  fileSize: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

messageSchema.index({ consultation: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
