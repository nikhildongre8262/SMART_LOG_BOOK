const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  present: {
    type: Boolean,
    required: true
  }
});

const attendanceSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  subGroupId: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  lectureNo: {
    type: Number,
    required: true
  },
  day: {
    type: String,
    required: true
  },
  subject: {
    type: String
  },
  remarks: {
    type: String
  },
  records: [attendanceRecordSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
