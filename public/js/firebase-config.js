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

// Live Firebase Project Configuration for Epic Music
export const firebaseConfig = {
  apiKey: "AIzaSyD4IYt-cfkbxn6ktc1gPStGYZtxij4AjbY",
  authDomain: "epic-music-98.firebaseapp.com",
  projectId: "epic-music-98",
  storageBucket: "epic-music-98.firebasestorage.app",
  messagingSenderId: "917981424080",
  appId: "1:917981424080:web:43ff7fa676eeed363eb1d5"
};

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
