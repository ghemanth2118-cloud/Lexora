import { useState } from 'react';
import { Bell, Heart, MessageCircle, UserPlus, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications, markNotificationsRead } from '../hooks/useFirebase';
import { seedDatabase, SEED_ACCOUNTS } from '../scripts/seedData';
import './NotificationsPage.css';

function NotifIcon({ type }) {
  if (type === 'like') return <Heart size={16} fill="currentColor" style={{ color: '#f43f5e' }} />;
  if (type === 'comment') return <MessageCircle size={16} style={{ color: '#06b6d4' }} />;
  if (type === 'follow') return <UserPlus size={16} style={{ color: '#8b5cf6' }} />;
  return <Bell size={16} />;
}

function getTimeAgo(date) {
  if (!date) return '';
  const d = date.toDate ? date.toDate() : new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const { notifications, unreadCount } = useNotifications(user?.uid);
  const [seeding, setSeeding] = useState(false);
  const [seedDone, setSeedDone] = useState(false);
  const [seedResult, setSeedResult] = useState([]);
  const [showSeed, setShowSeed] = useState(false);

  async function handleMarkRead() {
    if (!user) return;
    await markNotificationsRead(user.uid);
  }

  async function handleSeed() {
    setSeeding(true);
    try {
      const result = await seedDatabase();
      setSeedResult(result);
      setSeedDone(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="notif-page page-wrapper">
      <div className="notif-header">
        <div>
          <div className="flex items-center gap-3">
            <Bell size={24} style={{ color: 'var(--primary-light)' }} />
            <h1 className="font-display font-bold" style={{ fontSize: 24 }}>Notifications</h1>
            {unreadCount > 0 && (
              <span className="notif-badge">{unreadCount}</span>
            )}
          </div>
          <p className="text-secondary text-sm mt-1">Stay updated on likes, comments, and followers</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={handleMarkRead}>
              <CheckCheck size={15} /> Mark all read
            </button>
          )}
          <button
            className="btn btn-ghost"
            style={{ fontSize: 13 }}
            onClick={() => setShowSeed(!showSeed)}
          >
            Seed Data
          </button>
        </div>
      </div>

      {/* Seed Data Panel */}
      {showSeed && (
        <div className="seed-panel glass-card animate-scaleIn">
          <h3 className="font-semibold mb-3">Create Demo Accounts</h3>
          <p className="text-secondary text-sm mb-4">
            This will create 5 test accounts with sample posts so you can explore the app.
            All accounts use password: <strong>Lexora@123</strong>
          </p>
          <div className="seed-accounts-list">
            {SEED_ACCOUNTS.map(a => (
              <div key={a.email} className="seed-account-item">
                <div className="avatar avatar-sm" style={{ background: 'var(--gradient-primary)' }}>
                  {a.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-sm">{a.name}</p>
                  <p className="text-muted text-xs">{a.email} · Lexora@123</p>
                </div>
              </div>
            ))}
          </div>
          {!seedDone ? (
            <button
              className="btn btn-primary mt-4 w-full"
              onClick={handleSeed}
              disabled={seeding}
            >
              {seeding ? 'Creating accounts & posts...' : 'Create Demo Data'}
            </button>
          ) : (
            <div className="seed-success">
              <Check size={16} /> Demo data created! Sign in with any account above.
            </div>
          )}
        </div>
      )}

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="notif-empty glass-card">
          <Bell size={40} style={{ opacity: 0.3 }} />
          <p className="font-semibold mt-4" style={{ fontSize: 18 }}>No notifications yet</p>
          <p className="text-secondary text-sm mt-2">
            When someone likes, comments, or follows you — it'll appear here in real time.
          </p>
        </div>
      ) : (
        <div className="notif-list">
          {notifications.map(n => (
            <div
              key={n.id}
              className={`notif-item glass-card ${!n.read ? 'notif-item--unread' : ''}`}
            >
              <div className="notif-item__icon-wrap">
                <div className="avatar avatar-sm" style={{ background: 'var(--gradient-primary)' }}>
                  {n.actorName?.[0] || '?'}
                </div>
                <span className="notif-item__type-icon">
                  <NotifIcon type={n.type} />
                </span>
              </div>
              <div className="notif-item__body">
                <p className="notif-item__text">
                  <strong>{n.actorName}</strong> {n.message}
                </p>
                <p className="text-muted text-xs mt-1">{getTimeAgo(n.createdAt)}</p>
              </div>
              {!n.read && <span className="notif-unread-dot" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
