const mongoose = require('mongoose');

const assignmentSubmissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  submissionText: {
    type: String,
    required: [true, 'Please provide submission text']
  },
  files: [{
    filename: String,
    originalname: String,
    path: String,
    mimetype: String,
    size: Number
  }],
  submittedAt: {
    type: Date,
    default: Date.now
  },
  isLate: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['submitted', 'approved', 'rejected', 'graded'],
    default: 'submitted'
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: {
    type: String
  },
  grade: {
    type: Number,
    min: 0,
    max: 100
  },
  feedback: {
    type: String
  },
  gradedAt: {
    type: Date
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for faster queries
assignmentSubmissionSchema.index({ assignment: 1, student: 1 });
assignmentSubmissionSchema.index({ submittedAt: -1 });
assignmentSubmissionSchema.index({ status: 1 });

// Prevent duplicate submissions unless allowed
assignmentSubmissionSchema.pre('save', async function(next) {
  if (this.isNew) {
    const assignment = await mongoose.model('Assignment').findById(this.assignment);
    if (!assignment.allowResubmission) {
      const existingSubmission = await mongoose.model('AssignmentSubmission').findOne({
        assignment: this.assignment,
        student: this.student
      });
      if (existingSubmission) {
        throw new Error('Resubmission is not allowed for this assignment');
      }
    }
  }
  next();
});

module.exports = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);
