// Test connection endpoint
router.get('/test-connection', (req, res) => {
  res.json({ message: 'Connection successful' });
});

// Manager routes
router.get('/manager/team', auth, async (req, res) => {
  try {
    const team = await Employee.find({ managerId: req.user.id });
    res.json(team);
  } catch (err) {
    console.error('Error fetching team:', err);
    res.status(500).json({ message: 'Error fetching team data' });
  }
});

// ... other routes ... 