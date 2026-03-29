require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const pgSession = require('connect-pg-simple')(session);
const { pool, initDb } = require('./db/database');

const authRoutes = require('./routes/auth');
const briefingRoutes = require('./routes/briefing');
const leaderboardRoutes = require('./routes/leaderboard');
const articlesRoutes = require('./routes/articles');
const podcastsRoutes = require('./routes/podcasts');
const newsletterRoutes = require('./routes/newsletter');

require('./config/passport');

const app = express();
const PORT = process.env.PORT || 3001;

// Init DB tables on startup
initDb().catch(err => console.error('DB init error:', err.message));

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(null, true); // allow all origins for Vercel preview URLs
  },
  credentials: true,
}));
app.use(express.json());

app.use(session({
  store: new pgSession({
    pool,
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || 'golf-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
  },
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/api/auth', authRoutes);
app.use('/api/briefing', briefingRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/podcasts', podcastsRoutes);
app.use('/api', newsletterRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Local dev only
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
