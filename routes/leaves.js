const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get leave information for a specific employee
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user has access to this data
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Not authorized to access this data' });
    }

    // Mock data
    res.json({
      requests: [
        {
          _id: '1',
          type: 'annual',
          startDate: new Date(),
          endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          status: 'pending',
          reason: 'Family vacation'
        }
      ],
      balance: {
        casual: 10,
        sick: 7,
        annual: 14
      }
    });
  } catch (error) {
    console.error('Error fetching leave data:', error);
    res.status(500).json({ message: 'Error fetching leave data' });
  }
});

module.exports = router; 