const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SubGroupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  parentGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
});

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  password: { type: String, required: true }, // hashed
  mainGroupCode: { type: String, unique: true },
  adminJoinCode: { type: String, unique: true },
  studentJoinCode: { type: String, unique: true },
  status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' },
  subGroups: [SubGroupSchema],
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // <-- Added members field
  createdAt: { type: Date, default: Date.now },
  lastActivityAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

// Hash password before saving
GroupSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('Group', GroupSchema);
