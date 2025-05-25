const express = require('express');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// Example protected route: Get user profile
router.get('/profile', authenticateJWT, (req, res) => {
  res.json({ user: req.user });
});

// Example admin-only route
router.get('/admin-data', authenticateJWT, authorizeRoles('admin'), (req, res) => {
  res.json({ secret: 'This is admin-only data.' });
});

module.exports = router;
