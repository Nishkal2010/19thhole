const RSSParser = require('rss-parser');

const parser = new RSSParser({
  timeout: 10000,
  headers: { 'User-Agent': 'Mozilla/5.0 Podcatcher/1.0' },
  customFields: {
    item: [['itunes:duration', 'duration'], ['itunes:image', 'itunesImage']],
    feed: [['itunes:image', 'itunesImage']]
  }
});

// All URLs verified working as of 2026-03-28
const PODCAST_FEEDS = [
  {
    name: 'No Laying Up',
    url: 'https://feeds.megaphone.fm/nolayingup',
    description: 'Unfiltered golf conversation',
    color: '#1B4332',
  },
  {
    name: 'Fore Play',
    url: 'https://mcsorleys.barstoolsports.com/feed/fore-play',
    description: 'Barstool Golf Podcast',
    color: '#C9A84C',
  },
  {
    name: 'Golf Channel Podcast',
    url: 'https://feeds.simplecast.com/pArSbzdh',
    description: 'Golf Channel with Rex & Lav',
    color: '#2D6A4F',
  },
  {
    name: 'The Fried Egg',
    url: 'https://feeds.megaphone.fm/CLM3678709291',
    description: 'Golf architecture and culture',
    color: '#1B4332',
  },
  {
    name: 'Good Good Golf',
    url: 'https://feeds.fireside.fm/good-good/rss',
    description: 'Good Good crew podcast',
    color: '#2D6A4F',
  },
  {
    name: 'Trap Draw',
    url: 'https://feeds.megaphone.fm/trapdraw',
    description: 'LIV Golf focused podcast',
    color: '#D4A017',
  },
  {
    name: 'Claude Harmon III Golf',
    url: 'https://www.omnycontent.com/d/playlist/e73c998e-6e60-432f-8610-ae210140c5b1/652edbb0-2b61-480e-960b-aec401207c41/ecdae7ac-299b-45f9-b7c2-aec401207c67/podcast.rss',
    description: 'Golf instruction and insight',
    color: '#1B4332',
  },
];

async function getPodcasts() {
  const allEpisodes = [];

  const results = await Promise.allSettled(
    PODCAST_FEEDS.map(feed => parser.parseURL(feed.url))
  );

  results.forEach((result, i) => {
    const feedInfo = PODCAST_FEEDS[i];
    if (result.status === 'fulfilled') {
      const feedImage = result.value.itunesImage?.['$']?.href || result.value.image?.url || null;
      result.value.items.slice(0, 5).forEach(item => {
        const audioUrl = item.enclosure?.url || null;
        allEpisodes.push({
          id: item.guid || item.link,
          show: feedInfo.name,
          showDescription: feedInfo.description,
          showColor: feedInfo.color,
          showImage: feedImage,
          title: item.title,
          pubDate: item.pubDate || item.isoDate,
          duration: item.duration || null,
          link: item.link || audioUrl,
          audioUrl,
          summary: (item.contentSnippet || '').slice(0, 150),
        });
      });
    } else {
      console.error(`Podcast ${feedInfo.name} failed:`, results[i].reason?.message);
    }
  });

  allEpisodes.sort((a, b) => {
    const dateA = a.pubDate ? new Date(a.pubDate) : new Date(0);
    const dateB = b.pubDate ? new Date(b.pubDate) : new Date(0);
    return dateB - dateA;
  });

  return allEpisodes;
}

module.exports = { getPodcasts };
