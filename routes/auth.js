const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Employee = require('../models/Employee');

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email });

    // Admin login check
    if (email === 'admin@gmail.com' && password === 'admin123') {
      const token = jwt.sign(
        { id: 'admin', email, role: 'admin', name: 'Admin' },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      return res.json({
        success: true,
        token,
        user: {
          id: 'admin',
          email,
          role: 'admin',
          name: 'Admin'
        }
      });
    }

    // Employee login check
    const employee = await Employee.findOne({ email });
    console.log('Found employee:', employee ? 'yes' : 'no');
    
    if (!employee) {
      console.log('No employee found with email:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Log password comparison
    console.log('Comparing passwords...');
    const isMatch = await bcrypt.compare(password, employee.password);
    console.log('Password match:', isMatch ? 'yes' : 'no');
    
    if (!isMatch) {
      console.log('Password does not match for email:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Create token
    const token = jwt.sign(
      {
        id: employee._id,
        email: employee.email,
        role: employee.role,
        name: employee.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Log successful login
    console.log('Login successful for:', email, 'with role:', employee.role);

    res.json({
      success: true,
      token,
      user: {
        id: employee._id,
        email: employee.email,
        name: employee.name,
        role: employee.role,
        designation: employee.designation
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    // Find employee
    const employee = await Employee.findOne({ email });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    employee.password = hashedPassword;
    await employee.save();

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

// TEMPORARY ROUTE - Remove in production
router.get('/check-credentials/:email', async (req, res) => {
  try {
    const employee = await Employee.findOne({ email: req.params.email });
    if (!employee) {
      return res.json({ exists: false });
    }
    res.json({
      exists: true,
      employee: {
        email: employee.email,
        name: employee.name,
        hashedPassword: employee.password
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// TEST ROUTE - Remove in production
router.get('/test-credentials/:email', async (req, res) => {
  try {
    const employee = await Employee.findOne({ email: req.params.email });
    if (!employee) {
      return res.json({ exists: false });
    }

    res.json({
      exists: true,
      employee: {
        email: employee.email,
        name: employee.name,
        role: employee.role,
        hasPassword: !!employee.password
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 