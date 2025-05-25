const mongoose = require('mongoose');
const Group = require('./models/Group');
const { ObjectId } = require('mongoose').Types;
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

// Define the subGroups you want to seed
const subGroupsToAdd = [
  {
    name: 'compiler design',
    description: '',
    status: 'active',
    createdAt: new Date('2025-04-27T14:03:41.494Z'),
    _id: new ObjectId('680e393d44ee16d9f4199aac'),
  },
  {
    name: 'Cloud Computing',
    description: '',
    status: 'active',
    createdAt: new Date('2025-04-28T12:24:59.280Z'),
    _id: new ObjectId('680f739bd2b39f4e9eee5eb6'),
  },
];

async function seedSubGroups() {
  await mongoose.connect(MONGO_URI);

  // Find all groups (or you can target a specific group by name or _id)
  const groups = await Group.find({});
  if (!groups.length) {
    console.log('No groups found. Please create a group first.');
    process.exit(1);
  }

  for (const group of groups) {
    // Only add subGroups if not already present
    const existingIds = group.subGroups.map(sg => sg._id.toString());
    let added = 0;
    for (const subGroup of subGroupsToAdd) {
      if (!existingIds.includes(subGroup._id.toString())) {
        group.subGroups.push(subGroup);
        added++;
      }
    }
    if (added > 0) {
      await group.save();
      console.log(`Added ${added} subGroups to group: ${group.name}`);
    } else {
      console.log(`All subGroups already present in group: ${group.name}`);
    }
  }
  process.exit(0);
}

seedSubGroups().catch(err => {
  console.error(err);
  process.exit(1);
});
