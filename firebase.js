import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyC8tI2w4IselKQnAICoAcPsVryK7tXYvq8",
  authDomain: "hubblealpha.firebaseapp.com",
  projectId: "hubblealpha",
  storageBucket: "hubblealpha.firebasestorage.app",
  messagingSenderId: "1019025958368",
  appId: "1:1019025958368:web:4b1a907be2b098c1b67785",
  measurementId: "G-TW9QCGPN5V"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
