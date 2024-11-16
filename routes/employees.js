const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Employee = require('../models/Employee');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const roleAuth = require('../middleware/roleAuth');
const mongoose = require('mongoose');
const User = require('../models/User');

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Get all employees
router.get('/', [auth, roleAuth('admin', 'HR', 'Manager')], async (req, res) => {
  try {
    const employees = await Employee.find().select('-password');
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get employee count statistics
router.get('/count', auth, async (req, res) => {
  try {
    const total = await Employee.countDocuments();
    const male = await Employee.countDocuments({ gender: 'Male' });
    const female = await Employee.countDocuments({ gender: 'Female' });
    const byDesignation = await Employee.aggregate([
      { $group: { _id: '$designation', count: { $sum: 1 } } }
    ]);
    const byCourse = await Employee.aggregate([
      { $unwind: '$courses' },
      { $group: { _id: '$courses', count: { $sum: 1 } } }
    ]);

    res.json({
      total,
      male,
      female,
      byDesignation,
      byCourse
    });
  } catch (error) {
    console.error('Error getting counts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add the new search route here
router.get('/search', auth, async (req, res) => {
  try {
    const searchQuery = req.query.q;
    if (!searchQuery) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const searchRegex = new RegExp(searchQuery, 'i');
    const employees = await Employee.find({
      $or: [
        { name: searchRegex },
        { email: searchRegex },
        { designation: searchRegex }
      ]
    }).select('-password');

    res.json(employees);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Error searching employees' });
  }
});

// Create new employee
router.post('/', [auth, roleAuth('admin', 'hr')], upload.single('image'), async (req, res) => {
  try {
    const { password, role, ...otherData } = req.body;

    // Validate password
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Validate role
    const validRoles = ['employee', 'hr', 'manager', 'ceo'];
    const normalizedRole = role ? role.toLowerCase() : 'employee';

    if (!validRoles.includes(normalizedRole)) {
      return res.status(400).json({ 
        message: 'Invalid role specified. Valid roles are: employee, hr, manager, ceo' 
      });
    }

    // Create new employee (password will be hashed by pre-save middleware)
    const employee = new Employee({
      ...otherData,
      password,
      role: normalizedRole,
      image: req.file ? req.file.filename : null
    });

    await employee.save();

    res.status(201).json({
      success: true,
      employee: {
        ...employee.toObject(),
        password: undefined
      }
    });

  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get single employee
router.get('/:id', auth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).select('-password');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update employee
router.put('/:id', [auth, roleAuth('admin', 'HR')], upload.single('image'), async (req, res) => {
  try {
    let updateData = { ...req.body };
    delete updateData.password; // Don't update password through this route
    
    // Handle courses if it's a string
    if (typeof updateData.courses === 'string') {
      updateData.courses = JSON.parse(updateData.courses);
    }

    // Add image if uploaded
    if (req.file) {
      updateData.image = req.file.filename;
    }

    // Ensure role isn't changed unless by admin
    if (req.user.role !== 'admin') {
      delete updateData.role;
    }

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({
      success: true,
      employee
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(400).json({ 
      message: 'Error updating employee',
      error: error.message 
    });
  }
});

// Delete employee
router.delete('/:id', auth, async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Temporary route to check employee (REMOVE IN PRODUCTION)
router.get('/check/:email', async (req, res) => {
  try {
    const employee = await Employee.findOne({ email: req.params.email });
    res.json({
      exists: !!employee,
      employee: employee ? {
        email: employee.email,
        name: employee.name
      } : null
    });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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
        designation: employee.designation,
        hasPassword: !!employee.password
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// TEMPORARY ROUTE - Remove in production
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// HR Stats
router.get('/hr-stats', [auth, roleAuth('HR')], async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const departments = await Employee.distinct('designation');
    const recentHires = await Employee.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('-password');

    res.json({
      totalEmployees,
      departments,
      recentHires
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Manager Stats
router.get('/manager-stats', auth, async (req, res) => {
  try {
    // Debug logging
    console.log('Request received for manager-stats');
    console.log('Auth token user:', req.user);

    // Validate user
    if (!req.user || !req.user.id) {
      console.log('No user found in request');
      return res.status(401).json({ 
        message: 'Authentication required',
        error: 'No user found in request'
      });
    }

    // Basic validation of the ID
    if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
      console.log('Invalid user ID format:', req.user.id);
      return res.status(400).json({
        message: 'Invalid user ID format',
        error: 'The provided user ID is not valid'
      });
    }

    // Get the manager's ID
    const managerId = req.user.id;
    console.log('Looking up stats for manager:', managerId);

    // First, verify the manager exists
    const manager = await Employee.findById(managerId);
    if (!manager) {
      console.log('Manager not found in database');
      return res.status(404).json({
        message: 'Manager not found',
        error: 'No employee found with the provided ID'
      });
    }

    // Get team members count
    const teamMembersCount = await Employee.countDocuments({ managerId });
    console.log('Team members count:', teamMembersCount);

    // Get active team members count
    const activeTeamMembersCount = await Employee.countDocuments({
      managerId,
      status: 'active'
    });
    console.log('Active team members count:', activeTeamMembersCount);

    // Get department breakdown
    const departmentBreakdown = await Employee.aggregate([
      { $match: { managerId: mongoose.Types.ObjectId(managerId) } },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      }
    ]);
    console.log('Department breakdown:', departmentBreakdown);

    // Prepare response
    const response = {
      managerId,
      stats: {
        total: teamMembersCount,
        active: activeTeamMembersCount,
        inactive: teamMembersCount - activeTeamMembersCount
      },
      departmentBreakdown,
      timestamp: new Date()
    };

    console.log('Sending response:', response);
    res.json(response);

  } catch (error) {
    console.error('Error in manager-stats:', error);
    console.error('Error stack:', error.stack);
    
    // Send a more detailed error response
    res.status(500).json({
      message: 'Error fetching manager stats',
      error: {
        message: error.message,
        type: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
});

// CEO Stats
router.get('/ceo-stats', [auth, roleAuth('CEO')], async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const departments = await Employee.distinct('designation');
    
    res.json({
      totalEmployees,
      departments,
      performance: {},
      growth: {}
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// TEMPORARY ROUTE - Remove in production
router.post('/reset-test-password', async (req, res) => {
  try {
    const { email } = req.body;
    const employee = await Employee.findOne({ email });
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Set password to "123456" for testing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("123456", salt);
    
    employee.password = hashedPassword;
    await employee.save();

    res.json({ 
      success: true, 
      message: 'Password reset to 123456',
      passwordHash: hashedPassword
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// TEMPORARY ROUTE - Remove in production
router.get('/check-password/:email', async (req, res) => {
  try {
    const employee = await Employee.findOne({ email: req.params.email });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json({
      passwordHash: employee.password,
      passwordLength: employee.password.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;