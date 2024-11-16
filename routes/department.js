const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Department = require('../models/Department');

// Get department list
router.get('/list', auth, async (req, res) => {
  try {
    const departments = await Department.find()
      .select('name employeeCount')
      .lean();

    // If no departments exist yet, return sample data
    if (!departments.length) {
      return res.json([
        { id: '1', name: 'Engineering', employeeCount: 0 },
        { id: '2', name: 'HR', employeeCount: 0 },
        { id: '3', name: 'Marketing', employeeCount: 0 }
      ]);
    }

    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ 
      message: 'Error fetching departments',
      error: error.message 
    });
  }
});

// Get department stats
router.get('/stats', auth, async (req, res) => {
  try {
    res.json({
      totalEmployees: 22,
      departments: 3,
      budget: 100000,
      expenses: 75000
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching department stats' });
  }
});

module.exports = router; 