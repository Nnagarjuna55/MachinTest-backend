const express = require('express');
const router = express.Router();
const employeeRoutes = require('./employees');

router.use('/employees', employeeRoutes);

module.exports = router; 