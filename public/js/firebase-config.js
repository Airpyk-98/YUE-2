// Firebase Configuration Module (Modular SDK v10)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Read from localStorage or use default project configuration
const savedConfig = localStorage.getItem("epic_firebase_config");
const defaultFirebaseConfig = {
  apiKey: "AIzaSyDemoKeyReplaceWithYours",
  authDomain: "epic-yue2-automation.firebaseapp.com",
  projectId: "epic-yue2-automation",
  storageBucket: "epic-yue2-automation.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
};

export const firebaseConfig = savedConfig ? JSON.parse(savedConfig) : defaultFirebaseConfig;

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  serverTimestamp
};
