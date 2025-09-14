import { auth, db } from './firebase.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { doc, setDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

function generateUserId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function isUserIdUnique(userId) {
  const q = query(collection(db, "users"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.empty;
}

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

export async function register(email, password, username) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  const pendingUserData = {
    email,
    username,
    password,
    uid: userCredential.user.uid,
    createdAt: Date.now()
  };
  localStorage.setItem('pendingUserData', JSON.stringify(pendingUserData));
  
  return userCredential.user;
}

// SECURITY NOTE: This function should ONLY be called after proper email verification
// has been completed via the email verification link (action code). It should NOT
// be called manually or through the "I've Verified My Email" button without
// the user having clicked a valid email verification link.
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
    userId,
    createdAt: userData.createdAt,
    following: [],
    followers: []
  });
  
  localStorage.removeItem('pendingUserData');
  
  return userData.uid;
}

export async function login(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  
  if (!userCredential.user.emailVerified) {
    await signOut(auth);
    throw new Error('EMAIL_NOT_VERIFIED');
  }
  
  const userDoc = await getDocs(query(collection(db, "users"), where("email", "==", email)));
  if (userDoc.empty) {
    await signOut(auth);
    throw new Error('ACCOUNT_NOT_COMPLETED');
  }
  
  return userCredential.user;
}

export function logout() {
  return signOut(auth);
}

export function onUserChanged(callback) {
  return onAuthStateChanged(auth, callback);
}
