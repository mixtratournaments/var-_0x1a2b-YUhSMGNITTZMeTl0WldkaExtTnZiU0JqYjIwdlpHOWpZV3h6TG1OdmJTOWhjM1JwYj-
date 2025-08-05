// app.js
import { register, login, logout, onUserChanged } from './auth.js';
import { createPost, getPosts } from './posts.js';

let currentUser = null;

// Auth state listener
onUserChanged(async (user) => {
  currentUser = user;
  // If posts section is visible, update UI
  if (document.getElementById('auth-section') && document.getElementById('app-section')) {
    if (user) {
      document.getElementById('auth-section').style.display = 'none';
      document.getElementById('app-section').style.display = '';
      await window.renderPosts();
    } else {
      document.getElementById('auth-section').style.display = '';
      document.getElementById('app-section').style.display = 'none';
    }
  }
});

// Render posts feed
async function renderPosts() {
  const postsFeed = document.getElementById('posts-feed');
  if (!postsFeed) return;
  const posts = await getPosts();
  
  postsFeed.innerHTML = posts.map(post => {
    // Calculate reaction counts
    const reactions = post.reactions || [];
    const reactionCounts = {};
    reactions.forEach(r => {
      reactionCounts[r.reaction] = (reactionCounts[r.reaction] || 0) + 1;
    });
    
    // Check current user's vote and reaction
    const currentUserVote = post.userVotes ? post.userVotes[currentUser?.uid] : null;
    const currentUserReaction = reactions.find(r => r.userId === currentUser?.uid);
    
    return `
      <div class="post-card post-animate" data-post-id="${post.id}">
        <div class="post-header">
          <span class="post-avatar" data-author-id="${post.authorId}" style="cursor: pointer;">${post.username ? post.username[0].toUpperCase() : '?'}</span>
          <span class="post-username" data-author-id="${post.authorId}" style="cursor: pointer;">${post.username || post.authorId}</span>
          <span class="post-timestamp">${post.timestamp && post.timestamp.toDate ? post.timestamp.toDate().toLocaleString() : ''}</span>
        </div>
        ${post.title ? `<div class="post-title-view">${post.title}</div>` : ''}
        <div class="post-body">${post.text}</div>
        ${post.mediaUrls && post.mediaUrls.length > 0 ? `
          <div class="post-assets">
            <div class="post-images">
              ${post.mediaUrls.map(url => `
                <div class="post-image">
                  <img src="${url}" alt="Post image" onclick="openImageModal('${url}')" style="cursor: pointer; max-width: 100%; border-radius: 8px;">
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        <div class="post-actions">
          <div class="post-votes">
            <button class="vote-btn upvote ${currentUserVote === 'up' ? 'voted' : ''}" onclick="votePost('${post.id}', 'up')" title="Upvote">
              <span class="vote-icon">▲</span>
              <span class="vote-count">${post.upvotes || 0}</span>
            </button>
            <button class="vote-btn downvote ${currentUserVote === 'down' ? 'voted' : ''}" onclick="votePost('${post.id}', 'down')" title="Downvote">
              <span class="vote-icon">▼</span>
            </button>
          </div>
          <div class="post-reactions">
            <button class="reaction-btn ${currentUserReaction?.reaction === 'heart' ? 'reacted' : ''}" onclick="addReaction('${post.id}', 'heart')" title="Love">
              <span class="reaction-icon">❤️</span>
              <span class="reaction-count">${reactionCounts['heart'] || 0}</span>
            </button>
            <button class="reaction-btn ${currentUserReaction?.reaction === 'laugh' ? 'reacted' : ''}" onclick="addReaction('${post.id}', 'laugh')" title="Laugh">
              <span class="reaction-icon">😄</span>
              <span class="reaction-count">${reactionCounts['laugh'] || 0}</span>
            </button>
            <button class="reaction-btn ${currentUserReaction?.reaction === 'wow' ? 'reacted' : ''}" onclick="addReaction('${post.id}', 'wow')" title="Wow">
              <span class="reaction-icon">😲</span>
              <span class="reaction-count">${reactionCounts['wow'] || 0}</span>
            </button>
            <button class="reaction-btn ${currentUserReaction?.reaction === 'sad' ? 'reacted' : ''}" onclick="addReaction('${post.id}', 'sad')" title="Sad">
              <span class="reaction-icon">😢</span>
              <span class="reaction-count">${reactionCounts['sad'] || 0}</span>
            </button>
            <button class="reaction-btn ${currentUserReaction?.reaction === 'angry' ? 'reacted' : ''}" onclick="addReaction('${post.id}', 'angry')" title="Angry">
              <span class="reaction-icon">😠</span>
              <span class="reaction-count">${reactionCounts['angry'] || 0}</span>
            </button>
          </div>
          <div class="post-comments">
            <button class="comment-btn" onclick="toggleComments('${post.id}')" title="Comments">
              💬 <span class="comment-count">${post.commentCount || 0}</span>
            </button>
          </div>
        </div>
        <div class="comments-section" id="comments-${post.id}" style="display: none;">
          <div class="comments-list" id="comments-list-${post.id}">
            <!-- Comments will be loaded here -->
          </div>
          <div class="comment-form">
            <textarea class="comment-input" placeholder="Write a comment..." maxlength="500"></textarea>
            <button class="comment-submit" onclick="submitComment('${post.id}')">Comment</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  // Add click handlers for user avatars and usernames
  const userElements = postsFeed.querySelectorAll('.post-avatar, .post-username');
  userElements.forEach(element => {
    element.addEventListener('click', async () => {
      const authorId = element.getAttribute('data-author-id');
      if (authorId) {
        await showUserProfile(authorId);
      }
    });
  });
  
  // Animate in with stagger
  const cards = postsFeed.querySelectorAll('.post-card');
  cards.forEach((card, i) => {
    card.style.animationDelay = (i * 0.07) + 's';
    card.classList.add('post-animate-in');
  });
}

// Setup post form event listener
function setupPostForm() {
  const postForm = document.getElementById('post-form');
  const postText = document.getElementById('post-text');
  const postTitle = document.getElementById('post-title');
  if (!postForm || !postText) return;
  postForm.onsubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    const text = postText.value.trim();
    const title = postTitle ? postTitle.value.trim() : '';
    
    // Allow posts with just images (no text required)
    const hasImages = window.selectedPostImages && window.selectedPostImages.length > 0;
    if (!text && !hasImages) return;
    
    // Check spam protection
    if (window.checkSpamProtection) {
      const canPost = await window.checkSpamProtection();
      if (!canPost) return;
    }
    
    try {
      // Upload images first if any
      const uploadedImages = [];
      if (hasImages) {
        for (const file of window.selectedPostImages) {
          const result = await window.uploadPostImage(file);
          if (result.success) {
            uploadedImages.push({
              url: result.url,
              filename: result.filename
            });
          }
        }
      }
      
      // Create post with images
      await createPost(currentUser.uid, text, title, uploadedImages);
      postForm.reset();
      
      // Clear images
      if (hasImages) {
        window.selectedPostImages.forEach(file => {
          window.revokeImagePreview(window.getImagePreviewUrl(file));
        });
        window.selectedPostImages = [];
        const uploadArea = document.getElementById('post-image-upload');
        if (uploadArea) uploadArea.style.display = 'none';
        const preview = document.getElementById('post-image-preview');
        if (preview) preview.innerHTML = '';
      }
      
      await window.renderPosts();
    } catch (err) {
      alert('Post error: ' + err.message);
    }
  };
}

// Show user profile by author ID
async function showUserProfile(authorId) {
  try {
    const { getFirestore, doc, getDoc, collection, getDocs, query, where } = await import('https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js');
    const { app } = await import('./firebase.js');
    const { getAuth } = await import('https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js');
    
    const db = getFirestore(app);
    const auth = getAuth(app);
    const currentUser = auth.currentUser;
    
    // Check if viewing own profile
    const isSelf = currentUser && currentUser.uid === authorId;
    
    // Get user data
    const userDoc = await getDoc(doc(db, 'users', authorId));
    if (!userDoc.exists()) {
      alert('User not found.');
      return;
    }
    
    const userData = userDoc.data();
    const username = userData.username || 'User';
    const email = userData.email || '';
    const userId = userData.userId || authorId;
    const badges = userData.badges || [];
    
    // Get user's posts
    const postsSnap = await getDocs(query(collection(db, 'posts'), where('authorId', '==', authorId)));
    const posts = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Call the profile view function from main.html
    if (window.showProfileView) {
      await window.showProfileView(authorId, username, email, userId, badges, posts, isSelf);
    }
  } catch (error) {
    console.error('Error showing user profile:', error);
    alert('Could not load user profile.');
  }
}

// Voting, reactions, and comments functions
async function votePost(postId, voteType) {
  if (!currentUser) {
    alert('Please log in to vote.');
    return;
  }
  
  try {
    const { getFirestore, doc, updateDoc, getDoc, increment, decrement } = await import('https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js');
    const { app } = await import('./firebase.js');
    const db = getFirestore(app);
    
    const postRef = doc(db, 'posts', postId);
    
    // Get current post data to check user's previous vote
    const postDoc = await getDoc(postRef);
    if (!postDoc.exists()) return;
    
    const postData = postDoc.data();
    const userVotes = postData.userVotes || {};
    const currentUserVote = userVotes[currentUser.uid];
    
    let updateData = {};
    
    if (currentUserVote === voteType) {
      // User is clicking the same vote type - remove the vote
      updateData = {
        [`${voteType}votes`]: decrement(1),
        [`userVotes.${currentUser.uid}`]: null
      };
      
      // Update UI - remove vote
      const voteBtn = document.querySelector(`[data-post-id="${postId}"] .vote-btn.${voteType}vote`);
      voteBtn.classList.remove('voted');
      
      // Only show count for upvotes
      if (voteType === 'up') {
        const voteCount = voteBtn.querySelector('.vote-count');
        const currentCount = parseInt(voteCount.textContent);
        voteCount.textContent = Math.max(0, currentCount - 1);
      }
      
    } else {
      // User is voting for a different type or voting for the first time
      const upvoteField = voteType === 'up' ? 'upvotes' : 'downvotes';
      const downvoteField = voteType === 'up' ? 'downvotes' : 'upvotes';
      
      updateData = {
        [upvoteField]: increment(1),
        [`userVotes.${currentUser.uid}`]: voteType
      };
      
      // If user had a previous vote, remove it
      if (currentUserVote) {
        updateData[downvoteField] = decrement(1);
      }
      
      // Update UI - add vote
      const voteBtn = document.querySelector(`[data-post-id="${postId}"] .vote-btn.${voteType}vote`);
      voteBtn.classList.add('voted');
      
      // Only show count for upvotes
      if (voteType === 'up') {
        const voteCount = voteBtn.querySelector('.vote-count');
        const currentCount = parseInt(voteCount.textContent);
        voteCount.textContent = currentCount + 1;
      }
      
      // Remove vote from other button if it was voted
      if (currentUserVote) {
        const otherBtn = document.querySelector(`[data-post-id="${postId}"] .vote-btn.${currentUserVote}vote`);
        otherBtn.classList.remove('voted');
        
        // Only update count for upvotes
        if (currentUserVote === 'up') {
          const otherCount = otherBtn.querySelector('.vote-count');
          const otherCurrentCount = parseInt(otherCount.textContent);
          otherCount.textContent = Math.max(0, otherCurrentCount - 1);
        }
      }
    }
    
    await updateDoc(postRef, updateData);
    
  } catch (error) {
    console.error('Vote error:', error);
    alert('Failed to vote. Please try again.');
  }
}

async function addReaction(postId, reaction) {
  if (!currentUser) {
    alert('Please log in to react.');
    return;
  }
  
  try {
    const { getFirestore, doc, updateDoc, getDoc, arrayUnion, arrayRemove } = await import('https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js');
    const { app } = await import('./firebase.js');
    const db = getFirestore(app);
    
    const postRef = doc(db, 'posts', postId);
    
    // Get current post data to check user's previous reaction
    const postDoc = await getDoc(postRef);
    if (!postDoc.exists()) return;
    
    const postData = postDoc.data();
    const reactions = postData.reactions || [];
    
    // Find user's existing reaction
    const existingReactionIndex = reactions.findIndex(r => r.userId === currentUser.uid);
    const existingReaction = existingReactionIndex >= 0 ? reactions[existingReactionIndex] : null;
    
    let newReactions = [...reactions];
    
    if (existingReaction) {
      if (existingReaction.reaction === reaction) {
        // User is clicking the same reaction - remove it
        newReactions.splice(existingReactionIndex, 1);
        
        // Update UI - remove reaction
        const reactionBtn = document.querySelector(`[data-post-id="${postId}"] .reaction-btn[onclick*="${reaction}"]`);
        reactionBtn.classList.remove('reacted');
        
        // Update reaction count
        const reactionCount = reactionBtn.querySelector('.reaction-count');
        const currentCount = parseInt(reactionCount.textContent);
        reactionCount.textContent = Math.max(0, currentCount - 1);
        
      } else {
        // User is switching to a different reaction
        newReactions[existingReactionIndex] = {
          userId: currentUser.uid,
          reaction: reaction,
          timestamp: new Date()
        };
        
        // Update UI - switch reaction
        const oldReactionBtn = document.querySelector(`[data-post-id="${postId}"] .reaction-btn[onclick*="${existingReaction.reaction}"]`);
        const newReactionBtn = document.querySelector(`[data-post-id="${postId}"] .reaction-btn[onclick*="${reaction}"]`);
        
        oldReactionBtn.classList.remove('reacted');
        newReactionBtn.classList.add('reacted');
        
        // Update reaction counts
        const oldReactionCount = oldReactionBtn.querySelector('.reaction-count');
        const newReactionCount = newReactionBtn.querySelector('.reaction-count');
        
        const oldCount = parseInt(oldReactionCount.textContent);
        const newCount = parseInt(newReactionCount.textContent);
        
        oldReactionCount.textContent = Math.max(0, oldCount - 1);
        newReactionCount.textContent = newCount + 1;
      }
    } else {
      // User is adding a new reaction
      newReactions.push({
        userId: currentUser.uid,
        reaction: reaction,
        timestamp: new Date()
      });
      
      // Update UI - add reaction
      const reactionBtn = document.querySelector(`[data-post-id="${postId}"] .reaction-btn[onclick*="${reaction}"]`);
      reactionBtn.classList.add('reacted');
      
      // Update reaction count
      const reactionCount = reactionBtn.querySelector('.reaction-count');
      const currentCount = parseInt(reactionCount.textContent);
      reactionCount.textContent = currentCount + 1;
    }
    
    // Update database
    await updateDoc(postRef, {
      reactions: newReactions
    });
    
  } catch (error) {
    console.error('Reaction error:', error);
    alert('Failed to add reaction. Please try again.');
  }
}

function toggleComments(postId) {
  const commentsSection = document.getElementById(`comments-${postId}`);
  const isVisible = commentsSection.style.display !== 'none';
  
  if (isVisible) {
    commentsSection.style.display = 'none';
  } else {
    commentsSection.style.display = 'block';
    loadComments(postId);
  }
}

async function loadComments(postId) {
  try {
    const { getFirestore, collection, query, where, orderBy, getDocs } = await import('https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js');
    const { app } = await import('./firebase.js');
    const db = getFirestore(app);
    
    const commentsSnap = await getDocs(query(
      collection(db, 'comments'),
      where('postId', '==', postId),
      orderBy('timestamp', 'asc')
    ));
    
    const comments = commentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const commentsList = document.getElementById(`comments-list-${postId}`);
    
    if (comments.length === 0) {
      commentsList.innerHTML = '<div style="text-align: center; color: var(--secondary); font-style: italic; padding: 1rem;">No comments yet. Be the first to comment!</div>';
    } else {
      commentsList.innerHTML = comments.map(comment => `
        <div class="comment-item">
          <div class="comment-header">
            <span class="comment-author">${comment.username || 'User'}</span>
            <span class="comment-timestamp">${comment.timestamp?.toDate ? comment.timestamp.toDate().toLocaleString() : ''}</span>
          </div>
          <div class="comment-text">${comment.text}</div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Load comments error:', error);
  }
}

async function submitComment(postId) {
  if (!currentUser) {
    alert('Please log in to comment.');
    return;
  }
  
  const commentInput = document.querySelector(`[data-post-id="${postId}"] .comment-input`);
  const commentText = commentInput.value.trim();
  
  if (!commentText) {
    alert('Please enter a comment.');
    return;
  }
  
  try {
    const { getFirestore, collection, doc, addDoc, updateDoc, increment } = await import('https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js');
    const { app } = await import('./firebase.js');
    const db = getFirestore(app);
    
    // Add comment
    await addDoc(collection(db, 'comments'), {
      postId: postId,
      authorId: currentUser.uid,
      username: currentUser.displayName || 'User',
      text: commentText,
      timestamp: new Date()
    });
    
    // Update post comment count
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      commentCount: increment(1)
    });
    
    // Clear input and reload comments
    commentInput.value = '';
    loadComments(postId);
    
    // Update comment count in UI
    const commentCount = document.querySelector(`[data-post-id="${postId}"] .comment-count`);
    const currentCount = parseInt(commentCount.textContent);
    commentCount.textContent = currentCount + 1;
    
  } catch (error) {
    console.error('Comment error:', error);
    alert('Failed to post comment. Please try again.');
  }
}

// Expose to window for dynamic re-init
window.renderPosts = renderPosts;
window.setupPostForm = setupPostForm;
window.showUserProfile = showUserProfile;
window.votePost = votePost;
window.addReaction = addReaction;
window.toggleComments = toggleComments;
window.submitComment = submitComment;

// Post card styles (inject if not present)
if (!document.getElementById('post-card-styles')) {
  const style = document.createElement('style');
  style.id = 'post-card-styles';
  style.textContent = `
    .post-card {
      background: #fff;
      margin-bottom: 1.2rem;
      padding: 1.1rem 1.2rem 0.7rem 1.2rem;
      border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.07);
      max-width: 700px;
      margin-left: auto;
      margin-right: auto;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .post-header {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      margin-bottom: 0.2rem;
    }
    .post-avatar {
      background: linear-gradient(135deg, var(--primary), var(--accent));
      color: #fff;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.13rem;
      font-weight: 700;
      flex-shrink: 0;
    }
    .post-username {
      font-weight: 600;
      color: var(--primary);
      font-size: 1.08rem;
    }
    .post-timestamp {
      font-size: 0.98rem;
      color: var(--secondary);
      margin-left: auto;
      font-weight: 400;
    }
    .post-title-view {
      font-size: 1.18rem;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 0.18rem;
      word-break: break-word;
    }
    .post-body {
      font-size: 1.13rem;
      white-space: pre-line;
      word-break: break-word;
      margin-bottom: 0.5rem;
      color: var(--text-light);
    }
    .post-assets {
      min-height: 24px;
      margin-top: 0.2rem;
      /* Placeholder for future images/videos */
    }
    .post-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-top: 0.8rem;
      padding-top: 0.8rem;
      border-top: 1px solid #e0e6f7;
    }
    .post-votes {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .vote-btn {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      background: none;
      border: none;
      padding: 0.4rem 0.6rem;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.18s;
      font-size: 0.9rem;
    }
    .vote-btn:hover {
      background: rgba(0,156,252,0.1);
    }
    .vote-btn.voted {
      background: rgba(0,156,252,0.2);
      color: var(--primary);
    }
    .vote-icon {
      font-size: 1rem;
    }
    .vote-count {
      font-weight: 600;
    }
    body[data-theme="dark"] .vote-count {
      color: #f7f8fa;
    }
    .post-reactions {
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }
    .reaction-btn {
      background: none;
      border: none;
      padding: 0.4rem 0.6rem;
      border-radius: 20px;
      cursor: pointer;
      transition: transform 0.18s;
      font-size: 1.1rem;
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }
    .reaction-btn:hover {
      transform: scale(1.1);
      background: rgba(201,127,253,0.1);
    }
    .reaction-btn.reacted {
      transform: scale(1.05);
      background: rgba(201,127,253,0.2);
    }
    .reaction-icon {
      font-size: 1.1rem;
      display: inline-block;
    }
    .reaction-count {
      font-size: 0.8rem;
      color: var(--text-light);
      font-weight: 500;
      min-width: 1rem;
      text-align: center;
    }
    body[data-theme="dark"] .reaction-count {
      color: #f7f8fa;
    }
    .reaction-btn.reacted .reaction-count {
      color: var(--primary);
      font-weight: 600;
    }
    .reaction-btn.reacted .reaction-icon {
      color: var(--primary);
    }
    .post-comments {
      margin-left: auto;
    }
    .comment-btn {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      background: none;
      border: none;
      padding: 0.4rem 0.6rem;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.18s;
      font-size: 0.9rem;
    }
    .comment-btn:hover {
      background: rgba(160,170,255,0.1);
    }
    .comment-count {
      font-weight: 600;
    }
    .comments-section {
      margin-top: 0.8rem;
      padding-top: 0.8rem;
      border-top: 1px solid #e0e6f7;
    }
    .comments-list {
      margin-bottom: 1rem;
    }
    .comment-item {
      padding: 0.8rem;
      background: var(--background-light);
      border-radius: 8px;
      margin-bottom: 0.5rem;
    }
    .comment-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.3rem;
    }
    .comment-author {
      font-weight: 600;
      color: var(--primary);
      font-size: 0.9rem;
    }
    .comment-timestamp {
      font-size: 0.8rem;
      color: var(--secondary);
    }
    .comment-text {
      font-size: 0.95rem;
      color: var(--text-light);
      line-height: 1.4;
    }
    .comment-form {
      display: flex;
      gap: 0.5rem;
      align-items: flex-end;
    }
    .comment-input {
      flex: 1;
      padding: 0.6rem;
      border: 1px solid var(--secondary);
      border-radius: 8px;
      font-size: 0.9rem;
      resize: vertical;
      min-height: 36px;
      max-height: 120px;
    }
    .comment-input:focus {
      border-color: var(--primary);
      outline: none;
    }
    .comment-submit {
      background: var(--primary);
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 0.6rem 1rem;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.18s;
    }
    .comment-submit:hover {
      background: var(--accent);
    }
    body[data-theme="dark"] .post-actions {
      border-top: 1px solid #2c3550;
    }
    body[data-theme="dark"] .vote-btn:hover {
      background: rgba(201,127,253,0.1);
    }
    body[data-theme="dark"] .reaction-btn:hover {
      background: rgba(201,127,253,0.1);
    }
    body[data-theme="dark"] .comment-btn:hover {
      background: rgba(201,127,253,0.1);
    }
    body[data-theme="dark"] .comments-section {
      border-top: 1px solid #2c3550;
    }
    body[data-theme="dark"] .comment-item {
      background: #232a3a;
    }
    body[data-theme="dark"] .comment-text {
      color: #f7f8fa;
    }
    body[data-theme="dark"] .comment-input {
      background: #232a3a;
      color: #f7f8fa;
      border-color: #2c3550;
    }
    body[data-theme="dark"] .post-card {
      background: #232a3a;
      box-shadow: 0 2px 16px rgba(0,0,0,0.18);
    }
    body[data-theme="dark"] .post-body {
      color: #f7f8fa;
    }
    .post-animate {
      opacity: 0;
      transform: translateY(24px) scale(0.98);
      will-change: opacity, transform;
    }
    .post-animate-in {
      animation: postFadeIn 0.55s cubic-bezier(.23,1.12,.32,1) forwards;
    }
    @keyframes postFadeIn {
      0% {
        opacity: 0;
        transform: translateY(24px) scale(0.98);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    .vote-icon {
      font-size: 1rem;
      font-weight: bold;
    }
  `;
  document.head.appendChild(style);
}
