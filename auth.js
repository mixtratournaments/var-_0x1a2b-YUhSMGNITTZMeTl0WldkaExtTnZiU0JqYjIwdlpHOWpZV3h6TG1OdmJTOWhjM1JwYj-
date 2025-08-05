// auth.js
import { auth, db } from './firebase.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { doc, setDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Generate random 12-character user ID
function generateUserId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Check if user ID is unique
async function isUserIdUnique(userId) {
  const q = query(collection(db, "users"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.empty;
}

// Generate unique user ID
async function generateUniqueUserId() {
  let userId;
  let attempts = 0;
  const maxAttempts = 10;
  
  do {
    userId = generateUserId();
    attempts++;
    if (attempts > maxAttempts) {
      throw new Error('Could not generate unique user ID after multiple attempts');
    }
  } while (!(await isUserIdUnique(userId)));
  
  return userId;
}

// Register new user (creates Firebase auth account only, Firestore data added after verification)
export async function register(email, password, username) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  // Store pending user data in localStorage for after verification
  const pendingUserData = {
    email,
    username,
    uid: userCredential.user.uid,
    createdAt: Date.now()
  };
  localStorage.setItem('pendingUserData', JSON.stringify(pendingUserData));
  
  return userCredential.user;
}

// Complete user registration after email verification
export async function completeRegistration() {
  const pendingData = localStorage.getItem('pendingUserData');
  if (!pendingData) {
    throw new Error('No pending registration data found');
  }
  
  const userData = JSON.parse(pendingData);
  const userId = await generateUniqueUserId();
  
  await setDoc(doc(db, "users", userData.uid), {
    email: userData.email,
    username: userData.username,
    userId, // 12-character unique ID
    createdAt: userData.createdAt,
    following: [],
    followers: []
  });
  
  // Clear pending data
  localStorage.removeItem('pendingUserData');
  
  return userData.uid;
}

// Sign in
export async function login(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  
  // Check if email is verified
  if (!userCredential.user.emailVerified) {
    // Sign out the user since they're not verified
    await signOut(auth);
    throw new Error('EMAIL_NOT_VERIFIED');
  }
  
  // Check if user exists in Firestore (completed registration)
  const userDoc = await getDocs(query(collection(db, "users"), where("email", "==", email)));
  if (userDoc.empty) {
    // User doesn't exist in Firestore, sign them out
    await signOut(auth);
    throw new Error('ACCOUNT_NOT_COMPLETED');
  }
  
  return userCredential.user;
}

// Sign out
export function logout() {
  return signOut(auth);
}

// Auth state listener
export function onUserChanged(callback) {
  return onAuthStateChanged(auth, callback);
}
