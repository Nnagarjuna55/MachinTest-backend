const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.get('/courses', auth, async (req, res) => {
  try {
    res.json([
      { id: 1, title: 'Leadership Training', duration: '2 weeks' },
      { id: 2, title: 'Technical Skills', duration: '4 weeks' }
    ]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching courses' });
  }
});

module.exports = router; 