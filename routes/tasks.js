const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get tasks for a specific employee
router.get('/employee/:id', auth, async (req, res) => {
  try {
    const employeeId = req.params.id;
    
    // Mock data
    const tasks = [
      {
        _id: '1',
        title: 'Complete Project Documentation',
        description: 'Write technical documentation for the new feature',
        status: 'in_progress',
        priority: 'high',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      {
        _id: '2',
        title: 'Code Review',
        description: 'Review pull requests from team members',
        status: 'pending',
        priority: 'medium',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      }
    ];

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Error fetching tasks' });
  }
});

module.exports = router; 