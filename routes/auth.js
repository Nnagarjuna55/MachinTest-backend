const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');


router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt:', { email });
    
    if (!email || !password) {
      console.log('Missing credentials');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Admin login check
    if (email.toLowerCase() === 'admin@gmail.com' && password === 'admin123') {
      const token = jwt.sign(
        { id: 'admin', role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      return res.json({
        success: true,
        token,
        user: {
          id: 'admin',
          name: 'Admin',
          email: 'admin@gmail.com',
          role: 'admin',
        },
      });
    }

    // First check Employee model
    let user = await Employee.findOne({ email: email.toLowerCase() });
    let isEmployee = true;

    // If not found in Employee, check User model
    if (!user) {
      user = await User.findOne({ email: email.toLowerCase() });
      isEmployee = false;
    }

    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Verify password exists
    if (!user.password) {
      console.error('User has no password set:', email);
      return res.status(401).json({ message: 'Password not set for user' });
    }

    // Log the retrieved password for debugging (remove in production)
    console.log('Retrieved password from database:', user.password);

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch ? 'Yes' : 'No');

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Create token
    const token = jwt.sign(
      { 
        id: user._id.toString(),
        role: user.role,
        isEmployee: isEmployee 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmployee: isEmployee
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update the registration route to properly hash passwords
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate role
    const validRoles = ['hr', 'manager', 'ceo', 'employee'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password before creating user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user with hashed password
    user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role
    });

    await user.save();
    console.log('User created successfully:', {
      email: user.email,
      role: user.role
    });

    // Create token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Consolidate password reset into one route
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user's password
    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a verification route
router.get('/verify/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      email: user.email,
      name: user.name,
      role: user.role,
      hasPassword: !!user.password,
      passwordHash: user.password,
      passwordLength: user.password?.length
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add this temporary debug route
router.get('/check-user/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email.toLowerCase() });
    if (!user) {
      return res.json({ exists: false });
    }
    return res.json({
      exists: true,
      hasPassword: !!user.password,
      // Don't send the actual password in production!
      passwordLength: user.password?.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/list-all-users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    const employees = await Employee.find().select('-password');

    res.json({ users, employees });
  } catch (error) {
    console.error('Error fetching users and employees:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add route for updating user or employee profile
router.put('/update-profile/:id', async (req, res) => {
  try {
    const { name, email, role, image } = req.body; // Extract fields you want to update

    // Validate email format if necessary
    if (email && !validateEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Find the user or employee by their ID
    let user = await User.findById(req.params.id);
    if (!user) {
      user = await Employee.findById(req.params.id); // Check employee if not in User model
      if (!user) {
        return res.status(404).json({ message: 'User or Employee not found' });
      }
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email.toLowerCase(); // Ensure email is lowercase
    if (role) user.role = role;
    if (image) user.image = image; // Handle image upload (URL or base64 depending on your setup)

    // Save updated user data
    await user.save();

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image, // Send updated image (if applicable)
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to validate email (optional)
function validateEmail(email) {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}



module.exports = router;