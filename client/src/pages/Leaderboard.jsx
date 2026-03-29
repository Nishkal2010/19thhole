import { useState, useEffect } from 'react';
import axios from 'axios';
import './Leaderboard.css';

function scoreColor(score) {
  if (!score || score === 'E' || score === '0') return 'var(--text-primary)';
  if (String(score).startsWith('-')) return 'var(--green-accent)';
  return 'var(--red-accent)';
}

export default function Leaderboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tourFilter, setTourFilter] = useState('PGA');
  const [activeEventIndex, setActiveEventIndex] = useState(0);

  useEffect(() => {
    axios.get('/api/leaderboard', { withCredentials: true })
      .then(res => setData(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const events = data?.events || [];
  const filteredEvents = events.filter(e => {
    const isLiv = e.tour?.toLowerCase().includes('liv');
    return tourFilter === 'LIV' ? isLiv : !isLiv;
  });
  const activeEvent = filteredEvents[activeEventIndex] ?? filteredEvents[0];

  const handleTourChange = (tour) => {
    setTourFilter(tour);
    setActiveEventIndex(0);
  };

  const isLivActive = activeEvent?.tour?.toLowerCase().includes('liv');

  function getStatusLabel(event) {
    if (!event) return null;
    if (event.isLive) return { live: true, text: 'LIVE' };
    if (event.isFinal) return { live: false, text: `FINAL — ${event.name}` };
    return { live: false, text: event.status };
  }
  const statusLabel = getStatusLabel(activeEvent);

  return (
    <div className="scores-page page-fade">
      <div className="container">

        {/* Tour filter toggle */}
        <div className="tour-toggle">
          <button
            className={`tour-toggle-btn${tourFilter === 'PGA' ? ' active' : ''}`}
            onClick={() => handleTourChange('PGA')}
          >
            PGA TOUR
          </button>
          <button
            className={`tour-toggle-btn${tourFilter === 'LIV' ? ' active' : ''}`}
            onClick={() => handleTourChange('LIV')}
          >
            LIV GOLF
          </button>
        </div>

        {/* Tournament selector */}
        {!loading && filteredEvents.length > 1 && (
          <div className="tournament-scroll">
            {filteredEvents.map((event, i) => (
              <button
                key={i}
                className={`tournament-pill${i === activeEventIndex ? ' active' : ''}`}
                onClick={() => setActiveEventIndex(i)}
              >
                {event.name}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="leaderboard-loading">
            <div className="skeleton" style={{ height: 20, width: '60%', marginBottom: 20 }} />
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="skeleton" style={{ height: 52, marginBottom: 1, borderRadius: i === 1 ? '8px 8px 0 0' : i === 8 ? '0 0 8px 8px' : 0 }} />
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="scores-empty">
            <p>Failed to load scores.</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredEvents.length === 0 && (
          <div className="scores-empty">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <p>No active tournaments right now.<br />Check back during tournament week.</p>
          </div>
        )}

        {/* Leaderboard */}
        {!loading && !error && activeEvent && (
          <div className="leaderboard-wrapper">
            <div className="leaderboard-event-header">
              <div>
                <span className={`event-tour-badge${isLivActive ? ' liv' : ' pga'}`}>
                  {isLivActive ? 'LIV Golf' : 'PGA Tour'}
                </span>
                <h2 className="event-name">{activeEvent.name}</h2>
              </div>
              {statusLabel && (
                <div className="event-status-info">
                  {statusLabel.live && <span className="status-dot live" />}
                  <span className={`status-text${statusLabel.live ? ' status-live' : ''}`}>
                    {statusLabel.text}
                  </span>
                  {activeEvent.isLive && activeEvent.round && (
                    <span className="round-label">{activeEvent.round}</span>
                  )}
                </div>
              )}
            </div>

            {activeEvent.message && (
              <p className="event-message">{activeEvent.message}</p>
            )}

            {activeEvent.players && activeEvent.players.length > 0 ? (
              <div className="leaderboard-table">
                <div className="table-header-row">
                  <span className="col-pos">POS</span>
                  <span className="col-player">PLAYER</span>
                  <span className="col-score">SCORE</span>
                  <span className="col-today">TODAY</span>
                  <span className="col-thru">THRU</span>
                </div>
                {activeEvent.players.map((player, j) => (
                  <div key={j} className={`table-player-row${j % 2 === 0 ? ' row-even' : ' row-odd'}`}>
                    <span className={`col-pos pos-num${j < 3 ? ' top-three' : ''}`}>
                      {player.position}
                    </span>
                    <span className="col-player player-name-cell">
                      {player.name}
                    </span>
                    <span className="col-score score-val" style={{ color: scoreColor(player.score) }}>
                      {player.score}
                    </span>
                    <span className="col-today today-val" style={{ color: scoreColor(player.today) }}>
                      {player.today || '-'}
                    </span>
                    <span className="col-thru thru-val">{player.thru || '-'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="scores-empty">
                <p>No player data available.</p>
              </div>
            )}

            {data?.lastUpdated && (
              <p className="last-updated-text">
                Updated {new Date(data.lastUpdated).toLocaleTimeString()}
              </p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
