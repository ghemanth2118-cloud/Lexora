import { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged, signInWithPopup, GoogleAuthProvider,
  signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  updateProfile, RecaptchaVerifier, signInWithPhoneNumber
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Sync profile to Firestore
        const ref = doc(db, 'users', firebaseUser.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'Anonymous',
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL || null,
            bio: '',
            followers: 0,
            following: 0,
            posts: 0,
            createdAt: serverTimestamp(),
          });
        }
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }

  async function loginWithEmail(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function registerWithEmail(email, password, displayName) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      displayName,
      email,
      photoURL: null,
      bio: '',
      followers: 0,
      following: 0,
      posts: 0,
      createdAt: serverTimestamp(),
    });
    return cred;
  }

  async function setupRecaptcha(containerId) {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
      });
    }
    return window.recaptchaVerifier;
  }

  async function sendOtp(phoneNumber, appVerifier) {
    return signInWithPhoneNumber(auth, phoneNumber, appVerifier);
  }

  async function verifyOtp(confirmationResult, code) {
    const cred = await confirmationResult.confirm(code);
    // Sync to firestore if new
    const ref = doc(db, 'users', cred.user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: cred.user.uid,
        displayName: 'Phone User',
        email: cred.user.phoneNumber,
        photoURL: null,
        bio: '',
        followers: 0,
        following: 0,
        posts: 0,
        createdAt: serverTimestamp(),
      });
    }
    return cred;
  }

  async function logout() {
    return signOut(auth);
  }

  return (
    <AuthContext.Provider value={{
      user, loading, loginWithGoogle, loginWithEmail, registerWithEmail,
      logout, setupRecaptcha, sendOtp, verifyOtp
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
