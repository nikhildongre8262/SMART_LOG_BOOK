const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide assignment title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide assignment description']
  },
  deadline: {
    type: Date,
    required: [true, 'Please provide assignment deadline']
  },
  mainGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  subGroup: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  files: [{
    name: String,
    url: String,
    type: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  allowLateSubmission: {
    type: Boolean,
    default: true
  },
  allowResubmission: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active'
  },
  submissions: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    submittedAt: Date,
    isLate: Boolean
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add validation for file URLs
assignmentSchema.path('files').validate(function(files) {
  if (!files) return true;
  return files.every(file => file.url && file.name && file.type);
}, 'Each file must have a name, URL, and type');

// Index for faster queries
assignmentSchema.index({ mainGroup: 1, subGroup: 1 });
assignmentSchema.index({ deadline: 1 });
assignmentSchema.index({ status: 1 });
assignmentSchema.index({ 'submissions.student': 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
