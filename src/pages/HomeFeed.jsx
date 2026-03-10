import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, X,
  Plus, Camera, Loader, Send, MessageSquare, UserPlus, UserCheck, Smile
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useAuth } from '../contexts/AuthContext';
import {
  usePosts, useStories, useComments,
  createPost, postStory, toggleLike, addComment, followUser, isFollowing
} from '../hooks/useFirebase';
import './HomeFeed.css';

// ── Helpers ──────────────────────────────────────────────────────────────────
function getTimeAgo(date) {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Comment Section ───────────────────────────────────────────────────────────
function CommentSection({ post, currentUser, onClose }) {
  const { comments, loading } = useComments(post.id);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);

  async function handleComment() {
    if (!text.trim() || !currentUser) return;
    setPosting(true);
    try {
      await addComment(post.id, currentUser.uid, currentUser.displayName, currentUser.photoURL, text);
      setText('');
    } catch (err) {
      console.error('Comment error:', err);
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="modal-overlay animate-fadeIn" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card glass-card animate-scaleIn" style={{ maxWidth: 540, width: '95%' }}>
        <div className="modal-header">
          <h3 className="font-display font-bold" style={{ fontSize: 17 }}>Comments</h3>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body" style={{ maxHeight: 340, overflowY: 'auto' }}>
          {loading && <p className="text-sm text-muted" style={{ padding: '20px 0', textAlign: 'center' }}>Loading...</p>}
          {!loading && comments.length === 0 && (
            <p className="text-sm text-muted" style={{ padding: '20px 0', textAlign: 'center' }}>No comments yet. Be the first!</p>
          )}
          {comments.map(c => {
            const initials = (c.displayName || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
            return (
              <div key={c.id} className="flex gap-3 mb-4">
                {c.photoURL
                  ? <img src={c.photoURL} alt={c.displayName} className="avatar avatar-sm" style={{ flexShrink: 0 }} />
                  : <div className="avatar avatar-sm" style={{ background: 'var(--gradient-primary)', flexShrink: 0 }}>{initials}</div>
                }
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold" style={{ fontSize: 13 }}>{c.displayName || 'User'}</span>
                    <span className="text-muted" style={{ fontSize: 11 }}>
                      {c.createdAt?.toDate ? getTimeAgo(c.createdAt.toDate()) : ''}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{c.text}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="modal-footer" style={{ gap: 8, position: 'relative' }}>
          <button className="btn-icon" onClick={() => setShowEmoji(!showEmoji)}>
            <Smile size={20} />
          </button>
          <input
            type="text"
            className="chat-input"
            placeholder="Write a comment..."
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleComment()}
            style={{ flex: 1 }}
          />
          <button className="send-btn" onClick={handleComment} disabled={posting || !text.trim()}>
            {posting ? <Loader size={16} className="spin" /> : <Send size={16} />}
          </button>

          {showEmoji && (
            <div className="emoji-picker-container" style={{ position: 'absolute', bottom: '100%', left: 0, zIndex: 1000, marginBottom: 10 }}>
              <EmojiPicker
                onEmojiClick={(emojiData) => setText(prev => prev + emojiData.emoji)}
                theme="dark"
                width={300}
                height={350}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Post Card ─────────────────────────────────────────────────────────────────
function PostCard({ post, currentUser }) {
  const [liked, setLiked] = useState(
    Array.isArray(post.likes) && currentUser ? post.likes.includes(currentUser.uid) : false
  );
  const [likesCount, setLikesCount] = useState(
    Array.isArray(post.likes) ? post.likes.length : post.likes || 0
  );
  const [saved, setSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const isOwnPost = currentUser?.uid === post.userId;

  async function handleLike() {
    if (!currentUser) return;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount(prev => nextLiked ? prev + 1 : prev - 1);
    await toggleLike(post.id, currentUser.uid).catch(err => {
      console.error(err);
      // Revert on failure
      setLiked(!nextLiked);
      setLikesCount(prev => nextLiked ? prev - 1 : prev + 1);
    });
  }

  async function handleFollow() {
    if (!currentUser || isOwnPost) return;
    setFollowLoading(true);
    try {
      const nowFollowing = await followUser(currentUser.uid, post.userId);
      setFollowed(nowFollowing);
    } catch (err) {
      console.error('Follow error:', err);
    } finally {
      setFollowLoading(false);
    }
  }

  async function handleShare() {
    const shareData = {
      title: post.title || 'Check this post on Lexora',
      text: post.text?.slice(0, 100) || 'Interesting post on Lexora',
      url: `${window.location.origin}/home`,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        // Simple toast via alert for now
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
    }
  }

  const initials = (post.displayName || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const timeAgo = post.createdAt?.toDate
    ? getTimeAgo(post.createdAt.toDate())
    : 'Just now';

  const commentCount = post.commentCount || (Array.isArray(post.comments) ? post.comments.length : 0);

  return (
    <article className="post-card glass-card animate-fadeIn">
      {/* Header */}
      <div className="post-card__header">
        <div className="flex items-center gap-3">
          {post.photoURL
            ? <img src={post.photoURL} alt={post.displayName} className="avatar avatar-md" />
            : <div className="avatar avatar-md" style={{ background: 'var(--gradient-primary)' }}>{initials}</div>
          }
          <div>
            <p className="font-semibold" style={{ fontSize: 15 }}>{post.displayName || 'Lexora User'}</p>
            <p className="text-muted text-sm">{timeAgo}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {post.topic && <span className="badge badge-primary">{post.topic}</span>}
          {!isOwnPost && (
            <button
              className={`btn btn-ghost`}
              style={{ fontSize: 12, padding: '4px 12px', gap: 4, opacity: followLoading ? 0.6 : 1 }}
              onClick={handleFollow}
              disabled={followLoading}
              title={followed ? 'Unfollow' : 'Follow'}
            >
              {followed
                ? <><UserCheck size={13} /> Following</>
                : <><UserPlus size={13} /> Follow</>
              }
            </button>
          )}
          <button className="btn-icon"><MoreHorizontal size={18} /></button>
        </div>
      </div>

      {/* Image */}
      {post.imageUrl && (
        <div className="post-card__image-wrap">
          <img src={post.imageUrl} alt="Post" className="post-card__image" loading="lazy" />
          <div className="post-card__image-overlay" />
        </div>
      )}

      {/* Body */}
      <div className="post-card__body">
        {post.title && <h3 className="post-card__title">{post.title}</h3>}
        {post.text && <p className="post-card__text text-secondary text-sm">{post.text}</p>}
      </div>

      {/* Actions */}
      <div className="post-card__actions">
        <div className="flex items-center gap-4">
          <button
            className={`post-action ${liked ? 'post-action--liked' : ''}`}
            onClick={handleLike}
          >
            <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
            <span>{likesCount}</span>
          </button>
          <button className="post-action" onClick={() => setShowComments(true)}>
            <MessageCircle size={20} />
            <span>{commentCount}</span>
          </button>
          <button className="post-action" onClick={handleShare}>
            <Share2 size={20} />
            <span>{post.shares || 0}</span>
          </button>
        </div>
        <button
          className={`post-action ${saved ? 'post-action--saved' : ''}`}
          onClick={() => setSaved(!saved)}
        >
          <Bookmark size={20} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Comments Modal */}
      {showComments && (
        <CommentSection post={post} currentUser={currentUser} onClose={() => setShowComments(false)} />
      )}
    </article>
  );
}

// ── Create Post Modal ────────────────────────────────────────────────────────
function CreatePostModal({ user, onClose }) {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const fileRef = useRef();

  function handleImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handlePost() {
    if (!text.trim() && !imageFile) return;
    setLoading(true);
    try {
      await createPost(user.uid, user.displayName, user.photoURL, text, imageFile, topic);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const initials = (user.displayName || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="modal-overlay animate-fadeIn" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card glass-card animate-scaleIn">
        <div className="modal-header">
          <h3 className="font-display font-bold" style={{ fontSize: 18 }}>Create Post</h3>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="flex gap-3 mb-4">
            {user.photoURL
              ? <img src={user.photoURL} alt="me" className="avatar avatar-md" />
              : <div className="avatar avatar-md" style={{ background: 'var(--gradient-primary)' }}>{initials}</div>
            }
            <div className="flex-1">
              <p className="font-semibold">{user.displayName || 'You'}</p>
              <select
                className="auth-input mt-1"
                style={{ padding: '4px 8px', fontSize: 12, height: 'auto' }}
                value={topic}
                onChange={e => setTopic(e.target.value)}
              >
                <option value="">No topic</option>
                <option>Technology</option><option>Science</option><option>Philosophy</option>
                <option>Space</option><option>Biology</option><option>History</option>
                <option>Math</option><option>Psychology</option>
              </select>
            </div>
          </div>
          <textarea
            className="post-textarea"
            placeholder="Share what's on your mind, what you're doing, or just say hi! Lexora is your space to connect."
            value={text}
            onChange={e => setText(e.target.value)}
            rows={4}
          />
          {preview && (
            <div className="post-preview-wrap">
              <img src={preview} alt="preview" className="post-preview-img" />
              <button className="post-preview-remove" onClick={() => { setImageFile(null); setPreview(null); }}>
                <X size={14} />
              </button>
            </div>
          )}
        </div>
        <div className="modal-footer" style={{ position: 'relative' }}>
          <button className="btn btn-ghost" onClick={() => setShowEmoji(!showEmoji)}>
            <Smile size={16} /> Emoji
          </button>
          <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
            <Camera size={16} /> Photo
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} />
          <button
            className="btn btn-primary"
            onClick={handlePost}
            disabled={loading || (!text.trim() && !imageFile)}
          >
            {loading ? <Loader size={16} className="spin" /> : <><Send size={16} /> Post</>}
          </button>

          {showEmoji && (
            <div className="emoji-picker-container" style={{ position: 'absolute', bottom: '100%', right: 0, zIndex: 1000, marginBottom: 10 }}>
              <EmojiPicker
                onEmojiClick={(emojiData) => setText(prev => prev + emojiData.emoji)}
                theme="dark"
                width={300}
                height={350}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Story Viewer ─────────────────────────────────────────────────────────────
function StoryViewer({ story, onClose }) {
  return (
    <div className="modal-overlay animate-fadeIn" onClick={onClose}>
      <div className="story-viewer animate-scaleIn" onClick={e => e.stopPropagation()}>
        <button className="story-viewer__close btn-icon" onClick={onClose}><X size={20} /></button>
        <div className="story-viewer__progress" />
        <div className="story-viewer__header">
          <div className="avatar avatar-sm" style={{ background: 'var(--gradient-primary)' }}>
            {(story.displayName || 'U')[0]}
          </div>
          <div>
            <p className="font-semibold text-sm">{story.displayName || 'User'}</p>
            <p className="text-xs text-muted">
              {story.createdAt?.toDate ? getTimeAgo(story.createdAt.toDate()) : ''}
            </p>
          </div>
        </div>
        {story.imageUrl
          ? <img src={story.imageUrl} alt="Story" className="story-viewer__img" />
          : <div className="story-viewer__text-only">{story.caption || ''}</div>
        }
        {story.caption && story.imageUrl && (
          <p className="story-viewer__caption">{story.caption}</p>
        )}
      </div>
    </div>
  );
}

// ── Add Story Modal ───────────────────────────────────────────────────────────
function AddStoryModal({ user, onClose }) {
  const [caption, setCaption] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  function handleImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handlePost() {
    if (!caption.trim() && !imageFile) return;
    setLoading(true);
    try {
      await postStory(user.uid, user.displayName, user.photoURL, imageFile, caption);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay animate-fadeIn" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card glass-card animate-scaleIn">
        <div className="modal-header">
          <h3 className="font-display font-bold" style={{ fontSize: 18 }}>Add Story</h3>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          {preview
            ? <div className="post-preview-wrap"><img src={preview} alt="preview" className="post-preview-img" />
              <button className="post-preview-remove" onClick={() => { setImageFile(null); setPreview(null); }}><X size={14} /></button>
            </div>
            : <div className="story-upload-placeholder" onClick={() => fileRef.current?.click()}>
              <Camera size={32} />
              <span>Tap to add photo</span>
            </div>
          }
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} />
          <textarea
            className="post-textarea mt-3"
            placeholder="Add a caption... (optional)"
            value={caption}
            onChange={e => setCaption(e.target.value)}
            rows={2}
          />
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handlePost}
            disabled={loading || (!caption.trim() && !imageFile)}
          >
            {loading ? <Loader size={16} className="spin" /> : 'Share Story'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Feed ────────────────────────────────────────────────────────────────
export default function HomeFeed() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { posts, loading: postsLoading } = usePosts();
  const stories = useStories();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showAddStory, setShowAddStory] = useState(false);
  const [activeStory, setActiveStory] = useState(null);

  const initials = (user?.displayName || user?.email || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const TRENDING_TOPICS = ['#AIRevolution', '#QuantumComputing', '#DeepOcean', '#Consciousness', '#SpaceMining'];

  return (
    <div className="home-feed">
      {/* Stories */}
      <section className="stories-bar">
        {/* Add Story */}
        <div className="story-item" onClick={() => setShowAddStory(true)}>
          <div className="story-ring story-ring--add">
            {user?.photoURL
              ? <img src={user.photoURL} alt="me" className="avatar avatar-md" />
              : <div className="avatar avatar-md" style={{ background: 'var(--gradient-primary)' }}>{initials}</div>
            }
            <div className="story-plus-badge"><Plus size={12} /></div>
          </div>
          <span className="story-name text-xs">Your Story</span>
        </div>

        {/* Firebase Stories */}
        {stories.map(s => (
          <div key={s.id} className="story-item" onClick={() => setActiveStory(s)}>
            <div className="story-ring">
              {s.photoURL
                ? <img src={s.photoURL} alt={s.displayName} className="avatar avatar-md" />
                : <div className="avatar avatar-md" style={{ background: 'var(--gradient-primary)' }}>
                  {(s.displayName || 'U')[0]}
                </div>
              }
            </div>
            <span className="story-name text-xs">{s.displayName?.split(' ')[0] || 'User'}</span>
          </div>
        ))}
      </section>

      {/* Create Post Bar */}
      <div className="create-post-bar glass-card mb-6" onClick={() => setShowCreatePost(true)}>
        {user?.photoURL
          ? <img src={user.photoURL} alt="me" className="avatar avatar-sm" />
          : <div className="avatar avatar-sm" style={{ background: 'var(--gradient-primary)' }}>{initials}</div>
        }
        <div className="create-post-placeholder">
          Share something with the community...
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost" style={{ fontSize: 13, padding: '6px 14px' }}
            onClick={e => { e.stopPropagation(); setShowCreatePost(true); }}>
            <Camera size={15} /> Photo
          </button>
          <button className="btn btn-primary" style={{ fontSize: 13, padding: '6px 14px' }}>
            <Send size={15} /> Post
          </button>
        </div>
      </div>

      {/* Feed */}
      <section className="feed-container">
        <div className="feed-main">
          {postsLoading && (
            <div className="feed-loading">
              {[1, 2, 3].map(i => (
                <div key={i} className="glass-card p-5" style={{ marginBottom: 24 }}>
                  <div className="flex gap-3 mb-4">
                    <div className="skeleton-circle" />
                    <div className="flex-1">
                      <div className="skeleton-line w-1/3 mb-2" />
                      <div className="skeleton-line w-1/4" />
                    </div>
                  </div>
                  <div className="skeleton-block" />
                </div>
              ))}
            </div>
          )}

          {!postsLoading && posts.length === 0 && (
            <div className="feed-empty glass-card">
              <MessageSquare size={40} />
              <p className="font-semibold mt-4" style={{ fontSize: 18 }}>No posts yet</p>
              <p className="text-secondary text-sm mt-2">Be the first to share something!</p>
              <button className="btn btn-primary mt-6" onClick={() => setShowCreatePost(true)}>
                <Plus size={16} /> Create Post
              </button>
            </div>
          )}

          {posts.map(post => (
            <PostCard key={post.id} post={post} currentUser={user} />
          ))}
        </div>

        {/* Sidebar */}
        <aside className="feed-sidebar">
          <div className="glass-card suggestions-card p-4">
            <h4 className="font-semibold mb-4" style={{ fontSize: 14, letterSpacing: '0.05em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Suggested for You
            </h4>
            {[
              { name: 'Zoe Keller', handle: '@zoekeller', initials: 'ZK', gradient: 'linear-gradient(135deg,#f43f5e,#f97316)', topic: 'Physics & Space' },
              { name: 'Rex Park', handle: '@rexpark', initials: 'RP', gradient: 'linear-gradient(135deg,#8b5cf6,#ec4899)', topic: 'Philosophy' },
              { name: 'Nora James', handle: '@norajames', initials: 'NJ', gradient: 'linear-gradient(135deg,#06b6d4,#10b981)', topic: 'Biology' },
            ].map(u => (
              <div key={u.handle} className="suggestion-item">
                <div className="flex items-center gap-3">
                  <div className="avatar avatar-sm" style={{ background: u.gradient }}>{u.initials}</div>
                  <div>
                    <p className="font-semibold" style={{ fontSize: 13 }}>{u.name}</p>
                    <p className="text-muted text-xs">{u.topic}</p>
                  </div>
                </div>
                <button className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: 12 }}>Follow</button>
              </div>
            ))}
          </div>

          <div className="glass-card trending-card p-4 mt-4">
            <h4 className="font-semibold mb-4" style={{ fontSize: 14, letterSpacing: '0.05em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Trending Topics
            </h4>
            {TRENDING_TOPICS.map((tag, i) => (
              <div
                key={tag}
                className="trending-tag"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/explore?topic=${encodeURIComponent(tag.replace('#', ''))}`)}
              >
                <span className="trending-tag__num">{i + 1}</span>
                <span className="trending-tag__label">{tag}</span>
              </div>
            ))}
          </div>
        </aside>
      </section>

      {/* Modals */}
      {showCreatePost && (
        <CreatePostModal user={user} onClose={() => setShowCreatePost(false)} />
      )}
      {showAddStory && (
        <AddStoryModal user={user} onClose={() => setShowAddStory(false)} />
      )}
      {activeStory && (
        <StoryViewer story={activeStory} onClose={() => setActiveStory(null)} />
      )}
    </div>
  );
}
