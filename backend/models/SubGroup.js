const mongoose = require('mongoose');

const SubGroupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  // Optionally add more fields (e.g., description, createdAt)
});

module.exports = mongoose.model('SubGroup', SubGroupSchema);
