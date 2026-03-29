const express = require('express');
const router = express.Router();
const { pool } = require('../db/database');
const { sendWelcomeEmail, sendNewsletterToAll } = require('../services/emailService');
const { generateBriefing } = require('../services/briefingService');

// POST /api/subscribe
router.post('/subscribe', async (req, res) => {
  const { email, name } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required.' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, is_active FROM email_subscribers WHERE email = $1',
      [email]
    );
    const existing = rows[0];

    if (existing) {
      if (existing.is_active) {
        return res.json({ success: true, message: 'Already subscribed.' });
      }
      await pool.query(
        'UPDATE email_subscribers SET is_active = TRUE, subscribed_at = NOW() WHERE email = $1',
        [email]
      );
    } else {
      const userId = req.user?.id || null;
      await pool.query(
        'INSERT INTO email_subscribers (email, name, user_id) VALUES ($1, $2, $3)',
        [email, name || null, userId]
      );
    }

    sendWelcomeEmail(email, name).catch(err =>
      console.error('Welcome email failed:', err.message)
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Subscribe error:', err);
    res.status(500).json({ error: 'Failed to subscribe.' });
  }
});

// DELETE /api/unsubscribe
router.delete('/unsubscribe', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required.' });

  await pool.query(
    'UPDATE email_subscribers SET is_active = FALSE WHERE email = $1',
    [email]
  );
  res.json({ success: true });
});

// POST /api/send-newsletter (admin only)
router.post('/send-newsletter', async (req, res) => {
  const secret = req.headers['x-admin-secret'];
  if (!secret || secret !== process.env.EMAIL_ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const briefing = await generateBriefing();
    const result = await sendNewsletterToAll(briefing.content, today);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Send newsletter error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cron/newsletter — called by Vercel cron at 7AM CST daily
router.get('/cron/newsletter', async (req, res) => {
  // Vercel sends this header to verify it's a legitimate cron call
  const authHeader = req.headers.authorization;
  if (
    process.env.NODE_ENV === 'production' &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const briefing = await generateBriefing();
    const result = await sendNewsletterToAll(briefing.content, today);
    console.log('Cron newsletter sent:', result);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Cron newsletter failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
