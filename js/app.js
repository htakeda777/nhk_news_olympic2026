// API Configuration
const API_URL = 'https://to232fd3h5.execute-api.ap-northeast-1.amazonaws.com/prd/newslist';
const API_KEY = 'E58jesAEI22lCer7orcqw0h6FkMQFCw2fGr1oywa';

// State
let allNews = [];
let filteredNews = [];
let currentPage = 1;
let hasNext = true;
let selectedDate = null;
let isLoading = false;
const perPage = 20;
let displayCount = 0;

// DOM Elements
const newsGrid = document.getElementById('newsGrid');
const loadingState = document.getElementById('loadingState');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const loadMoreContainer = document.getElementById('loadMoreContainer');
const dateNavContainer = document.getElementById('dateNavContainer');
const dateNavScroll = document.getElementById('dateNavScroll');
const dateNavLeft = document.getElementById('dateNavLeft');
const dateNavRight = document.getElementById('dateNavRight');
const videoModal = document.getElementById('videoModal');
const modalVideo = document.getElementById('modalVideo');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const closeModal = document.getElementById('closeModal');

// デフォルト検索キーワード（OR検索: スペース区切り）
const DEFAULT_SEARCH_TEXT = 'ミラノ・コルティナ五輪 冬季五輪';

// Fetch news from API
async function fetchNews(page = 1, itemsPerPage = perPage, searchText = DEFAULT_SEARCH_TEXT) {
    try {
        const params = new URLSearchParams({
            page: page,
            per_page: itemsPerPage,
            sort: 'published_at',
            order: 'desc',
            search_text: searchText
        });

        const response = await fetch(`${API_URL}?${params}`, {
            headers: {
                'x-api-key': API_KEY
            }
        });

        if (!response.ok) throw new Error('API request failed');
        return await response.json();
    } catch (error) {
        console.error('Error fetching news:', error);
        return null;
    }
}

// Format date and time (M/D HH:MM)
function formatDateTime(dateString) {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
}

// Format date for display
function formatDateLabel(dateString) {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[date.getDay()];
    return {
        full: `${month}月${day}日(${weekday})`,
        day: String(day).padStart(2, '0')
    };
}

// Create news card HTML
function createNewsCard(item) {
    const timeStr = formatDateTime(item.published_at);

    const card = document.createElement('div');
    card.className = 'group cursor-pointer';
    card.innerHTML = `
        <div class="relative aspect-[16/9] rounded-2xl overflow-hidden mb-3 bg-slate-100 border border-slate-200 shadow-sm transition-shadow hover:shadow-md">
            <video
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                preload="metadata"
                muted
                playsinline
            >
                <source src="${item.mp4_url}" type="video/mp4">
            </video>
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <div class="absolute bottom-3 left-3 right-12 z-10">
                <h4 class="font-bold text-sm leading-snug text-white drop-shadow-md line-clamp-2">${item.text}</h4>
                <div class="flex items-center mt-1 text-white/70 text-[10px] font-bold">
                    <span class="flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">schedule</span>
                        ${timeStr}
                    </span>
                </div>
            </div>
            <div class="absolute bottom-3 right-3 bg-navy/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-white video-duration z-10">--:--</div>
            <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-navy/10">
                <div class="size-14 rounded-full bg-primary text-white shadow-xl flex items-center justify-center">
                    <span class="material-symbols-outlined fill-1 text-2xl">play_arrow</span>
                </div>
            </div>
        </div>
    `;

    // Load video metadata to get duration
    const video = card.querySelector('video');
    const durationEl = card.querySelector('.video-duration');

    video.addEventListener('loadedmetadata', () => {
        const duration = video.duration;
        const mins = Math.floor(duration / 60);
        const secs = Math.floor(duration % 60);
        durationEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    });

    // Click to open modal
    card.addEventListener('click', () => {
        openVideoModal(item);
    });

    return card;
}

// Render news grid
function renderNews(news, append = false) {
    if (!append) {
        newsGrid.innerHTML = '';
    }

    news.forEach(item => {
        const card = createNewsCard(item);
        newsGrid.appendChild(card);
    });

    loadingState.classList.add('hidden');
    newsGrid.classList.remove('hidden');
}

// ローカル日付キーを生成（YYYY-MM-DD）
function toLocalDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// Extract unique dates from news
function extractDates(news) {
    const dateMap = new Map();

    news.forEach(item => {
        const date = new Date(item.published_at);
        const dateKey = toLocalDateKey(date);
        if (!dateMap.has(dateKey)) {
            dateMap.set(dateKey, {
                key: dateKey,
                date: date,
                ...formatDateLabel(item.published_at)
            });
        }
    });

    return Array.from(dateMap.values()).sort((a, b) => b.date - a.date);
}

// Render date navigation
function renderDateNav(dates) {
    dateNavContainer.innerHTML = '';

    // Add "All" button
    const allBtn = document.createElement('button');
    allBtn.className = `flex-shrink-0 flex flex-col items-center justify-center w-[90px] h-[56px] rounded-xl transition-all ${
        selectedDate === null
            ? 'bg-primary border border-primary shadow-lg shadow-primary/20'
            : 'bg-slate-50 border border-slate-200 hover:border-primary/40'
    }`;
    allBtn.innerHTML = `
        <span class="text-[10px] font-bold ${selectedDate === null ? 'text-white/90' : 'text-text-muted'}">すべて</span>
        <span class="text-lg font-black ${selectedDate === null ? 'text-white' : 'text-navy'}">ALL</span>
    `;
    allBtn.addEventListener('click', () => filterByDate(null));
    dateNavContainer.appendChild(allBtn);

    dates.forEach(dateInfo => {
        const btn = document.createElement('button');
        const isSelected = selectedDate === dateInfo.key;
        btn.className = `flex-shrink-0 flex flex-col items-center justify-center w-[90px] h-[56px] rounded-xl transition-all ${
            isSelected
                ? 'bg-primary border border-primary shadow-lg shadow-primary/20'
                : 'bg-slate-50 border border-slate-200 hover:border-primary/40'
        }`;
        btn.innerHTML = `
            <span class="text-[10px] font-bold ${isSelected ? 'text-white/90' : 'text-text-muted'}">${dateInfo.full}</span>
            <span class="text-lg font-black ${isSelected ? 'text-white' : 'text-navy'}">${dateInfo.day}</span>
        `;
        btn.addEventListener('click', () => filterByDate(dateInfo.key));
        dateNavContainer.appendChild(btn);
    });
}

// Filter news by date
function filterByDate(dateKey) {
    selectedDate = dateKey;
    displayCount = 0;

    if (dateKey === null) {
        filteredNews = [...allNews];
    } else {
        filteredNews = allNews.filter(item => {
            const itemDate = toLocalDateKey(new Date(item.published_at));
            return itemDate === dateKey;
        });
    }

    // Display first 20 items
    const itemsToShow = filteredNews.slice(0, perPage);
    displayCount = itemsToShow.length;
    renderNews(itemsToShow);
    renderDateNav(extractDates(allNews));

    // Update load more button visibility
    if (displayCount < filteredNews.length) {
        loadMoreContainer.classList.remove('hidden');
    } else {
        loadMoreContainer.classList.add('hidden');
    }
}

// Open video modal
function openVideoModal(item) {
    modalVideo.querySelector('source').src = item.mp4_url;
    modalVideo.load();
    modalTitle.textContent = item.text;
    modalDate.textContent = new Date(item.published_at).toLocaleString('ja-JP');
    videoModal.classList.remove('hidden');
    videoModal.classList.add('flex');
    document.body.style.overflow = 'hidden';
}

// Close video modal
function closeVideoModal() {
    modalVideo.pause();
    modalVideo.querySelector('source').src = '';
    videoModal.classList.add('hidden');
    videoModal.classList.remove('flex');
    document.body.style.overflow = '';
}

// Load more news
function loadMore() {
    const nextItems = filteredNews.slice(displayCount, displayCount + perPage);
    displayCount += nextItems.length;
    renderNews(nextItems, true);

    // Update load more button visibility
    if (displayCount >= filteredNews.length) {
        loadMoreContainer.classList.add('hidden');
    }
}

// Initialize
async function init() {
    // Fetch all news at once (per_page=500 to get all items)
    const data = await fetchNews(1, 500);

    if (data && data.items) {
        allNews = data.items.filter(item => item.category === 1);
        filteredNews = [...allNews];

        // Display first 20 items
        const itemsToShow = filteredNews.slice(0, perPage);
        displayCount = itemsToShow.length;
        renderNews(itemsToShow);
        renderDateNav(extractDates(allNews));

        if (displayCount < filteredNews.length) {
            loadMoreContainer.classList.remove('hidden');
        }
    } else {
        loadingState.innerHTML = '<p class="text-text-muted">ニュースを読み込めませんでした</p>';
    }
}

// Event Listeners
loadMoreBtn.addEventListener('click', loadMore);
closeModal.addEventListener('click', closeVideoModal);
videoModal.addEventListener('click', (e) => {
    if (e.target === videoModal) closeVideoModal();
});

// Date navigation scroll
dateNavLeft.addEventListener('click', () => {
    dateNavScroll.scrollBy({ left: -200, behavior: 'smooth' });
});
dateNavRight.addEventListener('click', () => {
    dateNavScroll.scrollBy({ left: 200, behavior: 'smooth' });
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeVideoModal();
});

// Start the app
init();
