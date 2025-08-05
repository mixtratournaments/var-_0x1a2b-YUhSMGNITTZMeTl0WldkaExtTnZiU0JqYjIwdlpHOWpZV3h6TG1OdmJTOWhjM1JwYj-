// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBux2kG1l-5tRFODUZfkPWheKxw4tUxZ5Q",
  authDomain: "hubbletextserver.firebaseapp.com",
  projectId: "hubbletextserver",
  storageBucket: "hubbletextserver.firebasestorage.app",
  messagingSenderId: "504599724853",
  appId: "1:504599724853:web:a30ffc7bf043cd4d2f827c",
  measurementId: "G-7T5QYKQJ2C"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
