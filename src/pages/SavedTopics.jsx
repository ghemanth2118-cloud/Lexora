import { useState } from 'react';
import { Bookmark, Trash2, Search, Grid, List, ExternalLink, Plus, Cpu, FlaskConical, Brain, Rocket, Dna, ScrollText, Binary, Lightbulb, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSavedTopics, removeSavedTopic, saveTopic } from '../hooks/useFirebase';
import { useNavigate } from 'react-router-dom';
import './SavedTopics.css';

const ICONS = { Technology: Cpu, Science: FlaskConical, Philosophy: Brain, Space: Rocket, Biology: Dna, History: ScrollText, Math: Binary, Psychology: Lightbulb, General: BookOpen };
const GRADIENTS = {
  Technology: 'linear-gradient(135deg,#7c3aed,#a78bfa)',
  Science: 'linear-gradient(135deg,#06b6d4,#7c3aed)',
  Philosophy: 'linear-gradient(135deg,#8b5cf6,#ec4899)',
  Space: 'linear-gradient(135deg,#0f172a,#3b82f6)',
  Biology: 'linear-gradient(135deg,#10b981,#06b6d4)',
  General: 'linear-gradient(135deg,#f59e0b,#ec4899)',
};
const IMAGES = {
  Technology: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&q=80',
  Science: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&q=80',
  Philosophy: 'https://images.unsplash.com/photo-1558021212-51b6ecfa0db9?w=400&q=80',
  Space: 'https://images.unsplash.com/photo-1462332420958-a05d1e002413?w=400&q=80',
  Biology: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=400&q=80',
  General: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80',
};

export default function SavedTopics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const saved = useSavedTopics(user?.uid);
  const [view, setView] = useState('grid');
  const [search, setSearch] = useState('');
  const [removing, setRemoving] = useState(null);

  const filtered = saved.filter(i =>
    i.topic?.toLowerCase().includes(search.toLowerCase()) ||
    i.badge?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleRemove(id) {
    setRemoving(id);
    try { await removeSavedTopic(id); } finally { setRemoving(null); }
  }

  return (
    <div className="saved-page page-wrapper">
      {/* Header */}
      <div className="saved-header">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Bookmark size={24} style={{ color: 'var(--primary-light)' }} />
            <h1 className="font-display font-bold text-2xl">Saved Topics</h1>
          </div>
          <p className="text-secondary text-sm">{saved.length} topics saved · Your personal knowledge library</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className={`btn btn-ghost btn-icon ${view === 'grid' ? 'btn-view-active' : ''}`}
            onClick={() => setView('grid')} title="Grid view"
          ><Grid size={18} /></button>
          <button
            className={`btn btn-ghost btn-icon ${view === 'list' ? 'btn-view-active' : ''}`}
            onClick={() => setView('list')} title="List view"
          ><List size={18} /></button>
        </div>
      </div>

      {/* Search filter */}
      <div className="saved-search">
        <Search size={16} style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Filter saved topics..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="saved-search__input"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="saved-empty">
          <span style={{ fontSize: 48 }}>📚</span>
          <p className="font-semibold mt-4" style={{ fontSize: 18 }}>No saved topics yet</p>
          <p className="text-secondary text-sm mt-2">Explore topics and save them to find here</p>
          <button className="btn btn-primary mt-6" onClick={() => navigate('/search')}>
            <Plus size={16} /> Explore Topics
          </button>
        </div>
      ) : view === 'grid' ? (
        <div className="saved-grid">
          {filtered.map((item, i) => {
            const badge = item.badge || 'General';
            const gradient = GRADIENTS[badge] || GRADIENTS.General;
            const img = IMAGES[badge] || IMAGES.General;
            const IconComp = ICONS[badge] || ICONS.General;
            return (
              <div
                key={item.id}
                className="saved-card glass-card animate-fadeIn"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="saved-card__img-wrap">
                  <img src={img} alt={item.topic} className="saved-card__img" loading="lazy" />
                  <div className="saved-card__img-overlay" style={{ background: gradient + '60' }} />
                  <button
                    className="saved-card__remove"
                    onClick={() => handleRemove(item.id)}
                    disabled={removing === item.id}
                    title="Remove"
                  ><Trash2 size={14} /></button>
                  <span className="saved-card__emoji"><IconComp size={24} /></span>
                </div>
                <div className="saved-card__body">
                  <div className="flex items-center justify-between mb-2">
                    <span className="badge badge-primary">{badge}</span>
                    <span className="text-muted text-xs">
                      {item.savedAt?.toDate ? item.savedAt.toDate().toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                  <h3 className="saved-card__title">{item.topic}</h3>
                  <p className="saved-card__desc text-secondary text-sm">{item.description || 'Explore this topic again.'}</p>
                  <button
                    className="btn btn-ghost w-full mt-4"
                    style={{ fontSize: 13, justifyContent: 'center' }}
                    onClick={() => navigate(`/topic/${item.topic?.toLowerCase().replace(/\s+/g, '-')}`)}
                  >
                    <ExternalLink size={14} /> Explore Again
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="saved-list">
          {filtered.map((item, i) => {
            const badge = item.badge || 'General';
            const gradient = GRADIENTS[badge] || GRADIENTS.General;
            const img = IMAGES[badge] || IMAGES.General;
            return (
              <div
                key={item.id}
                className="saved-list-item glass-card animate-fadeIn"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="saved-list-item__thumb" style={{ background: gradient }}>
                  <img src={img} alt={item.topic} />
                </div>
                <div className="saved-list-item__body">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge badge-primary">{badge}</span>
                    <span className="text-muted text-xs">
                      {item.savedAt?.toDate ? item.savedAt.toDate().toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                  <h3 className="font-semibold" style={{ fontSize: 16 }}>{item.topic}</h3>
                  <p className="text-secondary text-sm mt-1">{item.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="btn btn-ghost btn-icon"
                    onClick={() => navigate(`/topic/${item.topic?.toLowerCase().replace(/\s+/g, '-')}`)}
                  ><ExternalLink size={16} /></button>
                  <button
                    className="btn btn-ghost btn-icon"
                    onClick={() => handleRemove(item.id)}
                    style={{ color: '#f43f5e' }}
                  ><Trash2 size={16} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
