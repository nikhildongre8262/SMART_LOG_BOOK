const mongoose = require('mongoose');
const Group = require('../models/Group');
const { ObjectId } = require('mongoose').Types;
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

/**
 * Adds a new subGroup to all groups or a specific group by name or _id.
 * @param {Object} subGroup - The subGroup object (name, description, etc).
 * @param {String} [targetGroupName] - Optional group name to target a specific group.
 */
async function addSubGroupToGroups(subGroup, targetGroupName = null) {
  await mongoose.connect(MONGO_URI);
  let groups;
  if (targetGroupName) {
    groups = await Group.find({ name: targetGroupName });
  } else {
    groups = await Group.find({});
  }
  if (!groups.length) {
    console.log('No groups found.');
    process.exit(1);
  }
  for (const group of groups) {
    const exists = group.subGroups.some(sg => sg.name === subGroup.name);
    if (!exists) {
      const newSubGroup = {
        ...subGroup,
        _id: new ObjectId(),
        createdAt: new Date(),
        status: subGroup.status || 'active',
      };
      group.subGroups.push(newSubGroup);
      await group.save();
      console.log(`Added subGroup '${newSubGroup.name}' to group '${group.name}'`);
    } else {
      console.log(`subGroup '${subGroup.name}' already exists in group '${group.name}'`);
    }
  }
  process.exit(0);
}

// Example usage: node utils/addSubGroupToGroup.js "Machine Learning" "Description here" "active" "Group Name"
if (require.main === module) {
  const [,, name, description = '', status = 'active', groupName] = process.argv;
  if (!name) {
    console.log('Usage: node utils/addSubGroupToGroup.js "SubGroup Name" "Description" "status" "Group Name (optional)"');
    process.exit(1);
  }
  addSubGroupToGroups({ name, description, status }, groupName);
}

module.exports = addSubGroupToGroups;
