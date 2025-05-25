const mongoose = require('mongoose');
const Assignment = require('./models/Assignment');
const Group = require('./models/Group');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

async function seedAll() {
  await mongoose.connect(MONGO_URI);

  const groups = await Group.find({ 'subGroups.0': { $exists: true } });
  if (!groups.length) {
    console.log('No groups with subGroups found. Please create groups and sub-groups first.');
    process.exit(1);
  }

  let count = 0;
  for (const group of groups) {
    const mainGroupId = group._id;
    for (const subGroup of group.subGroups) {
      const subGroupId = subGroup._id;
      // Check if assignment already exists for this subGroup
      const exists = await Assignment.findOne({ subGroup: subGroupId });
      if (!exists) {
        const assignment = new Assignment({
          title: `Test Assignment for ${subGroup.name}`,
          description: 'This is a seeded test assignment.',
          files: [],
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          mainGroup: mainGroupId,
          subGroup: subGroupId,
          submissions: []
        });
        await assignment.save();
        console.log(`Created assignment for subGroup: ${subGroup.name} (${subGroupId})`);
        count++;
      } else {
        console.log(`Assignment already exists for subGroup: ${subGroup.name} (${subGroupId})`);
      }
    }
  }
  console.log(`Seeding complete. Total new assignments created: ${count}`);
  process.exit(0);
}

seedAll().catch(err => {
  console.error(err);
  process.exit(1);
});
