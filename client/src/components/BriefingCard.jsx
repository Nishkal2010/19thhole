import './BriefingCard.css';

function formatInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <span key={i} className="briefing-name">{part.slice(2, -2)}</span>;
    }
    return part;
  });
}

function formatBriefing(text) {
  if (!text) return [];

  // Split into paragraph blocks on blank lines
  const blocks = text.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);

  return blocks.map((block, i) => {
    // Collapse internal newlines within a block into a space
    const line = block.replace(/\n/g, ' ').trim();
    return (
      <p key={i} className="briefing-para">
        {formatInline(line)}
      </p>
    );
  });
}

export default function BriefingCard({ briefing, loading, error }) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  if (loading) {
    return (
      <div className="briefing-card briefing-loading">
        <div className="skeleton" style={{ width: 130, height: 13, marginBottom: 18 }} />
        {[100, 93, 97, 86, 79].map((w, i) => (
          <div key={i} className="skeleton" style={{ width: `${w}%`, height: 14, marginBottom: 9 }} />
        ))}
        <div className="skeleton" style={{ width: 140, height: 12, marginTop: 18 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="briefing-card briefing-error">
        <p className="briefing-error-msg">Couldn't load today's briefing.</p>
      </div>
    );
  }

  return (
    <div className="briefing-card">
      <span className="briefing-label">TODAY'S BRIEFING</span>
      <div className="briefing-body">
        {briefing?.briefing
          ? formatBriefing(briefing.briefing)
          : <p className="briefing-para">No briefing available.</p>
        }
      </div>
      <span className="briefing-date">{today}</span>
    </div>
  );
}
