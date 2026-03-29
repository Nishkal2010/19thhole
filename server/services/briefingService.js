const Anthropic = require('@anthropic-ai/sdk');
const RSSParser = require('rss-parser');

const parser = new RSSParser({
  timeout: 10000,
  headers: { 'User-Agent': 'The19thHole/1.0 RSS Reader' }
});

const GOLF_RSS_FEEDS = [
  { name: 'Golf Channel', url: 'https://www.golfchannel.com/rss/news' },
  { name: 'Golf Digest', url: 'https://www.golfdigest.com/rss/all' },
  { name: 'PGA Tour', url: 'https://www.pgatour.com/rss/news.xml' },
  { name: 'Golf Week', url: 'https://golfweek.usatoday.com/feed/' },
];

async function fetchHeadlines() {
  const allItems = [];
  const results = await Promise.allSettled(
    GOLF_RSS_FEEDS.map(feed => parser.parseURL(feed.url))
  );

  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      const items = result.value.items.slice(0, 8);
      items.forEach(item => {
        allItems.push({
          source: GOLF_RSS_FEEDS[i].name,
          title: item.title,
          summary: item.contentSnippet || item.content || '',
          pubDate: item.pubDate || item.isoDate,
        });
      });
    }
  });

  return allItems.slice(0, 32);
}

async function generateBriefing() {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let headlines = [];
  try {
    headlines = await fetchHeadlines();
  } catch (e) {
    console.error('RSS fetch failed:', e.message);
  }

  const headlinesText = headlines.length > 0
    ? headlines.map(h => `[${h.source}] ${h.title}${h.summary ? ': ' + h.summary.slice(0, 300) : ''}`).join('\n')
    : 'No live headlines available — generate a briefing based on recent golf knowledge (PGA Tour and LIV Golf latest developments).';

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const prompt = `You are a senior golf journalist writing the daily briefing for "The 19th Hole," a premium golf app that covers both the PGA Tour and LIV Golf equally. Today is ${today}.

Here are today's latest headlines and snippets from Golf Channel, Golf Digest, Golfweek, and the PGA Tour:
${headlinesText}

Write today's briefing. Here are the exact rules — follow every one of them.

LENGTH: 600 to 900 words. Never shorter. Count carefully.

FORMAT: Flowing paragraphs only. Write like The Athletic or a great ESPN column. No bullet points anywhere. No bold section headers. No emojis used as headers. Just prose — paragraph after paragraph, the way a real sports column reads.

STRUCTURE — six sections, written as continuous prose with a blank line between each:

1. Opening hook (2-3 sentences). Start with the single most dramatic or interesting thing happening in golf right now. Drop the reader straight into the action. No "Welcome to today's briefing." No "Here's what you need to know." Just the story.

2. The main story (3-4 paragraphs). Dig into the biggest story of the day — tournament leaderboard, player controversy, LIV vs PGA drama, contract saga, whatever is most relevant. Explain full context: who, what, why it matters, what happened leading up to it, what happens next. Write like your reader is smart but hasn't been following this story closely.

3. What they're saying (1-2 paragraphs). Include real-sounding quotes or paraphrased takes from named golf media personalities. Use Golf Channel analysts like Brandel Chamblee (technical, sometimes provocative, not afraid to criticize), Damon Hack, or Rex Hoggard. Use ESPN's Michael Collins (insider, player-friendly) or Bob Harig. Use CBS Sports or No Laying Up's podcast crew. Format it like: ESPN's Michael Collins wrote that... or "Quote," Brandel Chamblee said on Golf Central. Make each quote feel specific to today's actual news, not generic. These should feel like you did the research.

4. The LIV angle (1-2 paragraphs). Always include something substantive from the LIV Golf world — standings, team drama, player movement, rivalry with PGA Tour, how specific players are performing, or the broader political situation between the two tours. This app covers both tours equally, so don't treat LIV as an afterthought.

5. Under the radar (1 paragraph). One smaller story, surprising stat, or developing situation that casual fans probably missed but is genuinely interesting. Could be a young player making noise, a rules situation, a equipment controversy, anything real.

6. What to watch (1 paragraph). End with what's coming next — upcoming tournament rounds, cut day implications, storylines to follow. Be specific about players and stakes. Forward-looking only, not a summary of what you just wrote.

TONE RULES:
- Write like you're a golf-obsessed journalist texting a smart, busy friend
- Opinions are welcome and expected. If a player choked, say they choked. If a ruling was questionable, call it questionable.
- Never use the phrases "In conclusion," "That wraps up," "Stay tuned," or "That's it for today"
- Player names can have slightly heavier emphasis using **Name** markdown — but only player names, nothing else. No bold phrases, no bold sentences, no bold anywhere mid-paragraph except a player's name when it's their first mention
- Quotes must feel real and attributed to real, named journalists or analysts
- Do not start any paragraph with "In" or "As" — vary your sentence openers
- Never write a paragraph shorter than 3 sentences

CRITICAL OUTPUT RULES — violating any of these is a failure:
- Do NOT output a title line, date line, or any kind of header at the top. The very first character of your response must be the first word of the opening hook sentence.
- Do NOT use bullet points (•, -, *) anywhere. Every section is prose paragraphs only.
- Do NOT use bold section labels like **PGA Tour** or **LIV Golf** or **What to Watch** — these are not allowed. The only ** markdown allowed is wrapping a player's name on first mention.
- Do NOT write an intro like "Welcome," "Here's today's briefing," or "Today in golf." Start mid-thought.

Write it now.`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2500,
    messages: [{ role: 'user', content: prompt }],
  });

  return cleanBriefing(message.content[0].text);
}

function cleanBriefing(text) {
  return text
    .split('\n')
    .map(line => {
      const trimmed = line.trim();
      // Remove standalone bold header lines like **⛳ PGA Tour** or **Today's Briefing**
      if (/^\*\*[^*]+\*\*$/.test(trimmed)) return '';
      // Remove lines that are only an emoji or emoji + spaces
      if (/^[\u{1F300}-\u{1FAFF}\s]+$/u.test(trimmed)) return '';
      // Convert bullet points to plain prose (strip the bullet, keep the text)
      if (/^[•\-\*] /.test(trimmed)) return trimmed.replace(/^[•\-\*] /, '');
      return line;
    })
    .join('\n')
    // Collapse 3+ consecutive blank lines down to 2
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

module.exports = { generateBriefing };
