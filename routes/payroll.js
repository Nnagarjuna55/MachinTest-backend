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

// Add this route to your existing payroll.js file
router.get('/salary-details', auth, async (req, res) => {
  try {
    // Mock data for salary details
    const salaryDetails = {
      basicSalary: 5000,
      totalAllowances: 1000,
      netSalary: 5500,
      earnings: {
        basic: 5000,
        bonus: 500
      },
      deductions: {
        tax: 500,
        insurance: 200
      }
    };

    res.json(salaryDetails);
  } catch (error) {
    console.error('Error fetching salary details:', error);
    res.status(500).json({ message: 'Error fetching salary details' });
  }
});

module.exports = router; 