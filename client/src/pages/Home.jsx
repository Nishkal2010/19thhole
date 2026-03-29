import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import BriefingCard from '../components/BriefingCard';
import { useAuth } from '../contexts/AuthContext';
import './Home.css';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function scoreColor(score) {
  if (!score || score === 'E' || score === '0') return 'var(--text-primary)';
  if (String(score).startsWith('-')) return 'var(--green-accent)';
  return 'var(--red-accent)';
}

export default function Home() {
  const { user } = useAuth();

  const [briefing, setBriefing] = useState(null);
  const [briefingLoading, setBriefingLoading] = useState(true);
  const [briefingError, setBriefingError] = useState(null);

  const [articles, setArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(true);

  const [leaderboard, setLeaderboard] = useState(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  const [subEmail, setSubEmail] = useState('');
  const [subStatus, setSubStatus] = useState('idle'); // idle | loading | success | error
  const [subError, setSubError] = useState('');

  // Pre-fill email from Google account
  useEffect(() => {
    if (user?.email) setSubEmail(user.email);
  }, [user]);

  async function handleSubscribe(e) {
    e.preventDefault();
    if (!subEmail) return;
    setSubStatus('loading');
    setSubError('');
    try {
      await axios.post('/api/subscribe', { email: subEmail, name: user?.name }, { withCredentials: true });
      setSubStatus('success');
    } catch (err) {
      setSubError(err.response?.data?.error || 'Something went wrong. Try again.');
      setSubStatus('error');
    }
  }

  useEffect(() => {
    axios.get('/api/briefing', { withCredentials: true })
      .then(res => setBriefing(res.data))
      .catch(err => setBriefingError(err.response?.data?.message || 'Failed to load briefing'))
      .finally(() => setBriefingLoading(false));

    axios.get('/api/articles', { withCredentials: true })
      .then(res => setArticles(res.data))
      .catch(() => setArticles([]))
      .finally(() => setArticlesLoading(false));

    axios.get('/api/leaderboard', { withCredentials: true })
      .then(res => setLeaderboard(res.data))
      .catch(() => setLeaderboard(null))
      .finally(() => setLeaderboardLoading(false));
  }, []);

  const activeEvent = leaderboard?.events?.[0];
  const topPlayers = activeEvent?.players?.slice(0, 5) || [];
  const isLivEvent = activeEvent?.tour?.toLowerCase().includes('liv');
  const sectionLabel = activeEvent?.status?.toLowerCase().includes('in') ? 'IN PROGRESS' : 'LATEST RESULTS';

  return (
    <div className="home-page page-fade">
      <div className="container">

        {/* Daily Briefing */}
        <section className="home-section">
          <BriefingCard briefing={briefing} loading={briefingLoading} error={briefingError} />
        </section>

        {/* Email Subscription */}
        <section className="home-section">
          <div className="subscribe-card">
            <p className="subscribe-eyebrow">GET IT IN YOUR INBOX</p>
            <p className="subscribe-sub">The 5-minute golf briefing delivered every morning at 7AM.</p>
            {subStatus === 'success' ? (
              <div className="subscribe-success">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--green-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>You're in. Check your inbox.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="subscribe-form">
                <input
                  type="email"
                  className="subscribe-input"
                  placeholder="your@email.com"
                  value={subEmail}
                  onChange={e => setSubEmail(e.target.value)}
                  required
                />
                {subError && <p className="subscribe-error">{subError}</p>}
                <button
                  type="submit"
                  className="subscribe-btn"
                  disabled={subStatus === 'loading'}
                >
                  {subStatus === 'loading' ? 'Subscribing…' : 'Send It To Me Daily'}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Latest News */}
        <section className="home-section">
          <h2 className="home-section-label">LATEST NEWS</h2>
          {articlesLoading ? (
            <div className="news-scroll">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="news-card-skeleton">
                  <div className="skeleton" style={{ width: '100%', height: 120, borderRadius: '10px 10px 0 0' }} />
                  <div style={{ padding: '10px' }}>
                    <div className="skeleton" style={{ height: 13, marginBottom: 6 }} />
                    <div className="skeleton" style={{ height: 13, width: '70%', marginBottom: 6 }} />
                    <div className="skeleton" style={{ height: 11, width: '45%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="news-scroll">
              {articles.slice(0, 8).map((article, i) => (
                <a
                  key={article.id || i}
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="news-card"
                >
                  {article.image ? (
                    <img
                      src={article.image}
                      alt={article.title}
                      className="news-card-img"
                      loading="lazy"
                      onError={e => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="news-card-img-placeholder" />
                  )}
                  <div className="news-card-body">
                    <p className="news-card-title">{article.title}</p>
                    <p className="news-card-source">{article.source}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>

        {/* Quick Scores */}
        <section className="home-section">
          <h2 className="home-section-label">{activeEvent ? sectionLabel : 'SCORES'}</h2>
          {leaderboardLoading ? (
            <div className="quick-scores-card">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="skeleton" style={{ height: 38, marginBottom: 4, borderRadius: 6 }} />
              ))}
            </div>
          ) : !activeEvent || topPlayers.length === 0 ? (
            <div className="quick-scores-empty">
              <p>No active tournaments right now. Check back during tournament week.</p>
            </div>
          ) : (
            <div className="quick-scores-card">
              <p className="quick-event-name">{activeEvent.name}</p>
              {topPlayers.map((player, i) => (
                <div key={i} className="quick-score-row">
                  <span className={`quick-pos${i < 3 ? ' top-pos' : ''}`}>{player.position}</span>
                  <span className="quick-player">{player.name}</span>
                  <span className={`tour-pill${isLivEvent ? ' liv' : ' pga'}`}>
                    {isLivEvent ? 'LIV' : 'PGA'}
                  </span>
                  <span className="quick-score" style={{ color: scoreColor(player.score) }}>
                    {player.score}
                  </span>
                </div>
              ))}
              <Link to="/leaderboard" className="quick-see-all">See Full Leaderboard</Link>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
