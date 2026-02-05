/**
 * MovieFlix - Netflix-Style Movie Recommender
 * 
 * Features:
 * - Debounced autocomplete search
 * - Movie selection and recommendation display
 * - Horizontal carousel with navigation
 * - Smooth animations
 * - Auth, Chat, Comments, My List (New)
 */

// ============================================
// Configuration
// ============================================
const API_BASE_URL = 'http://localhost:5001/api'; // Updated base
const DEBOUNCE_DELAY = 300;
const CHAT_POLL_INTERVAL = 3000;

// ============================================
// DOM Elements
// ============================================
const elements = {
    searchInput: document.getElementById('searchInput'),
    clearBtn: document.getElementById('clearBtn'),
    autocompleteDropdown: document.getElementById('autocompleteDropdown'),
    autocompleteList: document.getElementById('autocompleteList'),

    // Sections
    selectedMovieSection: document.getElementById('selectedMovieSection'),
    recommendationsSection: document.getElementById('recommendationsSection'),
    errorSection: document.getElementById('errorSection'),
    myListSection: document.getElementById('myListSection'),

    // Dynamic Content
    selectedMovie: document.getElementById('selectedMovie'),
    recommendationsCarousel: document.getElementById('recommendationsCarousel'),
    genreCarousel: document.getElementById('genreCarousel'),
    myListContainer: document.getElementById('myListContainer'),
    movieName: document.getElementById('movieName'),
    genreName: document.getElementById('genreName'),
    errorMessage: document.getElementById('errorMessage'),
    loadingOverlay: document.getElementById('loadingOverlay'),

    // Auth
    authModal: document.getElementById('authModal'),
    authTitle: document.getElementById('authTitle'),
    usernameInput: document.getElementById('usernameInput'),
    passwordInput: document.getElementById('passwordInput'),
    loginBtn: document.getElementById('loginBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    welcomeMsg: document.getElementById('welcomeMsg'),
    userDisplay: document.getElementById('userDisplay'),
    navMyList: document.getElementById('navMyList'),

    // Chat
    chatWidget: document.getElementById('chatWidget'),
    chatBody: document.getElementById('chatBody'),
    chatInput: document.getElementById('chatInput')
};

// ============================================
// State
// ============================================
let selectedMovie = null;
let allRecommendations = [];
let selectedIndex = -1;
let currentUser = null;
let isRegisterMode = false;
let chatInterval = null;
let myListIds = new Set(); // Cache user's list IDs

// ============================================
// Utility Functions
// ============================================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getGenreEmoji(genre) {
    const emojis = {
        'Action': '🎬', 'Comedy': '😂', 'Drama': '🎭', 'Horror': '👻',
        'Sci-Fi': '🚀', 'Romance': '💕', 'Thriller': '🔪', 'Animation': '🎨'
    };
    return emojis[genre] || '🎥';
}

function setLoading(isLoading) {
    elements.loadingOverlay.hidden = !isLoading;
}

function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorSection.hidden = false;
    elements.recommendationsSection.hidden = true;
    elements.selectedMovieSection.hidden = true;
}

function hideError() {
    elements.errorSection.hidden = true;
}

// ============================================
// API Functions
// ============================================

async function searchMovies(query) {
    if (!query.trim()) return [];
    try {
        const response = await fetch(`${API_BASE_URL}/../search?name=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Search failed');
        return await response.json();
    } catch (error) {
        console.error('Search error:', error);
        return [];
    }
}

async function getRecommendations(movieId) {
    try {
        const response = await fetch(`${API_BASE_URL}/../recommend?movie_id=${movieId}`);
        if (!response.ok) throw new Error('Failed to get recommendations');
        return await response.json();
    } catch (error) {
        console.error('Recommendation error:', error);
        throw error;
    }
}

// ============================================
// Auth Logic
// ============================================

// Attach Auth Listeners
if (elements.loginBtn) elements.loginBtn.onclick = () => showAuthModal();
if (elements.logoutBtn) elements.logoutBtn.onclick = () => logout();

// Note: Modal buttons are handled via HTML onclick for stability
// Removed manual addEventListener blocks here to avoid duplicates

function showAuthModal() {
    elements.authModal.hidden = false;
    isRegisterMode = false;
    updateAuthUI();
}

function closeAuthModal() {
    elements.authModal.hidden = true;
}

function toggleAuthMode() {
    isRegisterMode = !isRegisterMode;
    console.log("Auth Mode Toggled. Register:", isRegisterMode);
    updateAuthUI();
}

function updateAuthUI() {
    elements.authTitle.textContent = isRegisterMode ? 'Sign Up' : 'Sign In';
    document.getElementById('authToggleText').textContent = isRegisterMode
        ? 'Already have an account? Sign In.'
        : 'New to MovieFlix? Sign up now.';
}

async function handleAuthSubmit() {
    console.log("Auth Submit Handler Triggered");
    const username = elements.usernameInput.value;
    const password = elements.passwordInput.value;
    const endpoint = isRegisterMode ? '/auth/register' : '/auth/login';

    console.log(`Submitting to ${endpoint} for user: ${username}`);

    try {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        console.log("Response:", data);

        if (data.success) {
            if (isRegisterMode) {
                alert('Registration successful! Please login.');
                toggleAuthMode();
            } else {
                loginSuccess(username);
                closeAuthModal();
            }
        } else {
            console.warn("Auth Failed:", data.error);
            alert(data.error || 'Authentication failed');
        }
    } catch (e) {
        console.error("Auth Error:", e);
        alert('Authentication error');
    }
}

function loginSuccess(username) {
    currentUser = username;
    elements.userDisplay.textContent = username;
    elements.welcomeMsg.hidden = false;
    elements.loginBtn.hidden = true;
    elements.logoutBtn.hidden = false;
    elements.navMyList.hidden = false;
    elements.chatWidget.hidden = false;

    // Refresh user data
    startChatPolling();
    loadMyList();
}

function logout() {
    currentUser = null;
    elements.welcomeMsg.hidden = true;
    elements.loginBtn.hidden = false;
    elements.logoutBtn.hidden = true;
    elements.navMyList.hidden = true;
    elements.chatWidget.hidden = true;
    stopChatPolling();

    // Reset Views
    elements.myListSection.hidden = true;
    myListIds.clear();
}

// ============================================
// Main UI Logic
// ============================================

function showSection(section) {
    // Basic routing
    elements.selectedMovieSection.hidden = true;
    elements.recommendationsSection.hidden = true;
    elements.myListSection.hidden = true;

    if (section === 'home') {
        window.scrollTo(0, 0);
    } else if (section === 'mylist') {
        if (!currentUser) return;
        elements.myListSection.hidden = false;
        loadMyList(); // Refresh list
    }
}

// ============================================
// Movie Selection & Details with Comments
// ============================================

async function selectMovie(movie) {
    selectedMovie = movie;
    elements.searchInput.value = movie.title;
    elements.autocompleteDropdown.hidden = true;

    setLoading(true);
    hideError();
    elements.myListSection.hidden = true; // Hide my list if showing

    try {
        const recommendations = await getRecommendations(movie.id);

        // Render Movie Details with new Buttons
        const inList = myListIds.has(movie.id);
        const listBtnText = inList ? '✔ Initialized in List' : '+ Add to My List';
        const listBtnClass = inList ? 'btn-mylist added' : 'btn-mylist';

        elements.selectedMovie.innerHTML = `
            <div class="selected-poster">${getGenreEmoji(movie.genre)}</div>
            <div class="selected-info">
                <h2 class="selected-title">${escapeHtml(movie.title)}</h2>
                <div class="selected-meta">
                    <span class="selected-genre">${escapeHtml(movie.genre)}</span>
                    <span class="selected-rating">★ ${movie.rating.toFixed(1)}</span>
                </div>
                ${currentUser ? `<button id="myListActionBtn" class="${listBtnClass}" onclick="toggleMyList(${movie.id})">${listBtnText}</button>` : ''}
                
                <div class="comments-section">
                    <h3>Comments</h3>
                    <div id="commentList" class="comment-list">Loading comments...</div>
                    ${currentUser ? `
                    <div style="display:flex; gap:10px;">
                        <input type="text" id="commentInput" class="form-input" placeholder="Add a comment...">
                        <button class="auth-btn" onclick="postComment(${movie.id})">Post</button>
                    </div>` : '<p style="font-size:12px; color:#aaa;">Login to comment</p>'}
                </div>
            </div>
        `;

        elements.selectedMovieSection.hidden = false;
        renderRecommendations(recommendations, movie);

        if (currentUser) {
            updateMyListButton(movie.id); // Ensure correct state
        }

        loadComments(movie.id);

    } catch (error) {
        showError('Failed to get recommendations.');
    } finally {
        setLoading(false);
    }
}

// ============================================
// Comments Logic
// ============================================

async function loadComments(movieId) {
    const container = document.getElementById('commentList');
    try {
        const res = await fetch(`${API_BASE_URL}/comments?movie_id=${movieId}`);
        const comments = await res.json();

        if (comments.length === 0) {
            container.innerHTML = '<p style="color:#666; font-size:13px;">No comments yet.</p>';
            return;
        }

        container.innerHTML = comments.map(c => `
            <div class="comment-item">
                <div class="comment-header">
                    <span class="comment-user">${escapeHtml(c.username)}</span>
                    <span>${c.date}</span>
                </div>
                <p class="comment-text">${escapeHtml(c.text)}</p>
            </div>
        `).join('');
    } catch (e) {
        container.innerHTML = 'Error loading comments.';
    }
}

async function postComment(movieId) {
    const input = document.getElementById('commentInput');
    const text = input.value.trim();
    if (!text) return;

    try {
        await fetch(`${API_BASE_URL}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ movie_id: movieId, username: currentUser, text })
        });
        input.value = '';
        loadComments(movieId);
    } catch (e) {
        alert('Failed to post comment');
    }
}

// ============================================
// My List Logic
// ============================================

async function loadMyList() {
    if (!currentUser) return;
    try {
        const res = await fetch(`${API_BASE_URL}/mylist?username=${currentUser}`);
        const movies = await res.json();

        myListIds = new Set(movies.map(m => m.id));

        if (movies.length === 0) {
            elements.myListContainer.innerHTML = '<p style="padding:20px; color:#666;">Your list is empty.</p>';
        } else {
            elements.myListContainer.innerHTML = movies.map(createMovieCard).join('');
        }
    } catch (e) {
        console.error('MyList error', e);
    }
}

async function toggleMyList(movieId) {
    const action = myListIds.has(movieId) ? 'remove' : 'add';

    try {
        await fetch(`${API_BASE_URL}/mylist`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, username: currentUser, movie_id: movieId })
        });

        if (action === 'add') myListIds.add(movieId);
        else myListIds.delete(movieId);

        updateMyListButton(movieId);
        loadMyList(); // Refresh list view silently
    } catch (e) {
        alert('Action failed');
    }
}

function updateMyListButton(movieId) {
    const btn = document.getElementById('myListActionBtn');
    if (!btn) return;

    const inList = myListIds.has(movieId);
    btn.textContent = inList ? '✔ Added to List' : '+ Add to My List';
    if (inList) btn.classList.add('added');
    else btn.classList.remove('added');
}


// ============================================
// Chat Logic
// ============================================

function toggleChat() {
    const body = document.getElementById('chatBody');
    const input = document.querySelector('.chat-input-area');
    const icon = document.getElementById('chatToggleIcon');

    if (body.style.display === 'none') {
        body.style.display = 'block';
        input.style.display = 'flex';
        icon.textContent = '−';
    } else {
        body.style.display = 'none';
        input.style.display = 'none';
        icon.textContent = '+';
    }
}

async function sendChatMessage() {
    const input = elements.chatInput;
    const text = input.value.trim();
    if (!text || !currentUser) return;

    try {
        await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: currentUser, text })
        });
        input.value = '';
        pollChat();
    } catch (e) { }
}

async function pollChat() {
    if (!currentUser) return;
    try {
        const res = await fetch(`${API_BASE_URL}/chat`);
        const messages = await res.json();

        elements.chatBody.innerHTML = messages.map(m => `
            <div class="chat-msg">
                <div class="chat-user">${escapeHtml(m.username)} ${m.time.split(' ')[1]}</div>
                <div class="chat-bubble">${escapeHtml(m.text)}</div>
            </div>
        `).join('');

    } catch (e) { }
}

function startChatPolling() {
    pollChat();
    chatInterval = setInterval(pollChat, CHAT_POLL_INTERVAL);
}

function stopChatPolling() {
    if (chatInterval) clearInterval(chatInterval);
}


// ============================================
// Rendering & Helpers (Existing + Updates)
// ============================================

function createMovieCard(movie) {
    return `
        <div class="movie-card" data-id="${movie.id}" onclick="handleCardClick(${movie.id})">
            <div class="card-poster">
                ${getGenreEmoji(movie.genre)}
                <span class="card-rating">${movie.rating.toFixed(1)}</span>
            </div>
            <div class="card-info">
                <h3 class="card-title">${escapeHtml(movie.title)}</h3>
                <p class="card-genre">${escapeHtml(movie.genre)}</p>
            </div>
        </div>
    `;
}

function renderRecommendations(recommendations, sourceMovie) {
    if (recommendations.length === 0) {
        showError('No recommendations found for this movie.');
        return;
    }
    hideError();
    allRecommendations = recommendations;
    elements.movieName.textContent = sourceMovie.title;
    elements.genreName.textContent = sourceMovie.genre;

    const topRated = [...recommendations].sort((a, b) => b.rating - a.rating).slice(0, 15);
    const sameGenre = recommendations.filter(m => m.genre === sourceMovie.genre).slice(0, 15);

    elements.recommendationsCarousel.innerHTML = topRated.map(createMovieCard).join('');

    if (sameGenre.length > 0) {
        elements.genreCarousel.innerHTML = sameGenre.map(createMovieCard).join('');
        document.getElementById('genreSection').hidden = false;
    } else {
        document.getElementById('genreSection').hidden = true;
    }

    elements.recommendationsSection.hidden = false;
    elements.selectedMovieSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Search Handler
const handleSearchInput = debounce(async (event) => {
    const query = event.target.value.trim();
    if (query.length < 2) {
        elements.autocompleteDropdown.hidden = true;
        return;
    }
    const movies = await searchMovies(query);
    renderAutocomplete(movies);
}, DEBOUNCE_DELAY);

function renderAutocomplete(movies) {
    if (movies.length === 0) {
        elements.autocompleteDropdown.hidden = true;
        return;
    }
    elements.autocompleteList.innerHTML = movies.map(movie => `
        <div class="autocomplete-item" onclick='selectAutocompleteMovie(${JSON.stringify(movie)})'>
            <div class="autocomplete-poster">${getGenreEmoji(movie.genre)}</div>
            <div class="autocomplete-info">
                <div class="autocomplete-title">${escapeHtml(movie.title)}</div>
                <div class="autocomplete-meta">
                    <span class="badget">${movie.genre}</span>
                </div>
            </div>
        </div>
    `).join('');
    elements.autocompleteDropdown.hidden = false;
}

// Bridging function because HTML onclick passes objects poorly sometimes
window.selectAutocompleteMovie = (movie) => {
    selectMovie(movie);
}

// Expose Auth functions for HTML onclick
window.closeAuthModal = closeAuthModal;
window.handleAuthSubmit = handleAuthSubmit;
window.toggleAuthMode = toggleAuthMode;
window.toggleChat = toggleChat;
window.sendChatMessage = sendChatMessage;
window.handleCardClick = handleCardClick;

// Click anywhere to close search
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
        elements.autocompleteDropdown.hidden = true;
    }
});

// Add Enter key support for Auth
if (elements.usernameInput) {
    elements.usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAuthSubmit();
    });
}
if (elements.passwordInput) {
    elements.passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAuthSubmit();
    });
}

elements.searchInput.addEventListener('input', handleSearchInput);

// Handle card click
async function handleCardClick(movieId) {
    // If from recommendation or list
    if (selectedMovie && selectedMovie.id === movieId) return; // Already selected

    // Fetch full movie details if needed (we have limited info in cards)
    try {
        const res = await fetch(`${API_BASE_URL}/../movie/${movieId}`);
        const movie = await res.json();
        selectMovie(movie);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) { }
}

