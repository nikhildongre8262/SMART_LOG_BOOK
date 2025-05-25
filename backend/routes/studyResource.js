const express = require('express');
const router = express.Router();
const studyResourceController = require('../controllers/studyResourceController');
const upload = require('../middleware/upload');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');

// Only admin can manage study resources
router.get('/groups', authenticateJWT, authorizeRoles('admin'), studyResourceController.getGroups);
router.get('/groups/:groupId/subgroups', authenticateJWT, authorizeRoles('admin'), studyResourceController.getSubGroups);
router.get('/:groupId/:subGroupId', authenticateJWT, authorizeRoles('admin'), studyResourceController.getResources);
router.post('/', authenticateJWT, authorizeRoles('admin'), upload.single('file'), studyResourceController.addResource);
router.delete('/:resourceId', authenticateJWT, authorizeRoles('admin'), studyResourceController.deleteResource);

module.exports = router;
