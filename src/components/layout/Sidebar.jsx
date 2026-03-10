import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home, Compass, MessageSquare, Bookmark, User,
  Zap, ChevronLeft, ChevronRight, Bell, Settings, LogOut, Sun, Moon, Bot
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../hooks/useFirebase';
import './Sidebar.css';

const navItems = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/explore', icon: Compass, label: 'Explore' },
  { to: '/chat', icon: MessageSquare, label: 'Messages' },
  { to: '/ai', icon: Bot, label: 'AI Chat' },
  { to: '/saved', icon: Bookmark, label: 'Saved' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications(user?.uid);

  const initials = (user?.displayName || user?.email || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
        {/* Logo */}
        <div className="sidebar__logo">
          <div className="sidebar__logo-icon">
            <Zap size={20} fill="white" />
          </div>
          {!collapsed && (
            <span className="sidebar__logo-text font-display">Lexora</span>
          )}
        </div>

        {/* Nav Items */}
        <nav className="sidebar__nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`
              }
            >
              <Icon size={20} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="sidebar__bottom">
          {/* Theme Toggle */}
          <button
            className="sidebar__nav-item"
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light' : 'Switch to Dark'}
            id="sidebar-theme-toggle"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
            {!collapsed && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {/* Notifications */}
          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              `sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`
            }
            style={{ position: 'relative' }}
          >
            <Bell size={20} />
            {!collapsed && <span>Notifications</span>}
            {unreadCount > 0 && (
              <span className="sidebar__notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`
            }
          >
            <Settings size={20} />
            {!collapsed && <span>Settings</span>}
          </NavLink>

          {/* User */}
          <NavLink to="/profile" className="sidebar__user">
            {user?.photoURL
              ? <img src={user.photoURL} alt="avatar" className="avatar avatar-sm" style={{ border: '2px solid rgba(124,58,237,0.5)' }} />
              : <div className="avatar avatar-sm" style={{ background: 'var(--gradient-primary)' }}>{initials}</div>
            }
            {!collapsed && (
              <div className="sidebar__user-info">
                <span className="sidebar__user-name">{user?.displayName || 'My Profile'}</span>
                <span className="sidebar__user-handle text-muted text-xs">{user?.email || ''}</span>
              </div>
            )}
          </NavLink>

          <button
            className="sidebar__nav-item"
            onClick={logout}
            title="Sign out"
            style={{ color: 'var(--text-muted)' }}
            id="sidebar-logout-btn"
          >
            <LogOut size={18} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          className="sidebar__toggle"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand' : 'Collapse'}
          id="sidebar-collapse-btn"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-nav">
        {[...navItems, { to: '/notifications', icon: Bell, label: 'Alerts' }].map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `mobile-nav__item ${isActive ? 'mobile-nav__item--active' : ''}`
            }
            style={{ position: 'relative' }}
          >
            <Icon size={22} />
            {to === '/notifications' && unreadCount > 0 && (
              <span className="mobile-notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
