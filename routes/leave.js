const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Leave = require('../models/Leave');

router.get('/manager', auth, async (req, res) => {
  try {
    const leaves = await Leave.find({
      managerId: req.user.id
    }).populate('employeeId', 'name email');
    
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leave requests' });
  }
});

module.exports = router; 