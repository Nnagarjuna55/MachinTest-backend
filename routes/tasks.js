const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');

// Create a new task
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, projectId, dueDate, priority } = req.body;
    const employeeId = req.user.id; // Assuming user info is attached to req.user

    const newTask = new Task({
      title,
      description,
      projectId,
      dueDate,
      priority,
      employeeId
    });

    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get tasks for a specific employee
router.get('/employee/:employeeId', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ employeeId: req.params.employeeId });
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task status
router.patch('/:taskId', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.taskId,
      { status },
      { new: true } // Return the updated document
    );

    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 