const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Leave = require('../models/Leave');

// Create a new leave request
router.post('/request', auth, async (req, res) => {
  try {
    const { type, startDate, endDate, reason } = req.body;
    const employeeId = req.user.id; // Assuming user info is attached to req.user

    const newLeave = new Leave({
      employeeId,
      type,
      startDate,
      endDate,
      reason
    });

    const savedLeave = await newLeave.save();
    res.status(201).json(savedLeave);
  } catch (error) {
    console.error('Error creating leave request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leave information for a specific employee
router.get('/employee/:employeeId', auth, async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Verify user has access to this data
    if (req.user.id !== employeeId) {
      return res.status(403).json({ message: 'Not authorized to access this data' });
    }

    const leaves = await Leave.find({ employeeId });
    res.json(leaves);
  } catch (error) {
    console.error('Error fetching leave data:', error);
    res.status(500).json({ message: 'Error fetching leave data' });
  }
});

// Get leave requests for managers
router.get('/manager', auth, async (req, res) => {
  try {
    const leaves = await Leave.find().populate('employeeId', 'name email');
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leave requests' });
  }
});

// Update leave request status
router.patch('/:leaveId', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const updatedLeave = await Leave.findByIdAndUpdate(
      req.params.leaveId,
      { status },
      { new: true }
    );

    if (!updatedLeave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    res.json(updatedLeave);
  } catch (error) {
    console.error('Error updating leave request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 