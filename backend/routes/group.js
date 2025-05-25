const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');
const groupController = require('../controllers/groupController');
const router = express.Router();

// Create Main Group (Class)
router.post(
  '/create',
  [authenticateJWT, authorizeRoles('admin'), body('name').notEmpty(), body('description').optional(), body('password').isLength({ min: 4 })],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    groupController.createGroup(req, res, next);
  }
);

// List Groups (with filters, search, sort)
router.get('/', authenticateJWT, authorizeRoles('admin'), groupController.listGroups);

// Get Group by ID
router.get('/:id', authenticateJWT, authorizeRoles('admin'), groupController.getGroupById);

// Get Students for a Group
router.get('/:id/students', authenticateJWT, authorizeRoles('admin'), groupController.getGroupStudents);

// Edit Group
router.put('/:id', authenticateJWT, authorizeRoles('admin'), groupController.editGroup);

// Delete Group
router.delete('/:id', authenticateJWT, authorizeRoles('admin'), groupController.deleteGroup);

// Deactivate/Archive Group
router.patch('/:id/status', authenticateJWT, authorizeRoles('admin'), groupController.updateGroupStatus);

// Add Sub-Group
router.post(
  '/:id/subgroup',
  [authenticateJWT, authorizeRoles('admin'), body('name').notEmpty()],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    groupController.addSubGroup(req, res, next);
  }
);

// Edit Sub-Group
router.put('/:id/subgroup/:subId', authenticateJWT, authorizeRoles('admin'), groupController.editSubGroup);

// Delete Sub-Group
router.delete('/:id/subgroup/:subId', authenticateJWT, authorizeRoles('admin'), groupController.deleteSubGroup);

module.exports = router;
