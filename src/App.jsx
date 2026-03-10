import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Sidebar from './components/layout/Sidebar';
import HomeFeed from './pages/HomeFeed';
import SearchPage from './pages/SearchPage';
import ExplorePage from './pages/ExplorePage';
import TopicResults from './pages/TopicResults';
import ChatPage from './pages/ChatPage';
import SavedTopics from './pages/SavedTopics';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import AuthPage from './pages/AuthPage';
import AIChatPage from './pages/AIChatPage';
import NotificationsPage from './pages/NotificationsPage';
import './App.css';

function ProtectedApp() {
  const { user } = useAuth();
  if (!user) return <AuthPage />;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomeFeed />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/topic/:slug" element={<TopicResults />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/ai" element={<AIChatPage />} />
          <Route path="/saved" element={<SavedTopics />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <ProtectedApp />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
