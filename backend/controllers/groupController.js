const Group = require('../models/Group');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

function generateCode(length = 8) {
  return crypto.randomBytes(Math.ceil(length/2)).toString('hex').slice(0, length).toUpperCase();
}

exports.createGroup = async (req, res, next) => {
  try {
    const { name, description, password } = req.body;
    const mainGroupCode = generateCode(8);
    const adminJoinCode = generateCode(10);
    const studentJoinCode = generateCode(10);
    const group = new Group({
      name,
      description,
      password,
      mainGroupCode,
      adminJoinCode,
      studentJoinCode,
      createdBy: req.user.id
    });
    await group.save();
    res.status(201).json({ message: 'Class Created Successfully!', group });
  } catch (err) {
    next(err);
  }
};

exports.listGroups = async (req, res, next) => {
  try {
    const { search, status, sort } = req.query;
    let query = {};
    if (status) query.status = status;
    if (search) query.name = { $regex: search, $options: 'i' };
    let sortObj = { lastActivityAt: -1 };
    if (sort === 'alpha') sortObj = { name: 1 };
    if (sort === 'members') sortObj = { totalMembers: -1 };
    const groups = await Group.find(query).sort(sortObj);
    res.json(groups);
  } catch (err) {
    next(err);
  }
};

exports.getGroupById = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    res.json(group);
  } catch (err) {
    next(err);
  }
};

exports.editGroup = async (req, res, next) => {
  try {
    const { name, description, password, status } = req.body;
    const update = { name, description, status, lastActivityAt: Date.now() };
    if (password) update.password = await bcrypt.hash(password, 10);
    const group = await Group.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!group) return res.status(404).json({ message: 'Group not found' });
    res.json({ message: 'Group updated successfully', group });
  } catch (err) {
    next(err);
  }
};

exports.deleteGroup = async (req, res, next) => {
  try {
    const group = await Group.findByIdAndDelete(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    // Optionally: remove related assignments, attendance, etc.
    res.json({ message: 'Group deleted successfully' });
  } catch (err) {
    next(err);
  }
};

exports.updateGroupStatus = async (req, res, next) => {
  try {
    const { status } = req.body; // 'active', 'inactive', 'archived'
    const group = await Group.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!group) return res.status(404).json({ message: 'Group not found' });
    res.json({ message: `Group status updated to ${status}`, group });
  } catch (err) {
    next(err);
  }
};

exports.addSubGroup = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Main Group not found' });
    group.subGroups.push({ name, description });
    group.lastActivityAt = Date.now();
    await group.save();
    res.status(201).json({ message: 'Sub-Group Created Successfully!', group });
  } catch (err) {
    next(err);
  }
};

exports.editSubGroup = async (req, res, next) => {
  try {
    const { name, description, status } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Main Group not found' });
    const subGroup = group.subGroups.id(req.params.subId);
    if (!subGroup) return res.status(404).json({ message: 'Sub-Group not found' });
    if (name) subGroup.name = name;
    if (description) subGroup.description = description;
    if (status) subGroup.status = status;
    group.lastActivityAt = Date.now();
    await group.save();
    res.json({ message: 'Sub-Group updated successfully', group });
  } catch (err) {
    next(err);
  }
};

exports.deleteSubGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Main Group not found' });
    group.subGroups.id(req.params.subId).remove();
    group.lastActivityAt = Date.now();
    await group.save();
    res.json({ message: 'Sub-Group deleted successfully', group });
  } catch (err) {
    next(err);
  }
};

// Get Students for a Group
exports.getGroupStudents = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id).populate('members', 'name email role');
    if (!group) return res.status(404).json({ message: 'Group not found' });
    
    // Filter only students and sort by name
    const students = group.members
      .filter(member => member.role === 'student')
      .sort((a, b) => a.name.localeCompare(b.name));
    
    res.json(students);
  } catch (err) {
    next(err);
  }
};
