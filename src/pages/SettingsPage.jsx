import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { uploadFile } from '../hooks/useFirebase';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  Sun, Moon, Bell, Shield, Palette, UserCircle,
  Database, LogOut, Camera, ChevronRight, Check
} from 'lucide-react';
import './SettingsPage.css';

function SettingRow({ icon: Icon, label, description, children, danger }) {
  return (
    <div className={`setting-row ${danger ? 'setting-row--danger' : ''}`}>
      <div className="setting-row__icon">
        <Icon size={18} />
      </div>
      <div className="setting-row__info">
        <p className="setting-row__label">{label}</p>
        {description && <p className="setting-row__desc text-muted text-xs">{description}</p>}
      </div>
      <div className="setting-row__control">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, id }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      className={`toggle ${checked ? 'toggle--on' : ''}`}
      onClick={onChange}
    >
      <span className="toggle__thumb" />
    </button>
  );
}

export default function SettingsPage() {
  const { theme, toggleTheme, isDark } = useTheme();
  const { user, logout } = useAuth();

  const [notifications, setNotifications] = useState({ push: true, email: true, mentions: true });
  const [privacy, setPrivacy] = useState({ privateAccount: false, showActivity: true });
  const [saving, setSaving] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [saved, setSavedMsg] = useState('');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState('');

  async function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file || !user) return;
    setAvatarLoading(true);
    try {
      const url = await uploadFile(`avatars/${user.uid}/${Date.now()}_${file.name}`, file);
      await updateDoc(doc(db, 'users', user.uid), { photoURL: url });
    } catch (err) {
      console.error(err);
    } finally {
      setAvatarLoading(false);
    }
  }

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { displayName, bio });
      setSavedMsg('Profile saved!');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const initials = (user?.displayName || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="settings-page page-wrapper">
      <div className="settings-hero animate-fadeIn">
        <h1 className="font-display font-bold text-2xl">Settings</h1>
        <p className="text-secondary text-sm">Manage your account and preferences</p>
      </div>

      <div className="settings-layout">
        {/* Left: sections */}
        <div className="settings-sections">

          {/* Profile Card */}
          <section className="settings-section glass-card animate-fadeIn">
            <h2 className="settings-section__title">
              <UserCircle size={16} /> Profile
            </h2>

            <div className="profile-avatar-editor">
              <div className="pae-avatar">
                {user?.photoURL
                  ? <img src={user.photoURL} alt="avatar" className="pae-avatar__img" />
                  : <div className="avatar avatar-xl" style={{ background: 'var(--gradient-primary)' }}>{initials}</div>
                }
                <label className="pae-avatar__change" title="Change photo">
                  <Camera size={16} />
                  <input type="file" accept="image/*" hidden onChange={handleAvatarChange} id="avatar-upload-input" />
                </label>
              </div>
              <div>
                <p className="font-semibold">{user?.displayName || 'Anonymous'}</p>
                <p className="text-muted text-sm">{user?.email}</p>
                {avatarLoading && <p className="text-xs" style={{ color: 'var(--primary-light)', marginTop: 4 }}>Uploading…</p>}
              </div>
            </div>

            <div className="settings-fields">
              <div className="settings-field">
                <label className="settings-label">Display Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                  id="settings-display-name"
                />
              </div>
              <div className="settings-field">
                <label className="settings-label">Bio</label>
                <textarea
                  className="input-field settings-textarea"
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Tell the world about yourself…"
                  rows={3}
                  id="settings-bio"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  className="btn btn-primary"
                  onClick={saveProfile}
                  disabled={saving}
                  id="save-profile-btn"
                >
                  {saving ? 'Saving…' : 'Save Profile'}
                </button>
                {saved && (
                  <span className="flex items-center gap-1 text-sm" style={{ color: '#10b981' }}>
                    <Check size={14} /> {saved}
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Appearance */}
          <section className="settings-section glass-card animate-fadeIn" style={{ animationDelay: '0.1s' }}>
            <h2 className="settings-section__title">
              <Palette size={16} /> Appearance
            </h2>
            <SettingRow
              icon={isDark ? Moon : Sun}
              label="Theme"
              description={`Currently using ${isDark ? 'dark' : 'light'} mode`}
            >
              <div className="theme-switcher">
                <button
                  className={`theme-option ${!isDark ? 'theme-option--active' : ''}`}
                  onClick={() => !isDark || toggleTheme()}
                  id="light-mode-btn"
                  title="Light mode"
                >
                  <Sun size={16} /> Light
                </button>
                <button
                  className={`theme-option ${isDark ? 'theme-option--active' : ''}`}
                  onClick={() => isDark || toggleTheme()}
                  id="dark-mode-btn"
                  title="Dark mode"
                >
                  <Moon size={16} /> Dark
                </button>
              </div>
            </SettingRow>
          </section>

          {/* Notifications */}
          <section className="settings-section glass-card animate-fadeIn" style={{ animationDelay: '0.15s' }}>
            <h2 className="settings-section__title">
              <Bell size={16} /> Notifications
            </h2>
            <SettingRow icon={Bell} label="Push Notifications" description="Receive alerts on your device">
              <Toggle id="push-toggle" checked={notifications.push} onChange={() => setNotifications(p => ({ ...p, push: !p.push }))} />
            </SettingRow>
            <SettingRow icon={Bell} label="Email Updates" description="Weekly digest and announcements">
              <Toggle id="email-toggle" checked={notifications.email} onChange={() => setNotifications(p => ({ ...p, email: !p.email }))} />
            </SettingRow>
            <SettingRow icon={Bell} label="Mentions" description="When someone mentions you">
              <Toggle id="mentions-toggle" checked={notifications.mentions} onChange={() => setNotifications(p => ({ ...p, mentions: !p.mentions }))} />
            </SettingRow>
          </section>

          {/* Privacy */}
          <section className="settings-section glass-card animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            <h2 className="settings-section__title">
              <Shield size={16} /> Privacy & Security
            </h2>
            <SettingRow icon={Shield} label="Private Account" description="Only followers can see your content">
              <Toggle id="private-toggle" checked={privacy.privateAccount} onChange={() => setPrivacy(p => ({ ...p, privateAccount: !p.privateAccount }))} />
            </SettingRow>
            <SettingRow icon={Shield} label="Show Activity Status" description="Let others see when you're online">
              <Toggle id="activity-toggle" checked={privacy.showActivity} onChange={() => setPrivacy(p => ({ ...p, showActivity: !p.showActivity }))} />
            </SettingRow>
          </section>

          {/* Data */}
          <section className="settings-section glass-card animate-fadeIn" style={{ animationDelay: '0.25s' }}>
            <h2 className="settings-section__title">
              <Database size={16} /> Data
            </h2>
            <div className="setting-row">
              <div className="setting-row__icon"><Database size={18} /></div>
              <div className="setting-row__info">
                <p className="setting-row__label">Data Storage</p>
                <p className="setting-row__desc text-muted text-xs">Powered by Firebase · End-to-end encrypted</p>
              </div>
              <ChevronRight size={18} style={{ color: 'var(--text-muted)', marginLeft: 'auto' }} />
            </div>
          </section>

          {/* Danger Zone */}
          <section className="settings-section glass-card animate-fadeIn" style={{ animationDelay: '0.3s', borderColor: 'rgba(244, 63, 94, 0.2)' }}>
            <h2 className="settings-section__title" style={{ color: '#f43f5e' }}>
              <LogOut size={16} /> Account
            </h2>
            <SettingRow icon={LogOut} label="Sign Out" description="Log out of your Lexora account" danger>
              <button
                className="btn btn-ghost"
                onClick={logout}
                style={{ color: '#f43f5e', borderColor: 'rgba(244,63,94,0.3)', fontSize: 13 }}
                id="signout-btn"
              >
                Sign Out
              </button>
            </SettingRow>
          </section>
        </div>

        {/* Right summary */}
        <aside className="settings-info">
          <div className="glass-card p-4">
            <p className="font-semibold mb-3" style={{ fontSize: 14 }}>Account Info</p>
            <div className="settings-info-row"><span className="text-muted text-xs">UID</span><span className="text-xs truncate" style={{ maxWidth: 120 }}>{user?.uid || '—'}</span></div>
            <div className="settings-info-row"><span className="text-muted text-xs">Email</span><span className="text-xs truncate" style={{ maxWidth: 120 }}>{user?.email || '—'}</span></div>
            <div className="settings-info-row"><span className="text-muted text-xs">Auth</span><span className="text-xs">{user?.providerData?.[0]?.providerId || '—'}</span></div>
            <div className="settings-info-row"><span className="text-muted text-xs">Theme</span><span className="text-xs capitalize">{theme}</span></div>
          </div>
        </aside>
      </div>
    </div>
  );
}
