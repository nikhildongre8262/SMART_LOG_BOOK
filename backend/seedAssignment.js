const mongoose = require('mongoose');
const Assignment = require('./models/Assignment');
const Group = require('./models/Group');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

async function seed() {
  await mongoose.connect(MONGO_URI);

  // Find a group with at least one subGroup
  const group = await Group.findOne({ 'subGroups.0': { $exists: true } });
  if (!group) {
    console.log('No group with subGroups found. Please create a group and sub-group first.');
    process.exit(1);
  }

  const subGroup = group.subGroups[0];
  const mainGroupId = group._id;
  const subGroupId = subGroup._id;

  // Create a test assignment
  const assignment = new Assignment({
    title: 'Test Assignment',
    description: 'This is a seeded test assignment.',
    files: [],
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    mainGroup: mainGroupId,
    subGroup: subGroupId,
    submissions: []
  });

  await assignment.save();
  console.log('Test assignment created for subGroup:', subGroup.name, 'with id:', subGroupId);
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
