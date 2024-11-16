const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Debug middleware for this route
router.use((req, res, next) => {
  console.log('Attendance Route:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    params: req.params,
    query: req.query,
    body: req.body
  });
  next();
});

// Get monthly attendance
router.get('/monthly/:year/:month', auth, async (req, res) => {
  try {
    console.log('Processing monthly attendance request:', {
      params: req.params,
      user: req.user
    });

    const { year, month } = req.params;
    
    // Validate parameters
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      console.log('Invalid parameters:', { year, month });
      return res.status(400).json({ 
        message: 'Invalid year or month parameters',
        params: { year, month }
      });
    }

    // Generate mock data
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    const attendanceData = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(yearNum, monthNum - 1, day);
      // Skip weekends
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        attendanceData.push({
          date: date.toISOString(),
          status: Math.random() > 0.1 ? 'present' : 'absent',
          clockIn: '09:00 AM',
          clockOut: '05:00 PM',
          totalHours: 8
        });
      }
    }

    const summary = {
      totalDays: attendanceData.length,
      present: attendanceData.filter(a => a.status === 'present').length,
      absent: attendanceData.filter(a => a.status === 'absent').length,
      leaves: 0,
      holidays: daysInMonth - attendanceData.length
    };

    const response = {
      year: yearNum,
      month: monthNum,
      attendance: attendanceData,
      summary
    };

    console.log('Sending attendance response:', {
      year: yearNum,
      month: monthNum,
      dataLength: attendanceData.length
    });

    res.json(response);

  } catch (error) {
    console.error('Error in monthly attendance:', error);
    res.status(500).json({
      message: 'Error fetching monthly attendance',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

router.get('/user/:userId/today', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user has access to this data
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Not authorized to access this data' });
    }

    // Mock data
    res.json({
      date: new Date(),
      status: 'present',
      clockIn: '09:00 AM',
      clockOut: null,
      totalHours: null
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ message: 'Error fetching attendance' });
  }
});

module.exports = router; 