const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');
const assignmentController = require('../controllers/assignmentController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/assignments');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept all file types
    cb(null, true);
  }
});

// File upload route
router.post('/upload-file', authenticateJWT, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    res.json({
      message: 'File uploaded successfully',
      file: {
        name: req.file.originalname,
        path: req.file.path,
        type: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
});

// Admin routes
router.post('/', authenticateJWT, authorizeRoles('admin'), upload.array('files', 5), assignmentController.createAssignment);
router.get('/', authenticateJWT, authorizeRoles('admin'), assignmentController.getAllAssignments);
router.get('/subgroup/:subgroupId', authenticateJWT, authorizeRoles('admin'), assignmentController.getSubgroupAssignments);
router.put('/:id', authenticateJWT, authorizeRoles('admin'), assignmentController.updateAssignment);
router.delete('/:id', authenticateJWT, authorizeRoles('admin'), assignmentController.deleteAssignment);
router.post('/update-late-submissions', authenticateJWT, authorizeRoles('admin'), assignmentController.updateLateSubmissions);
router.post('/force-update-late-submissions', authenticateJWT, authorizeRoles('admin'), assignmentController.forceUpdateLateSubmissions);

// Admin submission routes
router.get('/:id/submissions', authenticateJWT, authorizeRoles('admin'), assignmentController.getSubmissions);
router.patch('/:id/submissions/:studentId', authenticateJWT, authorizeRoles('admin'), assignmentController.gradeSubmission);
router.get('/:id/submissions/:studentId/export', authenticateJWT, authorizeRoles('admin'), assignmentController.exportSubmission);

// Approval routes
router.post('/submissions/:id/approve', authenticateJWT, assignmentController.approveSubmission);
router.post('/submissions/:id/reject', authenticateJWT, assignmentController.rejectSubmission);

// Student routes
router.get('/student/assignments', authenticateJWT, authorizeRoles('student'), assignmentController.getStudentAssignments);
router.get('/student/assignment/:id', authenticateJWT, authorizeRoles('student'), assignmentController.getAssignmentDetails);
router.get('/student/submission/:id', authenticateJWT, authorizeRoles('student'), assignmentController.getStudentSubmission);
router.get('/student/submission-history/:id', authenticateJWT, authorizeRoles('student'), assignmentController.getSubmissionHistory);
router.post('/student/submit/:id', authenticateJWT, authorizeRoles('student'), upload.array('files'), assignmentController.submitAssignment);
router.get('/student/download/:subgroupId', authenticateJWT, authorizeRoles('student'), assignmentController.downloadAllAssignments);
router.get('/student/subgroup/:subgroupId', authenticateJWT, authorizeRoles('student'), assignmentController.getSubgroupAssignments);

module.exports = router;
