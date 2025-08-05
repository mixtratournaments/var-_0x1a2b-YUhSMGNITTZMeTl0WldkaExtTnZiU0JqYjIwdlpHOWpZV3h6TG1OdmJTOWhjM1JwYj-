// posts.js
import { db } from './firebase.js';
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Create a post with title/subject and optional images
export async function createPost(authorId, text, title = "", images = []) {
  return await addDoc(collection(db, "posts"), {
    authorId,
    text,
    title,
    timestamp: serverTimestamp(),
    mediaUrls: images.map(img => img.url) // Store image URLs from server
  });
}

// Get all posts (newest first) with usernames and user IDs
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

export async function getPosts() {
  const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
  const snapshot = await getDocs(q);
  // Fetch usernames and user IDs for each post
  const posts = await Promise.all(snapshot.docs.map(async docSnap => {
    const data = docSnap.data();
    let username = data.authorId;
    let userId = null;
    try {
      const userDoc = await getDoc(doc(db, "users", data.authorId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        username = userData.username || data.authorId;
        userId = userData.userId || null;
      }
    } catch {}
    return { id: docSnap.id, ...data, username, userId };
  }));
  return posts;
}
