import { useState, useRef, useEffect } from 'react';
import {
  Send, Smile, Search, Phone, Video, MoreHorizontal,
  CheckCheck, MessageSquare, Users, UserPlus
} from 'lucide-react';
import {
  collection, query, where, onSnapshot, orderBy, limit, getDocs,
  setDoc, doc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useMessages, sendMessage } from '../hooks/useFirebase';
import './ChatPage.css';

import EmojiPicker from 'emoji-picker-react';

// Removed static EMOJIS array


/**
 * Generate stable conversation ID from two user IDs
 */
function getConversationId(uid1, uid2) {
  return [uid1, uid2].sort().join('_');
}

/**
 * Hook: Load all conversations for current user (real-time)
 */
function useConversations(userId) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    // Conversations where userId appears in the id (sorted pair)
    // We store participant ids in 'participants' array on the conversation doc
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId),
      orderBy('lastMessageAt', 'desc'),
      limit(30)
    );
    const unsub = onSnapshot(q, async snap => {
      const convDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Fetch partner user profiles
      const enriched = await Promise.all(
        convDocs.map(async conv => {
          const partnerId = conv.participants?.find(p => p !== userId);
          if (!partnerId) return conv;
          const userSnap = await getDocs(
            query(collection(db, 'users'), where('__name__', '==', partnerId), limit(1))
          ).catch(() => null);
          // Try to get doc directly
          const partnerData = {};
          if (userSnap && !userSnap.empty) {
            const d = userSnap.docs[0].data();
            partnerData.name = d.displayName || 'User';
            partnerData.photo = d.photoURL || null;
            partnerData.uid = partnerId;
          } else {
            partnerData.name = conv.partnerName || 'User';
            partnerData.photo = conv.partnerPhoto || null;
            partnerData.uid = partnerId;
          }
          return { ...conv, partner: partnerData };
        })
      );
      setConversations(enriched.filter(c => c.partner));
      setLoading(false);
    }, err => {
      console.error('Conversations error:', err);
      setLoading(false);
    });
    return unsub;
  }, [userId]);

  return { conversations, loading };
}

/**
 * Hook: search all users by display name
 */
function useUserSearch(searchQ, currentUserId) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!searchQ.trim() || searchQ.length < 2) { setResults([]); return; }
    setLoading(true);
    const q = query(collection(db, 'users'), limit(20));
    getDocs(q)
      .then(snap => {
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const filtered = all.filter(u =>
          u.id !== currentUserId &&
          (u.displayName?.toLowerCase().includes(searchQ.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchQ.toLowerCase()))
        );
        setResults(filtered.slice(0, 8));
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [searchQ, currentUserId]);

  return { results, loading };
}

export default function ChatPage() {
  const { user } = useAuth();
  const [activeContact, setActiveContact] = useState(null);
  const [input, setInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const bottomRef = useRef(null);

  const { conversations, loading: convsLoading } = useConversations(user?.uid);
  const { results: searchResults } = useUserSearch(searchQ, user?.uid);

  // Conversation ID is a sorted pair of user IDs
  const conversationId = activeContact
    ? getConversationId(user?.uid || 'anon', activeContact.uid)
    : null;
  const { messages, loading: msgsLoading } = useMessages(conversationId || '');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || !user || !activeContact) return;
    const text = input.trim();
    setInput('');
    setShowEmoji(false);

    const convRef = doc(db, 'conversations', conversationId);
    await setDoc(convRef, {
      participants: [user.uid, activeContact.uid],
      lastMessage: text,
      lastMessageAt: serverTimestamp(),
      partnerName: activeContact.name,
      partnerPhoto: activeContact.photo || null,
    }, { merge: true }).catch(console.error);

    await sendMessage(conversationId, user.uid, user.displayName || 'Me', text);
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function selectContact(contact) {
    setActiveContact(contact);
    setShowSearch(false);
    setSearchQ('');
  }

  // Build contact list: existing conversations + search results
  const contactsToShow = showSearch
    ? searchResults.map(u => ({ uid: u.id, name: u.displayName || 'User', photo: u.photoURL || null, lastMessage: '' }))
    : conversations.map(c => ({
      uid: c.partner?.uid,
      name: c.partner?.name || 'User',
      photo: c.partner?.photo || null,
      lastMessage: c.lastMessage || '',
    }));

  const initials = (n) => (n || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="chat-page">
      {/* Contact Sidebar */}
      <aside className="chat-sidebar">
        <div className="chat-sidebar__header">
          <h2 className="font-display font-bold" style={{ fontSize: 20 }}>Messages</h2>
          <button
            className="btn-icon"
            onClick={() => setShowSearch(!showSearch)}
            title={showSearch ? 'Back to chats' : 'New message'}
          >
            {showSearch ? <MessageSquare size={18} /> : <UserPlus size={18} />}
          </button>
        </div>
        <div className="chat-sidebar__search">
          <Search size={15} />
          <input
            type="text"
            placeholder={showSearch ? 'Search users...' : 'Search conversations...'}
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            className="chat-search-input"
          />
        </div>
        <div className="contacts-list">
          {!showSearch && convsLoading && (
            <p className="text-sm text-muted" style={{ padding: '20px', textAlign: 'center' }}>Loading...</p>
          )}
          {!showSearch && !convsLoading && conversations.length === 0 && (
            <div style={{ padding: '30px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Users size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
              <p className="text-sm font-semibold">No conversations yet</p>
              <p className="text-xs mt-1">Click + to find and message someone</p>
              <button
                className="btn btn-ghost mt-4"
                style={{ fontSize: 12, gap: 6 }}
                onClick={() => setShowSearch(true)}
              >
                <UserPlus size={14} /> New Message
              </button>
            </div>
          )}
          {contactsToShow.map(c => (
            <button
              key={c.uid}
              className={`contact-item ${activeContact?.uid === c.uid ? 'contact-item--active' : ''}`}
              onClick={() => selectContact(c)}
            >
              <div className="contact-avatar-wrap">
                {c.photo
                  ? <img src={c.photo} alt={c.name} className="avatar avatar-md" />
                  : <div className="avatar avatar-md" style={{ background: 'var(--gradient-primary)' }}>{initials(c.name)}</div>
                }
              </div>
              <div className="contact-info">
                <div className="flex justify-between items-center">
                  <span className="contact-name">{c.name}</span>
                </div>
                {c.lastMessage && (
                  <p className="contact-last text-sm text-secondary truncate">{c.lastMessage}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Chat Window */}
      <div className="chat-window">
        {!activeContact ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: 12 }}>
            <MessageSquare size={48} style={{ opacity: 0.3 }} />
            <p className="font-semibold">Select a conversation</p>
            <p className="text-sm">or start a new message with any user</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="chat-window__header">
              <div className="flex items-center gap-3">
                <div className="contact-avatar-wrap" style={{ position: 'relative' }}>
                  {activeContact.photo
                    ? <img src={activeContact.photo} alt={activeContact.name} className="avatar avatar-md" />
                    : <div className="avatar avatar-md" style={{ background: 'var(--gradient-primary)' }}>{initials(activeContact.name)}</div>
                  }
                </div>
                <div>
                  <p className="font-semibold">{activeContact.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn-icon"><Phone size={18} /></button>
                <button className="btn-icon"><Video size={18} /></button>
                <button className="btn-icon"><MoreHorizontal size={18} /></button>
              </div>
            </div>

            {/* Messages */}
            <div className="messages-area">
              {msgsLoading && (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <p className="text-sm">Loading messages...</p>
                </div>
              )}
              {!msgsLoading && messages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                  <MessageSquare size={40} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
                  <p className="font-semibold">No messages yet</p>
                  <p className="text-sm mt-2">Say hi to {activeContact.name}!</p>
                </div>
              )}
              {messages.map(msg => {
                const isMe = msg.senderId === user?.uid;
                return (
                  <div key={msg.id} className={`message-wrap ${isMe ? 'message-wrap--me' : ''}`}>
                    {!isMe && (
                      activeContact.photo
                        ? <img src={activeContact.photo} alt={activeContact.name} className="avatar avatar-sm" style={{ flexShrink: 0 }} />
                        : <div className="avatar avatar-sm" style={{ background: 'var(--gradient-primary)', flexShrink: 0 }}>{initials(activeContact.name)}</div>
                    )}
                    <div className={`bubble ${isMe ? 'bubble--me' : 'bubble--them'}`}>
                      <p>{msg.text}</p>
                      <div className="bubble__meta">
                        <span className="text-xs">
                          {msg.createdAt?.toDate
                            ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'Sending…'}
                        </span>
                        {isMe && <CheckCheck size={13} style={{ color: '#06b6d4' }} />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Emoji picker */}
            {showEmoji && (
              <div className="emoji-picker-container animate-scaleIn">
                <EmojiPicker
                  onEmojiClick={(emojiData) => setInput(prev => prev + emojiData.emoji)}
                  theme="dark"
                  searchDisabled={false}
                  skinTonesDisabled={true}
                  width="100%"
                  height={400}
                />
              </div>
            )}

            {/* Input Bar */}
            <div className="chat-input-bar">
              <button
                className="btn-icon"
                onClick={() => setShowEmoji(!showEmoji)}
                id="emoji-toggle-btn"
              >
                <Smile size={20} />
              </button>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={`Message ${activeContact.name}...`}
                className="chat-input"
                id="chat-message-input"
              />
              <button
                className="send-btn"
                onClick={handleSend}
                disabled={!input.trim()}
                id="send-message-btn"
              >
                <Send size={18} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
