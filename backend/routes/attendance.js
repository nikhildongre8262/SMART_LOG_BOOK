const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');

// Get Single Attendance Record
router.get('/:id', authenticateJWT, authorizeRoles('admin'), attendanceController.getAttendanceById);

// Add Attendance
router.post('/', authenticateJWT, authorizeRoles('admin'), attendanceController.addAttendance);

// Get Attendance Records for Sub-Group
router.get('/group/:groupId/subgroup/:subGroupId', authenticateJWT, authorizeRoles('admin'), attendanceController.getAttendanceBySubGroup);

// Edit Attendance
router.put('/:attendanceId', authenticateJWT, authorizeRoles('admin'), attendanceController.editAttendance);

// Export Single Attendance
router.get('/export/single/:attendanceId', authenticateJWT, authorizeRoles('admin'), attendanceController.exportSingleAttendance);

// Export Full Attendance Report
router.get('/export/full/:groupId/:subGroupId', authenticateJWT, authorizeRoles('admin'), attendanceController.exportFullAttendance);

module.exports = router;
