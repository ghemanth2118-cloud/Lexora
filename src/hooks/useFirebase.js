import { useState, useEffect, useRef } from 'react';
import {
  collection, addDoc, query, orderBy, limit, onSnapshot,
  serverTimestamp, where, getDocs, updateDoc, doc, deleteDoc,
  getDoc, setDoc, increment, arrayUnion, arrayRemove
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

// ── Real-time chat messages for a conversation ────────────────────────────────
export function useMessages(conversationId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId) return;
    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [conversationId]);

  return { messages, loading };
}

export async function sendMessage(conversationId, senderId, senderName, text) {
  if (!text.trim()) return;
  await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
    senderId, senderName,
    text: text.trim(),
    createdAt: serverTimestamp(),
    read: false,
  });
  // Update last message in conversation doc
  const convRef = doc(db, 'conversations', conversationId);
  const convSnap = await getDoc(convRef);
  if (convSnap.exists()) {
    await updateDoc(convRef, { lastMessage: text.trim(), lastMessageAt: serverTimestamp() });
  } else {
    await setDoc(convRef, { lastMessage: text.trim(), lastMessageAt: serverTimestamp() });
  }
}

// ── Stories (real-time) ───────────────────────────────────────────────────────
export function useStories() {
  const [stories, setStories] = useState([]);

  useEffect(() => {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const q = query(
      collection(db, 'stories'),
      where('createdAt', '>', cutoff),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsub = onSnapshot(q, snap => {
      setStories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  return stories;
}

export async function postStory(userId, displayName, photoURL, imageFile, caption) {
  let imageUrl = null;
  if (imageFile) {
    const storageRef = ref(storage, `stories/${userId}/${Date.now()}_${imageFile.name}`);
    const snap = await uploadBytes(storageRef, imageFile);
    imageUrl = await getDownloadURL(snap.ref);
  }
  await addDoc(collection(db, 'stories'), {
    userId, displayName, photoURL: photoURL || null,
    imageUrl, caption: caption || '',
    viewed: [],
    createdAt: serverTimestamp(),
  });
}

// ── Feed Posts ────────────────────────────────────────────────────────────────
export function usePosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(30));
    const unsub = onSnapshot(q, snap => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  return { posts, loading };
}

export async function createPost(userId, displayName, photoURL, text, imageFile, topic) {
  let imageUrl = null;
  if (imageFile) {
    const storageRef = ref(storage, `posts/${userId}/${Date.now()}_${imageFile.name}`);
    const snap = await uploadBytes(storageRef, imageFile);
    imageUrl = await getDownloadURL(snap.ref);
  }
  const post = await addDoc(collection(db, 'posts'), {
    userId, displayName, photoURL: photoURL || null,
    text, imageUrl, topic: topic || 'General',
    likes: [], comments: [], shares: 0,
    createdAt: serverTimestamp(),
  });
  // Update user's post count
  await updateDoc(doc(db, 'users', userId), { posts: increment(1) }).catch(() => { });
  return post;
}

export async function toggleLike(postId, userId) {
  const postRef = doc(db, 'posts', postId);
  const snap = await getDoc(postRef);
  if (!snap.exists()) return;
  const likes = snap.data().likes || [];
  if (likes.includes(userId)) {
    await updateDoc(postRef, { likes: arrayRemove(userId) });
  } else {
    await updateDoc(postRef, { likes: arrayUnion(userId) });
    // Notify post owner
    const postData = snap.data();
    if (postData.userId !== userId) {
      await createNotification(postData.userId, userId, 'like', `liked your post`, postId);
    }
  }
}

// ── Comments ──────────────────────────────────────────────────────────────────
export function useComments(postId) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;
    const q = query(
      collection(db, 'posts', postId, 'comments'),
      orderBy('createdAt', 'asc'),
      limit(50)
    );
    const unsub = onSnapshot(q, snap => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [postId]);

  return { comments, loading };
}

export async function addComment(postId, userId, displayName, photoURL, text) {
  if (!text.trim()) return;
  await addDoc(collection(db, 'posts', postId, 'comments'), {
    userId, displayName, photoURL: photoURL || null,
    text: text.trim(),
    likes: [],
    createdAt: serverTimestamp(),
  });
  // Increment comment count on post
  await updateDoc(doc(db, 'posts', postId), { commentCount: increment(1) });
  // Notify post owner
  const postSnap = await getDoc(doc(db, 'posts', postId));
  if (postSnap.exists() && postSnap.data().userId !== userId) {
    await createNotification(postSnap.data().userId, userId, 'comment', `commented on your post`, postId);
  }
}

// ── Follows ───────────────────────────────────────────────────────────────────
export function useFollows(userId) {
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  useEffect(() => {
    if (!userId) return;

    const followersQuery = query(collection(db, 'follows'), where('targetId', '==', userId));
    const followingQuery = query(collection(db, 'follows'), where('followerId', '==', userId));

    const unsubFollowers = onSnapshot(followersQuery, snap => {
      setFollowers(snap.docs.map(d => d.data().followerId));
    });
    const unsubFollowing = onSnapshot(followingQuery, snap => {
      setFollowing(snap.docs.map(d => d.data().targetId));
    });

    return () => { unsubFollowers(); unsubFollowing(); };
  }, [userId]);

  return { followers, following };
}

export async function followUser(followerId, targetId) {
  if (followerId === targetId) return;
  const followId = `${followerId}_${targetId}`;
  const followRef = doc(db, 'follows', followId);
  const snap = await getDoc(followRef);
  if (snap.exists()) {
    // Unfollow
    await deleteDoc(followRef);
    await updateDoc(doc(db, 'users', followerId), { following: increment(-1) }).catch(() => { });
    await updateDoc(doc(db, 'users', targetId), { followers: increment(-1) }).catch(() => { });
    return false; // unfollowed
  } else {
    // Follow
    await setDoc(followRef, {
      followerId, targetId,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'users', followerId), { following: increment(1) }).catch(() => { });
    await updateDoc(doc(db, 'users', targetId), { followers: increment(1) }).catch(() => { });
    await createNotification(targetId, followerId, 'follow', 'started following you');
    return true; // followed
  }
}

export async function isFollowing(followerId, targetId) {
  const followRef = doc(db, 'follows', `${followerId}_${targetId}`);
  const snap = await getDoc(followRef);
  return snap.exists();
}

// ── Notifications ─────────────────────────────────────────────────────────────
export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, 'notifications'),
      where('targetUserId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(30)
    );
    const unsub = onSnapshot(q, snap => {
      const notifs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    });
    return unsub;
  }, [userId]);

  return { notifications, unreadCount };
}

export async function createNotification(targetUserId, actorId, type, message, postId = null) {
  // Get actor's display name
  const actorSnap = await getDoc(doc(db, 'users', actorId)).catch(() => null);
  const actorName = actorSnap?.data()?.displayName || 'Someone';
  const actorPhoto = actorSnap?.data()?.photoURL || null;

  await addDoc(collection(db, 'notifications'), {
    targetUserId,
    actorId,
    actorName,
    actorPhoto,
    type, // 'like' | 'comment' | 'follow'
    message,
    postId,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export async function markNotificationsRead(userId) {
  const q = query(
    collection(db, 'notifications'),
    where('targetUserId', '==', userId),
    where('read', '==', false)
  );
  const snap = await getDocs(q);
  const updates = snap.docs.map(d => updateDoc(d.ref, { read: true }));
  await Promise.all(updates);
}

// ── User Profile ──────────────────────────────────────────────────────────────
export function useUserProfile(userId) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const unsub = onSnapshot(doc(db, 'users', userId), snap => {
      setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      setLoading(false);
    });
    return unsub;
  }, [userId]);

  return { profile, loading };
}

export async function updateUserProfile(userId, updates) {
  await updateDoc(doc(db, 'users', userId), updates);
}

// ── Saved Topics ──────────────────────────────────────────────────────────────
export function useSavedTopics(userId) {
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, 'savedTopics'),
      where('userId', '==', userId),
      orderBy('savedAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setSaved(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [userId]);

  return saved;
}

export async function saveTopic(userId, topic, badge, description) {
  // Check if already saved
  const q = query(
    collection(db, 'savedTopics'),
    where('userId', '==', userId),
    where('topic', '==', topic)
  );
  const existing = await getDocs(q);
  if (!existing.empty) return; // already saved

  await addDoc(collection(db, 'savedTopics'), {
    userId, topic, badge: badge || 'General', description: description || '',
    savedAt: serverTimestamp(),
  });
}

export async function removeSavedTopic(docId) {
  await deleteDoc(doc(db, 'savedTopics', docId));
}

// ── File Upload helper ────────────────────────────────────────────────────────
export async function uploadFile(path, file) {
  const storageRef = ref(storage, path);
  const snap = await uploadBytes(storageRef, file);
  return getDownloadURL(snap.ref);
}
