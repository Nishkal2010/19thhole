const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const { sessionSecret } = require('../config/secrets');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${CLIENT_URL}/?error=auth_failed`, session: false }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email, name: req.user.name, picture: req.user.picture },
      sessionSecret(),
      { expiresIn: '7d' }
    );
    res.cookie('auth_token', token, COOKIE_OPTIONS);
    res.redirect(CLIENT_URL);
  }
);

router.get('/me', (req, res) => {
  const token = req.cookies?.auth_token;
  if (!token) return res.json({ user: null });
  try {
    const user = jwt.verify(token, sessionSecret());
    return res.json({ user });
  } catch {
    return res.json({ user: null });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('auth_token', COOKIE_OPTIONS);
  res.json({ success: true });
});

module.exports = router;
