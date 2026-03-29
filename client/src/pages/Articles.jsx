import { useState, useEffect } from 'react';
import axios from 'axios';
import './Articles.css';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function getCategory(source) {
  if (!source) return 'General Golf';
  const s = source.toLowerCase();
  if (s.includes('liv')) return 'LIV Golf';
  if (s.includes('pga')) return 'PGA Tour';
  return 'General Golf';
}

const CATEGORY_ORDER = ['PGA Tour', 'LIV Golf', 'General Golf'];

export default function Articles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('/api/articles', { withCredentials: true })
      .then(res => setArticles(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  const grouped = {};
  for (const article of articles) {
    const cat = getCategory(article.source);
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(article);
  }

  return (
    <div className="news-page page-fade">
      <div className="container">

        <div className="news-page-header">
          <span className="news-page-title">GOLF NEWS</span>
          <span className="news-page-date">{today}</span>
        </div>

        {loading && (
          <div className="news-loading">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="news-article-card">
                <div className="skeleton news-thumb-placeholder" />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 11, width: '50%', marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 15, marginBottom: 5 }} />
                  <div className="skeleton" style={{ height: 15, width: '80%', marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 11, width: '30%' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="news-empty"><p>Failed to load articles.</p></div>
        )}

        {!loading && !error && articles.length === 0 && (
          <div className="news-empty"><p>No articles available right now.</p></div>
        )}

        {!loading && !error && CATEGORY_ORDER.map(cat => {
          const items = grouped[cat];
          if (!items || items.length === 0) return null;
          return (
            <div key={cat} className="news-category-group">
              <div className="news-category-divider">
                <span className="news-category-label">{cat.toUpperCase()}</span>
              </div>
              {items.map((article, i) => (
                <a
                  key={article.id || i}
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="news-article-card"
                >
                  {article.image ? (
                    <img
                      src={article.image}
                      alt={article.title}
                      className="news-thumb"
                      loading="lazy"
                      onError={e => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="news-thumb-placeholder" />
                  )}
                  <div className="news-article-body">
                    <span className="news-article-source">{article.source}</span>
                    <p className="news-article-title">{article.title}</p>
                    <span className="news-article-time">{timeAgo(article.pubDate)}</span>
                  </div>
                </a>
              ))}
            </div>
          );
        })}

      </div>
    </div>
  );
}
