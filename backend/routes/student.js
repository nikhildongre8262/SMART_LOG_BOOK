const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes use JWT authentication and 'student' role
router.use(authenticateJWT, authorizeRoles('student'));

router.get('/overview', studentController.getOverview);
router.get('/badges', studentController.getBadges);
router.get('/notifications', studentController.getNotifications);
router.post('/notifications/:id/read', studentController.markNotificationRead);
router.get('/groups', studentController.getGroups);
router.get('/groups/:groupId/subgroups', studentController.getSubGroups);
router.post('/groups/join', studentController.joinGroup);
router.post('/groups/leave', studentController.leaveGroup);
router.get('/attendance', studentController.getAttendance);
router.get('/events', studentController.getEvents);
router.post('/events/:eventId/rsvp', studentController.rsvpEvent);
router.get('/profile', studentController.getProfile);
router.put('/profile', studentController.updateProfile);
// Group chat
router.get('/groups/:groupId/chat', studentController.getGroupChat);
router.post('/groups/:groupId/chat', studentController.postGroupChat);
router.get('/resources/:groupId/:subGroupId', studentController.getResourcesForStudent);
// Avatar upload
router.post('/profile/avatar', upload.single('avatar'), studentController.uploadAvatar);

module.exports = router;
