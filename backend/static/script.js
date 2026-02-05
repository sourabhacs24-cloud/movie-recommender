/**
 * MovieFlix - Netflix-Style Movie Recommender
 * Full Feature Edition with Auth, Chat, Comments, My List, Browse
 */

// ============================================
// Configuration
// ============================================
const API_BASE_URL = 'https://movie-recom-ekts.onrender.com';
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
    heroSection: document.getElementById('heroSection'),
    browseSection: document.getElementById('browseSection'),
    selectedMovieSection: document.getElementById('selectedMovieSection'),
    recommendationsSection: document.getElementById('recommendationsSection'),
    errorSection: document.getElementById('errorSection'),
    myListSection: document.getElementById('myListSection'),

    // Dynamic Content
    browseGrid: document.getElementById('browseGrid'),
    selectedMovie: document.getElementById('selectedMovie'),
    recommendationsGrid: document.getElementById('recommendationsGrid'),
    myListContainer: document.getElementById('myListContainer'),
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
    chatInput: document.getElementById('chatInput'),

    // Preferences
    preferencesSection: document.getElementById('preferencesSection'),
    genreWeight: document.getElementById('genreWeight'),
    ratingWeight: document.getElementById('ratingWeight'),
    directorWeight: document.getElementById('directorWeight'),
    genreValue: document.getElementById('genreValue'),
    ratingValue: document.getElementById('ratingValue'),
    directorValue: document.getElementById('directorValue')
};

// ============================================
// State
// ============================================
let selectedMovie = null;
let allMovies = [];
let allRecommendations = [];
let selectedIndex = -1;
let currentUser = null;
let isRegisterMode = false;
let chatInterval = null;
let myListIds = new Set();
let currentGenreFilter = 'all';
let preferences = { genre: 10, rating: 9, director: 7 };

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

function updateClearButton() {
    elements.clearBtn.hidden = !elements.searchInput.value;
}

// ============================================
// API Functions
// ============================================

async function searchMovies(query) {
    if (!query.trim()) return [];
    try {
        const response = await fetch(`${API_BASE_URL}/search?name=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Search failed');
        return await response.json();
    } catch (error) {
        console.error('Search error:', error);
        return [];
    }
}

async function getRecommendations(movieId) {
    try {
        const response = await fetch(`${API_BASE_URL}/recommend?movie_id=${movieId}`);
        if (!response.ok) throw new Error('Failed to get recommendations');
        return await response.json();
    } catch (error) {
        console.error('Recommendation error:', error);
        throw error;
    }
}

async function getAllMovies() {
    try {
        const response = await fetch(`${API_BASE_URL}/movies`);
        if (!response.ok) throw new Error('Failed to get movies');
        return await response.json();
    } catch (error) {
        console.error('Movies error:', error);
        return [];
    }
}

// ============================================
// Navigation Logic
// ============================================

function showSection(section) {
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));

    // Hide all content sections
    elements.heroSection.hidden = true;
    elements.browseSection.hidden = true;
    elements.selectedMovieSection.hidden = true;
    elements.recommendationsSection.hidden = true;
    elements.myListSection.hidden = true;
    hideError();

    if (section === 'home') {
        elements.heroSection.hidden = false;
        document.getElementById('navHome').classList.add('active');
        window.scrollTo(0, 0);
    } else if (section === 'browse') {
        elements.browseSection.hidden = false;
        document.getElementById('navBrowse').classList.add('active');
        loadBrowseSection();
    } else if (section === 'mylist') {
        if (!currentUser) {
            showAuthModal();
            return;
        }
        elements.myListSection.hidden = false;
        document.getElementById('navMyList').classList.add('active');
        loadMyList();
    }
}

// ============================================
// Browse Section
// ============================================

async function loadBrowseSection() {
    if (allMovies.length === 0) {
        allMovies = await getAllMovies();
    }
    renderBrowseGrid(allMovies);
}

function filterByGenre(genre) {
    currentGenreFilter = genre;

    // Update button states
    document.querySelectorAll('.genre-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    if (genre === 'all') {
        renderBrowseGrid(allMovies);
    } else {
        const filtered = allMovies.filter(m => m.genre === genre);
        renderBrowseGrid(filtered);
    }
}

function renderBrowseGrid(movies) {
    if (movies.length === 0) {
        elements.browseGrid.innerHTML = '<p style="color:#666; padding:20px;">No movies found.</p>';
        return;
    }
    elements.browseGrid.innerHTML = movies.map(createMovieCard).join('');
}

// ============================================
// Auth Logic
// ============================================

if (elements.loginBtn) elements.loginBtn.onclick = () => showAuthModal();
if (elements.logoutBtn) elements.logoutBtn.onclick = () => logout();

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
    updateAuthUI();
}

function updateAuthUI() {
    elements.authTitle.textContent = isRegisterMode ? 'Sign Up' : 'Sign In';
    document.getElementById('authToggleText').textContent = isRegisterMode
        ? 'Already have an account? Sign In.'
        : 'New to MovieFlix? Sign up now.';
}

async function handleAuthSubmit() {
    const username = elements.usernameInput.value.trim();
    const password = elements.passwordInput.value.trim();

    if (!username || !password) {
        alert('Please enter username and password');
        return;
    }

    const endpoint = isRegisterMode ? '/api/auth/register' : '/api/auth/login';

    try {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (data.success) {
            if (isRegisterMode) {
                alert('Registration successful! Please login.');
                toggleAuthMode();
            } else {
                loginSuccess(username);
                closeAuthModal();
            }
        } else {
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
    elements.myListSection.hidden = true;
    myListIds.clear();
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
    elements.myListSection.hidden = true;
    elements.browseSection.hidden = true;
    elements.heroSection.hidden = true;

    try {
        const recommendations = await getRecommendations(movie.id);

        const inList = myListIds.has(movie.id);
        const listBtnText = inList ? '✔ In My List' : '+ Add to My List';
        const listBtnClass = inList ? 'btn-mylist added' : 'btn-mylist';

        elements.selectedMovie.innerHTML = `
            <div class="selected-poster">${getGenreEmoji(movie.genre)}</div>
            <div class="selected-info">
                <h2 class="selected-title">${escapeHtml(movie.title)}</h2>
                <div class="selected-meta">
                    <span class="selected-genre">${escapeHtml(movie.genre)}</span>
                    <span class="selected-rating">★ ${movie.rating.toFixed(1)}</span>
                </div>
                <p class="selected-director">🎬 Directed by <strong>${escapeHtml(movie.director || 'Unknown')}</strong></p>
                ${currentUser ? `<button id="myListActionBtn" class="${listBtnClass}" onclick="toggleMyList(${movie.id})">${listBtnText}</button>` : ''}
                
                <div class="comments-section">
                    <h3>💬 Comments</h3>
                    <div id="commentList" class="comment-list">Loading comments...</div>
                    ${currentUser ? `
                    <div style="display:flex; gap:10px; margin-top:10px;">
                        <input type="text" id="commentInput" class="form-input" placeholder="Add a comment..." style="flex:1;">
                        <button class="auth-btn" onclick="postComment(${movie.id})">Post</button>
                    </div>` : '<p style="font-size:12px; color:#666; margin-top:10px;">Login to comment</p>'}
                </div>
            </div>
        `;

        elements.selectedMovieSection.hidden = false;
        elements.preferencesSection.hidden = false;
        renderRecommendations(recommendations, movie);

        if (currentUser) {
            updateMyListButton(movie.id);
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
        const res = await fetch(`${API_BASE_URL}/api/comments?movie_id=${movieId}`);
        const comments = await res.json();

        if (comments.length === 0) {
            container.innerHTML = '<p style="color:#666; font-size:13px;">No comments yet. Be the first!</p>';
            return;
        }

        container.innerHTML = comments.map(c => `
            <div class="comment-item">
                <div class="comment-header">
                    <span class="comment-user">${escapeHtml(c.username)}</span>
                    <span>${c.date || ''}</span>
                </div>
                <p class="comment-text">${escapeHtml(c.text)}</p>
            </div>
        `).join('');
    } catch (e) {
        container.innerHTML = '<p style="color:#666;">Error loading comments.</p>';
    }
}

async function postComment(movieId) {
    const input = document.getElementById('commentInput');
    const text = input.value.trim();
    if (!text) return;

    try {
        await fetch(`${API_BASE_URL}/api/comments`, {
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
        const res = await fetch(`${API_BASE_URL}/api/mylist?username=${currentUser}`);
        const movies = await res.json();

        myListIds = new Set(movies.map(m => m.id));

        if (movies.length === 0) {
            elements.myListContainer.innerHTML = '<p style="padding:20px; color:#666;">Your list is empty. Browse movies and add some!</p>';
        } else {
            elements.myListContainer.innerHTML = movies.map(createMovieCard).join('');
        }
    } catch (e) {
        console.error('MyList error', e);
    }
}

async function toggleMyList(movieId) {
    if (!currentUser) {
        showAuthModal();
        return;
    }

    const action = myListIds.has(movieId) ? 'remove' : 'add';

    try {
        await fetch(`${API_BASE_URL}/api/mylist`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, username: currentUser, movie_id: movieId })
        });

        if (action === 'add') myListIds.add(movieId);
        else myListIds.delete(movieId);

        updateMyListButton(movieId);
        loadMyList();
    } catch (e) {
        alert('Action failed');
    }
}

function updateMyListButton(movieId) {
    const btn = document.getElementById('myListActionBtn');
    if (!btn) return;

    const inList = myListIds.has(movieId);
    btn.textContent = inList ? '✔ In My List' : '+ Add to My List';
    if (inList) btn.classList.add('added');
    else btn.classList.remove('added');
}

// ============================================
// Chat Logic
// ============================================

function toggleChat() {
    const body = document.getElementById('chatBody');
    const inputArea = document.querySelector('.chat-input-area');
    const icon = document.getElementById('chatToggleIcon');

    if (body.style.display === 'none') {
        body.style.display = 'block';
        inputArea.style.display = 'flex';
        icon.textContent = '−';
    } else {
        body.style.display = 'none';
        inputArea.style.display = 'none';
        icon.textContent = '+';
    }
}

async function sendChatMessage() {
    const input = elements.chatInput;
    const text = input.value.trim();
    if (!text || !currentUser) return;

    try {
        await fetch(`${API_BASE_URL}/api/chat`, {
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
        const res = await fetch(`${API_BASE_URL}/api/chat`);
        const messages = await res.json();

        elements.chatBody.innerHTML = messages.length === 0
            ? '<p style="color:#666; padding:10px; font-size:12px;">No messages yet. Start the conversation!</p>'
            : messages.map(m => `
                <div class="chat-msg">
                    <div class="chat-user">${escapeHtml(m.username)} <span style="color:#666;">${(m.time || '').split(' ')[1] || ''}</span></div>
                    <div class="chat-bubble">${escapeHtml(m.text)}</div>
                </div>
            `).join('');

        elements.chatBody.scrollTop = elements.chatBody.scrollHeight;
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
// Rendering & Helpers
// ============================================

function createMovieCard(movie) {
    const director = movie.director || 'Unknown';
    return `
        <div class="movie-card" data-id="${movie.id}" onclick="handleCardClick(${movie.id})">
            <div class="card-poster">
                ${getGenreEmoji(movie.genre)}
                <span class="card-rating">${movie.rating.toFixed(1)}</span>
            </div>
            <div class="card-info">
                <h3 class="card-title">${escapeHtml(movie.title)}</h3>
                <p class="card-genre">${escapeHtml(movie.genre)}</p>
                <p class="card-director">Directed by ${escapeHtml(director)}</p>
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

    // Display top 15 recommendations in a grid
    const topMovies = recommendations.slice(0, 15);
    elements.recommendationsGrid.innerHTML = topMovies.map(createMovieCard).join('');

    elements.recommendationsSection.hidden = false;
    elements.recommendationsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderAutocomplete(movies) {
    if (movies.length === 0) {
        elements.autocompleteDropdown.hidden = true;
        return;
    }

    elements.autocompleteList.innerHTML = movies.map((movie, index) => `
        <div class="autocomplete-item ${index === selectedIndex ? 'selected' : ''}" 
             data-id="${movie.id}" 
             data-index="${index}">
            <div class="autocomplete-poster">${getGenreEmoji(movie.genre)}</div>
            <div class="autocomplete-info">
                <div class="autocomplete-title">${escapeHtml(movie.title)}</div>
                <div class="autocomplete-meta">
                    <span class="genre-badge">${escapeHtml(movie.genre)}</span>
                    <span class="rating-badge">${movie.rating.toFixed(1)}</span>
                </div>
            </div>
        </div>
    `).join('');

    elements.autocompleteDropdown.hidden = false;

    // Add click handlers
    document.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('click', async () => {
            const movieId = parseInt(item.dataset.id);
            try {
                const res = await fetch(`${API_BASE_URL}/movie/${movieId}`);
                const movie = await res.json();
                selectMovie(movie);
            } catch (e) { }
        });
    });
}

// Search Handler
const handleSearchInput = debounce(async (event) => {
    const query = event.target.value.trim();
    updateClearButton();

    if (query.length < 2) {
        elements.autocompleteDropdown.hidden = true;
        return;
    }
    const movies = await searchMovies(query);
    renderAutocomplete(movies);
}, DEBOUNCE_DELAY);

// Handle card click
async function handleCardClick(movieId) {
    try {
        const res = await fetch(`${API_BASE_URL}/movie/${movieId}`);
        const movie = await res.json();
        selectMovie(movie);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) { }
}

// Carousel scroll
function handleCarouselScroll(event) {
    const btn = event.target.closest('.carousel-btn');
    if (!btn) return;

    const carousel = btn.parentElement.querySelector('.carousel');
    const scrollAmount = carousel.clientWidth * 0.8;
    const direction = btn.dataset.direction === 'left' ? -1 : 1;

    carousel.scrollBy({
        left: scrollAmount * direction,
        behavior: 'smooth'
    });
}

// Clear handler
function handleClear() {
    elements.searchInput.value = '';
    updateClearButton();
    elements.autocompleteDropdown.hidden = true;
    elements.selectedMovieSection.hidden = true;
    elements.recommendationsSection.hidden = true;
    hideError();
    elements.searchInput.focus();
}

// Navbar scroll effect
function handleScroll() {
    const navbar = document.querySelector('.navbar');
    navbar.classList.toggle('scrolled', window.scrollY > 50);
}

// ============================================
// Preference-Based Recommendations
// ============================================

async function generateRecommendations() {
    if (!selectedMovie) {
        alert('Please select a movie first by searching and clicking on one.');
        return;
    }

    setLoading(true);

    try {
        const recommendations = await getRecommendations(selectedMovie.id);

        // Apply weighted scoring based on preferences
        const scored = recommendations.map(movie => {
            let score = 0;

            // Genre similarity (weight * 10 if same genre)
            if (movie.genre === selectedMovie.genre) {
                score += preferences.genre * 10;
            }

            // Rating similarity (weight * inverse of rating difference)
            const ratingDiff = Math.abs(movie.rating - selectedMovie.rating);
            score += preferences.rating * (10 - ratingDiff);

            // Director similarity (weight * 10 if same director)
            if (movie.director && selectedMovie.director &&
                movie.director.toLowerCase() === selectedMovie.director.toLowerCase()) {
                score += preferences.director * 10;
            }

            return { ...movie, score };
        });

        // Sort by score descending
        scored.sort((a, b) => b.score - a.score);

        renderRecommendations(scored, selectedMovie);

    } catch (error) {
        showError('Failed to generate recommendations.');
    } finally {
        setLoading(false);
    }
}

// ============================================
// Global Expose for HTML onclick
// ============================================
window.showSection = showSection;
window.filterByGenre = filterByGenre;
window.closeAuthModal = closeAuthModal;
window.handleAuthSubmit = handleAuthSubmit;
window.toggleAuthMode = toggleAuthMode;
window.toggleChat = toggleChat;
window.sendChatMessage = sendChatMessage;
window.generateRecommendations = generateRecommendations;
window.handleCardClick = handleCardClick;
window.postComment = postComment;
window.toggleMyList = toggleMyList;

// ============================================
// Event Listeners
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Search input
    elements.searchInput.addEventListener('input', handleSearchInput);
    elements.searchInput.addEventListener('focus', () => {
        if (elements.searchInput.value.length >= 2) {
            handleSearchInput({ target: elements.searchInput });
        }
    });

    // Clear button
    elements.clearBtn.addEventListener('click', handleClear);

    // Click outside to close dropdown
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.search-container')) {
            elements.autocompleteDropdown.hidden = true;
        }
    });

    // Carousel buttons
    document.querySelectorAll('.carousel-container').forEach(container => {
        container.addEventListener('click', handleCarouselScroll);
    });

    // Navbar scroll effect
    window.addEventListener('scroll', handleScroll);

    // Auth input enter key
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

    // Focus search on load
    elements.searchInput.focus();

    // Preference slider event handlers
    if (elements.genreWeight) {
        elements.genreWeight.addEventListener('input', (e) => {
            preferences.genre = parseInt(e.target.value);
            elements.genreValue.textContent = e.target.value;
        });
    }
    if (elements.ratingWeight) {
        elements.ratingWeight.addEventListener('input', (e) => {
            preferences.rating = parseInt(e.target.value);
            elements.ratingValue.textContent = e.target.value;
        });
    }
    if (elements.directorWeight) {
        elements.directorWeight.addEventListener('input', (e) => {
            preferences.director = parseInt(e.target.value);
            elements.directorValue.textContent = e.target.value;
        });
    }
});
