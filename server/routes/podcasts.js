const express = require('express');
const router = express.Router();
const { getPodcasts } = require('../services/podcastsService');

router.get('/', async (req, res) => {
  try {
    const podcasts = await getPodcasts();
    res.json(podcasts);
  } catch (err) {
    console.error('Podcasts error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
