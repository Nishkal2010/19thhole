const express = require('express');
const router = express.Router();
const { getLeaderboards } = require('../services/leaderboardService');

router.get('/', async (req, res) => {
  try {
    const data = await getLeaderboards();
    res.json(data);
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
