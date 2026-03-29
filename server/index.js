require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const { initDb } = require('./db/database');

const authRoutes = require('./routes/auth');
const briefingRoutes = require('./routes/briefing');
const leaderboardRoutes = require('./routes/leaderboard');
const articlesRoutes = require('./routes/articles');
const podcastsRoutes = require('./routes/podcasts');
const newsletterRoutes = require('./routes/newsletter');

require('./config/passport');

const app = express();
const PORT = process.env.PORT || 3001;

initDb().catch(err => console.error('DB init error:', err.message));

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use('/api/auth', authRoutes);
app.use('/api/briefing', briefingRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/podcasts', podcastsRoutes);
app.use('/api', newsletterRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
