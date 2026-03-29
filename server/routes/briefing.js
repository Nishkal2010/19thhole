const express = require('express');
const router = express.Router();
const { pool } = require('../db/database');
const { generateBriefing } = require('../services/briefingService');

router.get('/', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { rows } = await pool.query('SELECT * FROM briefings WHERE date = $1', [today]);
    if (rows[0]) {
      return res.json({ briefing: rows[0].content, date: today, cached: true });
    }

    const briefing = await generateBriefing();

    try {
      await pool.query(
        'INSERT INTO briefings (content, date) VALUES ($1, $2) ON CONFLICT (date) DO UPDATE SET content = EXCLUDED.content',
        [briefing, today]
      );
    } catch (e) {
      console.error('Error caching briefing:', e.message);
    }

    res.json({ briefing, date: today, cached: false });
  } catch (err) {
    console.error('Briefing error:', err);
    res.status(500).json({ error: 'Failed to generate briefing', message: err.message });
  }
});

router.post('/regenerate', async (req, res) => {
  try {
    const briefing = await generateBriefing();
    const today = new Date().toISOString().split('T')[0];
    await pool.query(
      'INSERT INTO briefings (content, date) VALUES ($1, $2) ON CONFLICT (date) DO UPDATE SET content = EXCLUDED.content',
      [briefing, today]
    );
    res.json({ briefing, date: today });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
