import { useState, useEffect, useRef } from 'react';
import { Search, TrendingUp, X, ArrowRight, Cpu, FlaskConical, Brain, Rocket, Dna, ScrollText, Binary, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './SearchPage.css';

const TRENDING = ['Artificial Intelligence', 'Quantum Physics', 'Dark Matter', 'CRISPR Gene Editing', 'Black Holes', 'Neuroscience', 'Climate Tech'];

const CATEGORIES = [
  { label: 'Technology', icon: Cpu, gradient: 'linear-gradient(135deg,#7c3aed,#a78bfa)', slug: 'technology' },
  { label: 'Science', icon: FlaskConical, gradient: 'linear-gradient(135deg,#06b6d4,#7c3aed)', slug: 'science' },
  { label: 'Philosophy', icon: Brain, gradient: 'linear-gradient(135deg,#8b5cf6,#ec4899)', slug: 'philosophy' },
  { label: 'Space', icon: Rocket, gradient: 'linear-gradient(135deg,#0f172a,#3b82f6)', slug: 'space' },
  { label: 'Biology', icon: Dna, gradient: 'linear-gradient(135deg,#10b981,#06b6d4)', slug: 'biology' },
  { label: 'History', icon: ScrollText, gradient: 'linear-gradient(135deg,#f59e0b,#ef4444)', slug: 'history' },
  { label: 'Math', icon: Binary, gradient: 'linear-gradient(135deg,#ec4899,#f97316)', slug: 'math' },
  { label: 'Psychology', icon: Lightbulb, gradient: 'linear-gradient(135deg,#14b8a6,#8b5cf6)', slug: 'psychology' },
];

const SUGGESTIONS = [
  'Artificial Intelligence ethics',
  'Quantum computing basics',
  'Black hole formation',
  'Human brain consciousness',
  'Climate change solutions',
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (query.trim().length > 1) {
      setSuggestions(SUGGESTIONS.filter(s => s.toLowerCase().includes(query.toLowerCase())));
    } else {
      setSuggestions([]);
    }
  }, [query]);

  function handleSearch(term) {
    const slug = (term || query).trim().toLowerCase().replace(/\s+/g, '-');
    if (slug) navigate(`/topic/${slug}`);
  }

  function handleKey(e) {
    if (e.key === 'Enter') handleSearch();
  }

  return (
    <div className="search-page">
      {/* Hero */}
      <div className="search-hero">
        <p className="search-hero__eyebrow badge badge-primary">Explore Everything</p>
        <h1 className="search-hero__title font-display">
          What do you want to<br />
          <span className="text-gradient">learn today?</span>
        </h1>
        <p className="search-hero__sub text-secondary">
          Search any topic and get AI explanations, videos, articles, and community insights.
        </p>

        {/* Search Bar */}
        <div className={`search-bar-wrap ${focused ? 'search-bar-wrap--focused' : ''}`}>
          <Search size={20} className="search-bar__icon" />
          <input
            ref={inputRef}
            id="main-search-input"
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 200)}
            onKeyDown={handleKey}
            placeholder="Search any topic, concept, or question..."
            className="search-bar__input"
            autoComplete="off"
          />
          {query && (
            <button className="search-bar__clear" onClick={() => setQuery('')}>
              <X size={16} />
            </button>
          )}
          <button className="btn btn-primary search-bar__btn" onClick={() => handleSearch()}>
            Search
          </button>

          {/* Suggestions dropdown */}
          {focused && suggestions.length > 0 && (
            <div className="search-bar__dropdown animate-scaleIn">
              {suggestions.map(s => (
                <button key={s} className="search-suggestion" onClick={() => handleSearch(s)}>
                  <Search size={14} />
                  <span>{s}</span>
                  <ArrowRight size={14} className="suggestion-arrow" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Trending */}
      <section className="search-section">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} style={{ color: 'var(--primary-light)' }} />
          <h2 className="font-semibold" style={{ fontSize: 16 }}>Trending Now</h2>
        </div>
        <div className="trending-pills">
          {TRENDING.map(t => (
            <button key={t} className="trend-pill" onClick={() => handleSearch(t)}>
              {t}
            </button>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="search-section">
        <h2 className="font-semibold mb-4" style={{ fontSize: 16 }}>Browse by Category</h2>
        <div className="category-grid">
          {CATEGORIES.map(cat => (
            <button
              key={cat.slug}
              className="category-card"
              style={{ background: cat.gradient }}
              onClick={() => navigate(`/topic/${cat.slug}`)}
            >
              <span className="category-card__emoji"><cat.icon size={28} /></span>
              <span className="category-card__label">{cat.label}</span>
              <div className="category-card__glow" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
