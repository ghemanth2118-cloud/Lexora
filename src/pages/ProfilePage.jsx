import { useState } from 'react';
import { Settings, Share2, UserPlus, Grid, Bookmark, Award, Zap, MapPin, Link2, Flame, Brain, Rocket, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './ProfilePage.css';

const POSTS_GRID = [
  'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&q=80',
  'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&q=80',
  'https://images.unsplash.com/photo-1462332420958-a05d1e002413?w=400&q=80',
  'https://images.unsplash.com/photo-1558021212-51b6ecfa0db9?w=400&q=80',
  'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&q=80',
  'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80',
  'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&q=80',
  'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=400&q=80',
];

const TOPICS = ['AI & Machine Learning', 'Quantum Physics', 'Consciousness', 'Space Exploration', 'Neuroscience'];

const ACHIEVEMENTS = [
  { icon: Flame, label: 'Trending Contributor', color: '#f97316' },
  { icon: Brain, label: 'Deep Thinker', color: '#8b5cf6' },
  { icon: Zap, label: 'Early Adopter', color: '#eab308' },
  { icon: Star, label: 'Top 1% Explorer', color: '#06b6d4' },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('posts');
  const [following, setFollowing] = useState(false);

  const initials = (user?.displayName || user?.email || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const displayName = user?.displayName || 'Anonymous Explorer';
  const email = user?.email || '';

  return (
    <div className="profile-page">
      {/* Cover Banner */}
      <div className="profile-cover">
        <div className="profile-cover__gradient" />
        <button className="profile-settings-btn">
          <Settings size={18} />
        </button>
      </div>

      {/* Profile Header */}
      <div className="profile-header glass-card">
        <div className="profile-avatar-wrap">
          {user?.photoURL
            ? <img src={user.photoURL} alt="avatar" className="profile-avatar" />
            : <div className="profile-avatar avatar" style={{ background: 'var(--gradient-primary)' }}>{initials}</div>
          }
          <div className="profile-avatar__ring" />
        </div>

        <div className="profile-info">
          <div className="profile-info__top">
            <div>
              <h1 className="profile-info__name font-display">{displayName}</h1>
              <p className="text-muted text-sm">{email}</p>
            </div>
            <div className="profile-info__actions">
              <button className="btn btn-ghost btn-icon"><Share2 size={18} /></button>
              <button
                className={`btn ${following ? 'btn-ghost' : 'btn-primary'}`}
                onClick={() => setFollowing(!following)}
                id="follow-btn"
                style={{ minWidth: 110 }}
              >
                <UserPlus size={16} />
                {following ? 'Following' : 'Follow'}
              </button>
            </div>
          </div>

          <p className="profile-bio">
            Knowledge explorer 🚀 · Passionate about AI, physics & philosophy.
            Sharing what I learn every day. &quot;The more I know, the more I realize I don&#39;t know.&quot; — Socrates
          </p>

          <div className="profile-meta">
            <span className="profile-meta__item"><MapPin size={13} /> San Francisco, CA</span>
            <span className="profile-meta__item"><Link2 size={13} /> lexora.app/@alexkim</span>
          </div>

          {/* Stats */}
          <div className="profile-stats">
            {[
              { label: 'Posts', value: '248' },
              { label: 'Followers', value: '12.4K' },
              { label: 'Following', value: '891' },
              { label: 'Topics', value: '34' },
            ].map(s => (
              <div key={s.label} className="profile-stat">
                <span className="profile-stat__value">{s.value}</span>
                <span className="profile-stat__label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dashboard row */}
      <div className="profile-dashboard">
        {/* Achievements */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Award size={18} style={{ color: 'var(--primary-light)' }} />
            <h3 className="font-semibold" style={{ fontSize: 14 }}>Achievements</h3>
          </div>
          <div className="achievements-grid">
            {ACHIEVEMENTS.map(a => (
              <div key={a.label} className="achievement-item">
                <div className="achievement-item__icon" style={{ background: a.color + '20', borderColor: a.color + '40' }}>
                  <a.icon size={16} color={a.color} />
                </div>
                <span className="achievement-item__label text-xs text-secondary">{a.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Interests */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={18} style={{ color: 'var(--primary-light)' }} />
            <h3 className="font-semibold" style={{ fontSize: 14 }}>Top Topics</h3>
          </div>
          <div className="topics-list">
            {TOPICS.map((t, i) => (
              <div key={t} className="topic-pill-profile">
                <span className="topic-pill-rank">#{i + 1}</span>
                <span className="text-sm">{t}</span>
                <div
                  className="topic-pill-bar"
                  style={{ width: `${100 - i * 14}%`, background: 'var(--gradient-primary)' }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        {[
          { id: 'posts', icon: Grid, label: 'Posts' },
          { id: 'saved', icon: Bookmark, label: 'Saved' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`profile-tab ${activeTab === tab.id ? 'profile-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            id={`tab-${tab.id}`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Posts Grid */}
      <div className="posts-grid">
        {POSTS_GRID.map((img, i) => (
          <div key={i} className="posts-grid__item">
            <img src={img} alt={`Post ${i + 1}`} loading="lazy" />
            <div className="posts-grid__overlay" />
          </div>
        ))}
      </div>
    </div>
  );
}
