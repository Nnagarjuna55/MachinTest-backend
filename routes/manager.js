const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Manager = require('../models/Manager');

// Get team members
router.get('/team', auth, async (req, res) => {
  try {
    const team = await Employee.find({ managerId: req.user.id });
    res.json(team);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get team attendance
router.get('/attendance', auth, async (req, res) => {
  try {
    const attendance = await Attendance.find({ managerId: req.user.id });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get team tasks
router.get('/tasks', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ managerId: req.user.id });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leave requests
router.get('/leave-requests', auth, async (req, res) => {
  try {
    const leaves = await Leave.find({ managerId: req.user.id });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get performance data
router.get('/performance', auth, async (req, res) => {
  try {
    const performance = await Performance.find({ managerId: req.user.id });
    res.json(performance);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get department stats
router.get('/department-stats', auth, async (req, res) => {
  try {
    const stats = await Department.findOne({ managerId: req.user.id });
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 