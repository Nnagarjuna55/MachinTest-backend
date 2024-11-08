const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Employee = require('../models/Employee');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const roleAuth = require('../middleware/roleAuth');

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
router.post('/', [auth, roleAuth('admin', 'HR')], upload.single('image'), async (req, res) => {
  try {
    const { password, ...otherData } = req.body;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const employeeData = {
      ...otherData,
      password: hashedPassword,
      image: req.file ? req.file.filename : null,
      role: 'employee'
    };

    if (typeof employeeData.courses === 'string') {
      employeeData.courses = JSON.parse(employeeData.courses);
    }

    const employee = new Employee(employeeData);
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
    res.status(400).json({ 
      message: 'Error creating employee', 
      error: error.message 
    });
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
router.get('/manager-stats', [auth, roleAuth('Manager')], async (req, res) => {
  try {
    const teamMembers = await Employee.countDocuments({ designation: 'Employee' });
    
    res.json({
      teamMembers,
      projects: [],
      performance: {}
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
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

module.exports = router;