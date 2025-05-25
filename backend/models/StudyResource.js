const mongoose = require('mongoose');

const StudyResourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  fileUrl: {
    type: String
  },
  videoLink: {
    type: String
  },
  videoThumbnail: {
    type: String
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  subGroupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubGroup',
    required: true
  },
  categories: [{
    type: String
  }],
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('StudyResource', StudyResourceSchema);
