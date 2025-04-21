const express = require('express');
const router = express.Router();
const healthRoutes = require('./health'); // Ensure this is imported
const leaveRoutes = require('./leaves'); // Ensure this is imported
const attendanceRoutes = require('./attendance'); // Ensure this is imported
const payrollRoutes = require('./payroll'); // Ensure this is imported

// Register health route
router.use('/health', healthRoutes);

// Register other routes
router.use('/leaves', leaveRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/payroll', payrollRoutes);

module.exports = router;