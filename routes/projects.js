const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    // Mock data for now
    res.json([
      {
        id: 1,
        name: 'Project 1',
        status: 'active',
        progress: 75
      }
    ]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching projects' });
  }
});

module.exports = router; 