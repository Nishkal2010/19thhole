const RSSParser = require('rss-parser');

const parser = new RSSParser({
  timeout: 10000,
  headers: { 'User-Agent': 'The19thHole/1.0 RSS Reader' },
  customFields: {
    item: [['media:content', 'mediaContent'], ['media:thumbnail', 'mediaThumbnail'], ['enclosure', 'enclosure']]
  }
});

const ARTICLE_FEEDS = [
  { name: 'Golf Digest',    url: 'https://www.golfdigest.com/feed/rss',       color: '#C9A84C' },
  { name: 'Golf Channel',   url: 'https://www.golfchannel.com/rss/news',      color: '#1B4332' },
  { name: 'Golf.com',       url: 'https://golf.com/feed/',                    color: '#2D6A4F' },
  { name: 'No Laying Up',   url: 'https://nolayingup.com/feed/',              color: '#1B4332' },
  { name: 'The Fried Egg',  url: 'https://thefriedegg.com/feed/',             color: '#C9A84C' },
  { name: 'Golfweek',       url: 'https://golfweek.usatoday.com/feed/',       color: '#2D6A4F' },
  { name: 'Golf Monthly',   url: 'https://www.golfmonthly.com/feed',          color: '#1B4332' },
  { name: 'LIV Golf',       url: 'https://livgolf.com/news/feed/',            color: '#D4A017' },
  { name: 'PGA Tour',       url: 'https://www.pgatour.com/rss/news.xml',      color: '#0057B8' },
  { name: 'Golf Magic',     url: 'https://www.golfmagic.com/rss.xml',         color: '#2D6A4F' },
];

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
let cache = { articles: null, fetchedAt: 0 };

function extractImage(item) {
  if (item.mediaContent?.['$']?.url) return item.mediaContent['$'].url;
  if (item.mediaThumbnail?.['$']?.url) return item.mediaThumbnail['$'].url;
  if (item.enclosure?.url) return item.enclosure.url;
  const imgMatch = (item.content || item['content:encoded'] || '').match(/<img[^>]+src="([^">]+)"/);
  if (imgMatch) return imgMatch[1];
  return null;
}

async function fetchAllArticles() {
  const allArticles = [];

  const results = await Promise.allSettled(
    ARTICLE_FEEDS.map(feed => parser.parseURL(feed.url))
  );

  results.forEach((result, i) => {
    const feed = ARTICLE_FEEDS[i];
    if (result.status === 'fulfilled') {
      result.value.items.slice(0, 8).forEach(item => {
        allArticles.push({
          id: item.guid || item.link,
          title: item.title,
          source: feed.name,
          sourceColor: feed.color,
          link: item.link,
          pubDate: item.pubDate || item.isoDate,
          summary: (item.contentSnippet || '').slice(0, 120),
          image: extractImage(item),
        });
      });
    } else {
      console.error(`Feed ${feed.name} failed:`, results[i].reason?.message);
    }
  });

  allArticles.sort((a, b) => {
    const dateA = a.pubDate ? new Date(a.pubDate) : new Date(0);
    const dateB = b.pubDate ? new Date(b.pubDate) : new Date(0);
    return dateB - dateA;
  });

  return allArticles;
}

async function getArticles() {
  const now = Date.now();
  if (cache.articles && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.articles;
  }

  const articles = await fetchAllArticles();
  cache = { articles, fetchedAt: now };
  return articles;
}

module.exports = { getArticles };
