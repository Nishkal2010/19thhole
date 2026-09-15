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

// The deployed hostnames are listed explicitly because the previous callback
// ended in `callback(null, true)` for every unmatched origin: with
// credentials:true that reflected any site's origin and let it read authed
// responses. CLIENT_URL stays first so a custom domain needs no code change.
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://19thhole.vercel.app',
  'https://my-project-psi-seven-95.vercel.app',
  'http://localhost:5173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // No Origin header: same-origin navigations, curl, server-to-server.
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.warn(`[cors] blocked origin ${origin}`);
    return callback(null, false);
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
