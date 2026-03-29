const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { pool } = require('../db/database');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE google_id = $1',
      [profile.id]
    );
    const existing = rows[0];

    if (existing) {
      await pool.query(
        'UPDATE users SET name = $1, picture = $2 WHERE google_id = $3',
        [profile.displayName, profile.photos?.[0]?.value || null, profile.id]
      );
      return done(null, { ...existing, name: profile.displayName, picture: profile.photos?.[0]?.value });
    }

    const { rows: inserted } = await pool.query(
      'INSERT INTO users (google_id, email, name, picture) VALUES ($1, $2, $3, $4) RETURNING *',
      [profile.id, profile.emails?.[0]?.value || null, profile.displayName, profile.photos?.[0]?.value || null]
    );
    return done(null, inserted[0]);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, rows[0] || null);
  } catch (err) {
    done(err);
  }
});
