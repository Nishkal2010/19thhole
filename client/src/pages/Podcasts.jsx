import { useState, useEffect } from 'react';
import axios from 'axios';
import './Podcasts.css';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatDuration(dur) {
  if (!dur) return null;
  if (typeof dur === 'string' && dur.includes(':')) return dur;
  const secs = parseInt(dur);
  if (isNaN(secs)) return typeof dur === 'string' ? dur : null;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function Podcasts() {
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('/api/podcasts', { withCredentials: true })
      .then(res => setEpisodes(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const meta = (ep) => [formatDuration(ep.duration), timeAgo(ep.pubDate)].filter(Boolean).join(' · ');

  return (
    <div className="podcasts-page page-fade">
      <div className="container">

        <div className="podcasts-header">
          <span className="podcasts-title">PODCASTS</span>
        </div>

        {loading && (
          <div className="podcasts-loading">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="episode-card">
                <div className="skeleton" style={{ width: 72, height: 72, borderRadius: 8, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 11, width: '40%', marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 15, marginBottom: 5 }} />
                  <div className="skeleton" style={{ height: 15, width: '80%', marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 11, width: '35%' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="podcasts-empty"><p>Failed to load podcasts.</p></div>
        )}

        {!loading && !error && episodes.length === 0 && (
          <div className="podcasts-empty"><p>No podcast episodes available right now.</p></div>
        )}

        {!loading && !error && episodes.length > 0 && (
          <div className="episodes-list">
            {episodes.map((ep, i) => (
              <a
                key={ep.id || i}
                href={ep.link || ep.audioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="episode-card"
              >
                <div className="episode-artwork">
                  {ep.showImage ? (
                    <img
                      src={ep.showImage}
                      alt={ep.show}
                      className="episode-artwork-img"
                      onError={e => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <span className="episode-artwork-initials">
                      {ep.show?.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </span>
                  )}
                </div>
                <div className="episode-body">
                  <span className="episode-show-name">{ep.show}</span>
                  <p className="episode-title">{ep.title}</p>
                  {meta(ep) && <span className="episode-meta-text">{meta(ep)}</span>}
                </div>
                <div className="episode-play">
                  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <polygon points="5,3 19,12 5,21" fill="var(--gold)" />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
