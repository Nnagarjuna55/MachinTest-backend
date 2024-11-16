const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.get('/manager', auth, async (req, res) => {
  try {
    // Return mock data for now
    res.json({
      overview: { averageRating: 75 },
      metrics: [],
      trends: []
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching performance data' });
  }
});

module.exports = router; 