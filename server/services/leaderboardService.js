const fetch = require('node-fetch');

function parseCompetitors(competitors, isFinal) {
  if (!competitors || competitors.length === 0) return [];

  // Determine tied positions: players sharing the same `order` value are tied
  const orderCounts = {};
  competitors.forEach(c => {
    orderCounts[c.order] = (orderCounts[c.order] || 0) + 1;
  });

  return competitors.slice(0, 20).map(c => {
    const isTied = orderCounts[c.order] > 1;
    const position = isTied ? `T${c.order}` : String(c.order);

    // Today's score = most recent round that has hole-level data
    const roundsWithData = (c.linescores || []).filter(
      ls => ls.linescores && ls.linescores.length > 0
    );
    const latestRound = roundsWithData[roundsWithData.length - 1];
    const today = latestRound?.displayValue || '-';

    // Thru: count holes in current round; 18 = finished (F)
    let thru = '-';
    if (isFinal) {
      thru = 'F';
    } else if (latestRound) {
      const holesPlayed = latestRound.linescores.length;
      thru = holesPlayed >= 18 ? 'F' : String(holesPlayed);
    }

    // Total score: ESPN returns it as a string like "-18", "E", "+3"
    let score = c.score || 'E';
    if (score === '0') score = 'E';

    return {
      position,
      name: c.athlete?.displayName || 'Unknown',
      score,
      today,
      thru,
    };
  });
}

async function fetchTourData(tourSlug) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/golf/${tourSlug}/scoreboard`;
  const res = await fetch(url, {
    timeout: 8000,
    headers: { 'Accept-Encoding': 'gzip', 'User-Agent': 'The19thHole/1.0' },
  });
  if (!res.ok) return null;

  const data = await res.json();
  const events = data.events || [];
  if (events.length === 0) return null;

  // Prefer live → completed → any
  const event =
    events.find(e => e.competitions?.[0]?.status?.type?.state === 'in') ||
    events.find(e => e.competitions?.[0]?.status?.type?.state === 'post') ||
    events[0];

  const competition = event.competitions?.[0];
  if (!competition) return null;

  const state = competition.status?.type?.state;
  const isLive = state === 'in';
  const isFinal = state === 'post';
  const period = competition.status?.period || event.status?.period || 1;

  const players = parseCompetitors(competition.competitors, isFinal);

  return {
    tour: tourSlug === 'pga' ? 'PGA Tour' : 'LIV Golf',
    name: event.name || event.shortName,
    status: competition.status?.type?.description || event.status?.type?.description || 'Scheduled',
    round: period ? `Round ${period}` : '',
    isLive,
    isFinal,
    players,
  };
}

async function getLeaderboards() {
  const [pgaResult, livResult] = await Promise.allSettled([
    fetchTourData('pga'),
    fetchTourData('liv'),
  ]);

  const events = [pgaResult, livResult]
    .filter(r => r.status === 'fulfilled' && r.value !== null)
    .map(r => r.value);

  if (events.length === 0) {
    return {
      events: [{
        tour: 'PGA Tour',
        name: 'No Tournament Data',
        status: 'Unavailable',
        round: '',
        isLive: false,
        isFinal: false,
        players: [],
        message: 'Leaderboard data is temporarily unavailable.',
      }],
      lastUpdated: new Date().toISOString(),
    };
  }

  return { events, lastUpdated: new Date().toISOString() };
}

module.exports = { getLeaderboards };
