const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get payslips for a specific employee
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user has access to this data
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Not authorized to access this data' });
    }

    // Mock data
    res.json([{
      _id: '1',
      month: 'March 2024',
      basicSalary: 5000,
      allowances: 1000,
      deductions: 500,
      netSalary: 5500,
      status: 'paid',
      paidOn: new Date()
    }]);
  } catch (error) {
    console.error('Error fetching payslip data:', error);
    res.status(500).json({ message: 'Error fetching payslip data' });
  }
});

module.exports = router; 