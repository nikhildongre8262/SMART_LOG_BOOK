const { Badge, UserBadge } = require('../models/Badge');
const Notification = require('../models/Notification');
const ChatMessage = require('../models/ChatMessage');
const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');
const Event = require('../models/Group'); // Assuming events are embedded in group
const User = require('../models/User');
const Group = require('../models/Group');
const StudyResource = require('../models/StudyResource');

// GET /api/student/overview
exports.getOverview = async (req, res) => {
  try {
    const userId = req.user.id;
    const groups = await Group.countDocuments({ members: userId });
    const assignmentsDue = await Assignment.countDocuments({ assignedTo: userId, status: 'pending' });
    const events = await Group.aggregate([
      { $match: { members: userId } },
      { $unwind: '$events' },
      { $count: 'eventCount' }
    ]);
    const attendanceRecords = await Attendance.find({ student: userId });
    const attendance = attendanceRecords.length > 0 ? Math.round((attendanceRecords.filter(r => r.present).length / attendanceRecords.length) * 100) : 0;
    const badges = await UserBadge.countDocuments({ user: userId });
    res.json({ groups, assignmentsDue, events: events[0]?.eventCount || 0, attendance, badges });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/student/badges
exports.getBadges = async (req, res) => {
  try {
    const userId = req.user.id;
    const userBadges = await UserBadge.find({ user: userId }).populate('badge');
    res.json(userBadges.map(ub => ub.badge));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/student/notifications
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/student/notifications/:id/read
exports.markNotificationRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const notification = await Notification.findOne({ _id: req.params.id, user: userId });
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    notification.read = true;
    await notification.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/student/groups
exports.getGroups = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching groups for user:', userId);

    // Find all groups student is a member of
    const groups = await Group.find({ members: userId })
      .populate('subGroups')
      .lean();

    console.log('Found groups:', groups);

    // For each group, include sub-groups and their content
    for (const group of groups) {
      // For each sub-group, pull assignments, attendance, resources for this student
      if (!group.subGroups) group.subGroups = [];
      
      for (const subGroup of group.subGroups) {
        // Get assignments for this subgroup
        const assignments = await Assignment.find({ 
          mainGroup: group._id,
          subGroup: subGroup._id
        }).populate('createdBy', 'name');
        
        subGroup.assignments = assignments;
        
        // Get attendance records
        const attendance = await Attendance.find({ 
          group: group._id, 
          subGroup: subGroup._id, 
          student: userId 
        });
        subGroup.attendance = attendance;
        
        // Get study resources
        const resources = await StudyResource.find({ 
          groupId: group._id, 
          subGroupId: subGroup._id 
        });
        subGroup.resources = resources;
      }
    }

    console.log('Processed groups with content:', groups);
    res.json(groups);
  } catch (err) {
    console.error('Error in getGroups:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// POST /api/student/groups/join
exports.joinGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupCode, password } = req.body;
    if (!groupCode || !password) return res.status(400).json({ error: 'Group code and password required' });
    // Find group by code
    const group = await Group.findOne({ mainGroupCode: groupCode });
    if (!group) return res.status(404).json({ error: 'Group not found' });
    // Check password
    const bcrypt = require('bcryptjs');
    const valid = await bcrypt.compare(password, group.password);
    if (!valid) return res.status(401).json({ error: 'Invalid group password' });
    // Add student to main group if not already a member
    if (!group.members) group.members = [];
    if (!group.members.includes(userId)) {
      group.members.push(userId);
      await group.save();
    }
    // Add student to all sub-groups (if using separate SubGroup model, update accordingly)
    // If subGroups are embedded:
    // (No separate membership tracking, but you can expand here if needed)
    // Add group to user's joined groups (if tracked on User model)
    // Optionally: send notification
    res.json({ success: true, message: 'Joined group successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/student/groups/leave
exports.leaveGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.body;
    if (!groupId) return res.status(400).json({ error: 'Group ID required' });
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    // Remove student from main group members
    group.members = (group.members || []).filter(id => id.toString() !== userId);
    await group.save();
    // If using SubGroup membership, remove from all sub-groups as well
    // (For embedded, nothing extra needed)
    // Optionally: update User's joined groups, send notification
    res.json({ success: true, message: 'Left group successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/student/attendance
exports.getAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching attendance for student ID:', userId);
    
    // Find attendance records where this student's ID is in the records array
    // This matches the structure of the Attendance model that admins use
    const attendanceRecords = await Attendance.find({
      'records.studentId': userId
    }).populate('groupId', 'name')
      .populate('subGroupId', 'name')
      .populate('createdBy', 'name');
    
    console.log(`Found ${attendanceRecords.length} attendance records for student`);
    res.json(attendanceRecords);
  } catch (err) {
    console.error('Error in student getAttendance:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/student/events
exports.getEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    const groups = await Group.find({ members: userId });
    const events = groups.flatMap(g => g.events || []);
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/student/events/:eventId/rsvp
exports.rsvpEvent = async (req, res) => {
  res.json({ message: 'RSVP feature coming soon.' });
};

// GET /api/groups/:groupId/chat
exports.getGroupChat = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const messages = await ChatMessage.find({ group: groupId }).populate('sender', 'name');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/groups/:groupId/chat
exports.postGroupChat = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const userId = req.user.id;
    const { message } = req.body;
    const chat = new ChatMessage({ group: groupId, sender: userId, message });
    await chat.save();
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/student/profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/student/profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const update = req.body;
    const user = await User.findByIdAndUpdate(userId, update, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/student/groups/:groupId/subgroups
exports.getSubGroups = async (req, res) => {
  try {
    const userId = req.user.id;
    const groupId = req.params.groupId;

    console.log('Fetching subgroups for group:', groupId, 'user:', userId);

    // Find the main group and verify student is a member
    const group = await Group.findOne({ 
      _id: groupId, 
      members: userId 
    }).select('subGroups');

    if (!group) {
      console.log('Group not found or user not a member');
      return res.status(404).json({ 
        error: 'Group not found or you are not a member',
        groupId,
        userId
      });
    }

    console.log('Found group with subgroups:', group.subGroups);

    // Return only active subgroups
    const subgroups = (group.subGroups || [])
      .filter(subgroup => subgroup.status === 'active')
      .map(subgroup => ({
        _id: subgroup._id,
        name: subgroup.name,
        description: subgroup.description,
        status: subgroup.status,
        parentGroup: groupId // Add parent group ID for reference
      }));

    console.log('Returning filtered subgroups:', subgroups);
    res.json(subgroups);
  } catch (err) {
    console.error('Error in getSubGroups:', err);
    res.status(500).json({ 
      error: 'Server error',
      details: err.message
    });
  }
};

// GET /api/student/resources/:groupId/:subGroupId
exports.getResourcesForStudent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId, subGroupId } = req.params;

    // Check if the student is a member of the group
    const group = await Group.findOne({ _id: groupId, members: userId });
    if (!group) {
      return res.status(403).json({ error: 'You are not a member of this group.' });
    }

    // Fetch resources
    const resources = await StudyResource.find({ groupId, subGroupId }).sort({ createdAt: -1 });
    res.json({ success: true, resources });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch resources.' });
  }
};

// POST /api/student/profile/avatar
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const userId = req.user.id;
    const avatarUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(userId, { avatar: avatarUrl }, { new: true }).select('-password');
    res.json({ avatar: user.avatar });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
