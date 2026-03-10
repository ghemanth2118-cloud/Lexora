/**
 * Lexora Seed Data Script
 * Run this ONCE to create fake accounts and sample posts in Firebase.
 * 
 * Usage: node src/scripts/seedData.js
 * (Requires firebase-admin or run from browser via /seed route)
 */

import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase.js';

export const SEED_ACCOUNTS = [
  { email: 'luna@lexora.dev', password: 'Lexora@123', name: 'Luna Rivera', bio: 'AI researcher & science communicator. Exploring the frontier of machine intelligence.', topic: 'AI & Technology' },
  { email: 'kai@lexora.dev', password: 'Lexora@123', name: 'Kai Mori', bio: 'Deep ocean explorer. Marine biologist. Passionate about the mysteries beneath the waves.', topic: 'Science & Biology' },
  { email: 'aria@lexora.dev', password: 'Lexora@123', name: 'Aria Singh', bio: 'Philosophy PhD candidate. Obsessed with consciousness, free will, and the hard problem.', topic: 'Philosophy' },
  { email: 'zoe@lexora.dev', password: 'Lexora@123', name: 'Zoe Keller', bio: 'Astrophysicist & space enthusiast. Chasing black holes and dark matter.', topic: 'Space & Physics' },
  { email: 'rex@lexora.dev', password: 'Lexora@123', name: 'Rex Park', bio: 'Neuroscientist studying memory and learning. Building the future of human cognition.', topic: 'Neuroscience' },
];

const SAMPLE_POSTS = [
  {
    userIdx: 0,
    text: `AI in 2026 is no longer just a tool — it's a collaborator. The latest multimodal models can reason across text, images, audio, and video simultaneously. We're entering an era where AI doesn't just answer questions, it asks the right ones. The implications for science, medicine, and creativity are staggering. What excites me most? AI is helping us discover proteins we never thought possible. 🧬`,
    imageUrl: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80',
    topic: 'Technology',
  },
  {
    userIdx: 1,
    text: `New expedition results: we found bioluminescent organisms in the Mariana Trench at 10,900m depth that have never been documented. Their bio-chemical processes could revolutionize our understanding of extremophile life — and by extension, the conditions needed for life beyond Earth. The deep ocean is truly the final frontier on our own planet.`,
    imageUrl: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=800&q=80',
    topic: 'Science',
  },
  {
    userIdx: 2,
    text: `Here's the paradox that keeps philosophers up at night: if every decision you make is the result of prior causes (brain chemistry, history, environment), in what sense are YOU making any decisions at all? Free will might be the greatest illusion ever constructed — not by society, but by the very neurons firing in your head right now as you read this.`,
    imageUrl: 'https://images.unsplash.com/photo-1558021212-51b6ecfa0db9?w=800&q=80',
    topic: 'Philosophy',
  },
  {
    userIdx: 3,
    text: `Black holes aren't just cosmic vacuum cleaners. They're information paradoxes. When matter falls into a black hole, does the information it carries get destroyed? Hawking said yes — but quantum mechanics says information can never truly be lost. We've been arguing about this for 50 years. The answer might rewrite the laws of physics as we know them.`,
    imageUrl: 'https://images.unsplash.com/photo-1462332420958-a05d1e002413?w=800&q=80',
    topic: 'Space',
  },
  {
    userIdx: 4,
    text: `Your brain rewires itself every time you learn something new. This process — neuroplasticity — continues throughout your entire life. The old belief that adult brains were "fixed" is now completely debunked. Even at 80, you can form new neural pathways. Sleep is the key: during deep sleep, the brain literally replays your day to consolidate memories. Don't skip your sleep.`,
    imageUrl: 'https://images.unsplash.com/photo-1559757175-7cb66c8e49eb?w=800&q=80',
    topic: 'Biology',
  },
  {
    userIdx: 0,
    text: `Quantum computing just hit a landmark: 1000+ qubit stable operation for 60 seconds. That's the threshold for "quantum advantage" in real-world drug discovery problems. We're not post-quantum yet, but the countdown has begun. Classical encryption has a shelf life now — and yes, your bank knows about it and is already preparing.`,
    imageUrl: null,
    topic: 'Technology',
  },
  {
    userIdx: 1,
    text: `Did you know the ocean produces 50% of Earth's oxygen? More than all the rainforests combined. And yet we've explored less than 20% of it. Every deep-sea mission finds new species. Last month alone: 3 new fish species, 2 new jellyfish, and what appears to be a previously unknown genus of cephalopod. We know more about the surface of Mars than our own ocean floor.`,
    imageUrl: null,
    topic: 'Biology',
  },
];

export async function seedDatabase() {
  console.log('🌱 Starting Lexora seed...');
  const createdUsers = [];

  for (const account of SEED_ACCOUNTS) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, account.email, account.password);
      await updateProfile(cred.user, { displayName: account.name });
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        displayName: account.name,
        email: account.email,
        photoURL: null,
        bio: account.bio,
        topic: account.topic,
        followers: 0,
        following: 0,
        posts: 0,
        createdAt: serverTimestamp(),
      });
      createdUsers.push({ ...account, uid: cred.user.uid });
      console.log(`✅ Created: ${account.name}`);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        console.log(`⚠️  Already exists: ${account.email}`);
      } else {
        console.error(`❌ Failed ${account.name}:`, err.message);
      }
    }
  }

  // Create sample posts
  for (const post of SAMPLE_POSTS) {
    const user = createdUsers[post.userIdx];
    if (!user) continue;
    try {
      await addDoc(collection(db, 'posts'), {
        userId: user.uid,
        displayName: user.name,
        photoURL: null,
        text: post.text,
        imageUrl: post.imageUrl,
        topic: post.topic,
        likes: [],
        commentCount: 0,
        shares: 0,
        createdAt: serverTimestamp(),
      });
      console.log(`📝 Post created for ${user.name}`);
    } catch (err) {
      console.error('Post error:', err);
    }
  }

  console.log('✅ Seed complete!');
  return createdUsers;
}
