import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collection, query, orderBy, limit, where, getDocs } from 'firebase/firestore';
import {
  Compass, TrendingUp, Flame, Hash, Sparkles, Search,
  Heart, MessageCircle, Bot, ArrowRight, Loader
} from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import './ExplorePage.css';

const CURATED_TOPICS = [
  { label: 'Artificial Intelligence', emoji: '🤖', color: '#06b6d4' },
  { label: 'Quantum Physics', emoji: '⚛️', color: '#8b5cf6' },
  { label: 'Space Exploration', emoji: '🚀', color: '#f59e0b' },
  { label: 'Neuroscience', emoji: '🧠', color: '#ec4899' },
  { label: 'Climate Science', emoji: '🌍', color: '#10b981' },
  { label: 'Philosophy', emoji: '💭', color: '#a78bfa' },
  { label: 'Biotechnology', emoji: '🧬', color: '#f43f5e' },
  { label: 'Ocean Biology', emoji: '🌊', color: '#0ea5e9' },
  { label: 'Robotics', emoji: '🦾', color: '#fb923c' },
  { label: 'Consciousness', emoji: '✨', color: '#d946ef' },
  { label: 'Mathematics', emoji: '∞', color: '#6366f1' },
  { label: 'History', emoji: '📜', color: '#a3a3a3' },
];

function getTimeAgo(date) {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function TrendingPostCard({ post, onAskAI }) {
  const likesCount = Array.isArray(post.likes) ? post.likes.length : post.likes || 0;
  const commentCount = post.commentCount || 0;
  const initials = (post.displayName || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const timeAgo = post.createdAt?.toDate ? getTimeAgo(post.createdAt.toDate()) : 'Recently';
  const topic = post.topic || 'General';

  return (
    <div className="explore-post-card glass-card">
      <div className="explore-post-card__header">
        <div className="flex items-center gap-2">
          {post.photoURL
            ? <img src={post.photoURL} alt={post.displayName} className="avatar avatar-sm" />
            : <div className="avatar avatar-sm" style={{ background: 'var(--gradient-primary)' }}>{initials}</div>
          }
          <div>
            <p style={{ fontSize: 13, fontWeight: 600 }}>{post.displayName || 'User'}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo}</p>
          </div>
        </div>
        <span className="badge badge-primary" style={{ fontSize: 11 }}>{topic}</span>
      </div>
      {post.imageUrl && (
        <img src={post.imageUrl} alt="post" className="explore-post-card__img" loading="lazy" />
      )}
      <div className="explore-post-card__body">
        {post.title && <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{post.title}</p>}
        {post.text && <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{post.text?.slice(0, 140)}{post.text?.length > 140 ? '…' : ''}</p>}
      </div>
      <div className="explore-post-card__footer">
        <div className="flex items-center gap-3" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          <span className="flex items-center gap-1"><Heart size={14} /> {likesCount}</span>
          <span className="flex items-center gap-1"><MessageCircle size={14} /> {commentCount}</span>
        </div>
        <button
          className="btn btn-ghost"
          style={{ fontSize: 12, padding: '5px 12px', gap: 5, color: '#06b6d4' }}
          onClick={() => onAskAI(topic)}
        >
          <Bot size={14} /> Ask AI
        </button>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQ, setSearchQ] = useState('');
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [activeTab, setActiveTab] = useState('trending');

  // Load top-liked posts
  useEffect(() => {
    setLoadingPosts(true);
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(20));
    getDocs(q)
      .then(snap => {
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sort by likes count for trending
        const sorted = [...all].sort((a, b) => {
          const al = Array.isArray(a.likes) ? a.likes.length : a.likes || 0;
          const bl = Array.isArray(b.likes) ? b.likes.length : b.likes || 0;
          return bl - al;
        });
        setTrendingPosts(sorted);
      })
      .catch(err => console.error('Explore posts error:', err))
      .finally(() => setLoadingPosts(false));
  }, []);

  function handleAskAI(topic) {
    navigate(`/ai?topic=${encodeURIComponent(topic)}`);
  }

  function handleSearch(e) {
    e.preventDefault();
    if (searchQ.trim()) {
      navigate(`/topic/${encodeURIComponent(searchQ.trim())}`);
    }
  }

  const filteredPosts = activeTab === 'trending'
    ? trendingPosts
    : trendingPosts.filter(p => p.topic === activeTab);

  return (
    <div className="explore-page">
      {/* Hero Header */}
      <div className="explore-hero glass-card">
        <div className="explore-hero__icon">
          <Compass size={28} />
        </div>
        <div>
          <h1 className="font-display font-bold" style={{ fontSize: 26 }}>
            Explore <span className="text-gradient">Lexora</span>
          </h1>
          <p className="text-secondary text-sm mt-1">
            Discover trending posts, topics, and let AI guide your curiosity
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <form className="explore-search glass-card" onSubmit={handleSearch}>
        <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search any topic — quantum physics, consciousness, robotics..."
          className="explore-search-input"
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
        />
        {searchQ && (
          <button type="submit" className="btn btn-primary" style={{ padding: '8px 18px', fontSize: 13, gap: 6 }}>
            <ArrowRight size={15} /> Search
          </button>
        )}
      </form>

      {/* Topic Grid */}
      <section className="explore-section">
        <div className="explore-section__title">
          <Hash size={18} />
          <span>Browse Topics</span>
        </div>
        <div className="topic-grid">
          {CURATED_TOPICS.map(t => (
            <button
              key={t.label}
              className="topic-pill glass-card"
              onClick={() => handleAskAI(t.label)}
              style={{ '--topic-color': t.color }}
            >
              <span className="topic-pill__emoji">{t.emoji}</span>
              <span className="topic-pill__label">{t.label}</span>
              <span className="topic-pill__ai">
                <Bot size={11} /> Ask AI
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Trending Posts */}
      <section className="explore-section">
        <div className="explore-section__title">
          <Flame size={18} style={{ color: '#f59e0b' }} />
          <span>Trending Posts</span>
          <span className="explore-badge">{trendingPosts.length} posts</span>
        </div>

        {loadingPosts ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Loader size={28} className="spin" style={{ margin: '0 auto' }} />
            <p className="text-sm mt-3">Loading trending content...</p>
          </div>
        ) : trendingPosts.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Sparkles size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p className="font-semibold">No posts yet</p>
            <p className="text-sm mt-2">Be the first to create a post from the home feed!</p>
          </div>
        ) : (
          <div className="explore-posts-grid">
            {filteredPosts.map(post => (
              <TrendingPostCard key={post.id} post={post} onAskAI={handleAskAI} />
            ))}
          </div>
        )}
      </section>

      {/* AI Invite Banner */}
      <div className="ai-invite-banner glass-card">
        <div className="ai-invite-banner__icon">
          <Sparkles size={24} />
        </div>
        <div className="flex-1">
          <p className="font-semibold" style={{ fontSize: 16 }}>Curious about something?</p>
          <p className="text-sm text-secondary mt-1">Ask Lexora AI anything — science, technology, history, philosophy...</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/ai')}
          style={{ gap: 8 }}
        >
          <Bot size={16} /> Open AI Chat
        </button>
      </div>
    </div>
  );
}
