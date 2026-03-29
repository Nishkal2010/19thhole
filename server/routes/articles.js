const express = require('express');
const router = express.Router();
const { getArticles } = require('../services/articlesService');

router.get('/', async (req, res) => {
  try {
    const articles = await getArticles();
    res.json(articles);
  } catch (err) {
    console.error('Articles error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
