import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCv0SLchgSsTI78Opt57IPO-t2TsZzibhA",
  authDomain: "lexora-e299d.firebaseapp.com",
  projectId: "lexora-e299d",
  storageBucket: "lexora-e299d.firebasestorage.app",
  messagingSenderId: "1074904936206",
  appId: "1:1074904936206:web:a0d4b1b32d738defb0f15f",
  measurementId: "G-T28TCBTRHH"
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
