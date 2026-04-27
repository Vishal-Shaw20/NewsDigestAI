document.addEventListener("DOMContentLoaded", () => {
    const topicInput = document.getElementById("topic-input");
    const maxResultsInput = document.getElementById("max-results-input");
    const languageSelect = document.getElementById("language-select");
    const fetchButton = document.getElementById("fetch-button");
    const errorMessage = document.getElementById("error-message")
    const articleListContainer = document.getElementById("article-list-container");
    const skeletonLoader = document.getElementById("skeleton-loader-container");
    const themeToggle = document.getElementById("theme-toggle");
    const sunIcon = document.getElementById("sun-icon");
    const moonIcon = document.getElementById("moon-icon");
    const quickTopics = document.getElementById("quick-topics");
    const searchIcon = document.getElementById("search-icon");
    const spinnerIcon = document.getElementById("spinner-icon");
    const buttonText = document.getElementById("button-text");
    const chartContainer = document.getElementById("chart-container");
    const bookmarksToggle = document.getElementById("bookmarks-toggle");
    const bookmarksPanel = document.getElementById("bookmarks-panel");
    const bookmarksClose = document.getElementById("bookmarks-close");
    const bookmarksOverlay = document.getElementById("bookmarks-overlay");
    const bookmarksList = document.getElementById("bookmarks-list");
    const bookmarkCount = document.getElementById("bookmark-count");
    const searchHistoryContainer = document.getElementById("search-history");

    let sourceChart = null;
    let summaryLength = "medium";
    let currentPage = 1;
    let pageCache = {};
    let currentSearchKey = "";
    let prefetchVersion = 0;
    const inFlightKeys = new Set();
    const paginationContainer = document.getElementById("pagination-container");

    // --- Dark Mode ---
    function applyTheme(dark) {
        document.documentElement.classList.toggle("dark", dark);
        sunIcon.classList.toggle("hidden", !dark);
        moonIcon.classList.toggle("hidden", dark);
        localStorage.setItem("theme", dark ? "dark" : "light");
    }

    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(savedTheme ? savedTheme === "dark" : prefersDark);

    themeToggle.addEventListener("click", () => {
        applyTheme(!document.documentElement.classList.contains("dark"));
    });

    // --- Summary Length Toggle ---
    document.querySelectorAll(".summary-len-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            summaryLength = btn.dataset.length;
            document.querySelectorAll(".summary-len-btn").forEach(b => {
                const isActive = b.dataset.length === summaryLength;
                b.className = `summary-len-btn px-3 py-1.5 text-sm transition-colors ${isActive ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium" : "bg-white dark:bg-zinc-900 text-stone-500 dark:text-zinc-400 hover:bg-stone-50 dark:hover:bg-zinc-800"}`;
            });
        });
    });

    // --- Search History ---
    function getSearchHistory() {
        return JSON.parse(localStorage.getItem("searchHistory") || "[]");
    }

    function addToSearchHistory(topic) {
        if (!topic.trim()) return;
        let history = getSearchHistory();
        history = history.filter(h => h.toLowerCase() !== topic.toLowerCase());
        history.unshift(topic);
        history = history.slice(0, 8);
        localStorage.setItem("searchHistory", JSON.stringify(history));
        renderSearchHistory();
    }

    function renderSearchHistory() {
        const history = getSearchHistory();
        if (history.length === 0) {
            searchHistoryContainer.classList.add("hidden");
            return;
        }
        searchHistoryContainer.classList.remove("hidden");
        const chips = history.map(h =>
            `<button class="history-chip px-3 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-500 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors">${escapeHTML(h)}</button>`
        ).join("");
        searchHistoryContainer.innerHTML = `<span class="text-sm text-stone-400 dark:text-zinc-500 self-center">Recent:</span>${chips}`;

        searchHistoryContainer.querySelectorAll(".history-chip").forEach(chip => {
            chip.addEventListener("click", () => {
                topicInput.value = chip.textContent;
                fetchNews();
            });
        });
    }

    renderSearchHistory();

    // --- Bookmarks ---
    function getBookmarks() {
        return JSON.parse(localStorage.getItem("bookmarks") || "[]");
    }

    function saveBookmarks(bookmarks) {
        localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
        updateBookmarkCount();
    }

    function updateBookmarkCount() {
        const count = getBookmarks().length;
        bookmarkCount.textContent = count;
        bookmarkCount.classList.toggle("hidden", count === 0);
    }

    function isBookmarked(url) {
        return getBookmarks().some(b => b.url === url);
    }

    function toggleBookmark(article) {
        let bookmarks = getBookmarks();
        const index = bookmarks.findIndex(b => b.url === article.url);
        if (index > -1) {
            bookmarks.splice(index, 1);
        } else {
            bookmarks.push({
                title: article.title,
                url: article.url,
                source: article.source?.name || "",
                summary: article.summary,
                image: article.image,
                savedAt: new Date().toISOString()
            });
        }
        saveBookmarks(bookmarks);
    }

    function renderBookmarksPanel() {
        const bookmarks = getBookmarks();
        if (bookmarks.length === 0) {
            bookmarksList.innerHTML = `<p class="text-stone-400 dark:text-zinc-500 text-center py-8">No saved articles yet</p>`;
            return;
        }
        bookmarksList.innerHTML = bookmarks.map(b => `
            <div class="border-b border-stone-100 dark:border-zinc-800 py-4 last:border-0">
                <a href="${encodeURI(b.url)}" target="_blank" rel="noopener noreferrer" class="text-accent-600 dark:text-accent-400 font-medium hover:underline text-sm">${escapeHTML(b.title)}</a>
                <p class="text-stone-400 dark:text-zinc-500 text-xs mt-1">${escapeHTML(b.source)} &middot; ${timeAgo(b.savedAt)}</p>
                <p class="text-stone-500 dark:text-zinc-400 text-xs mt-1.5 leading-relaxed">${escapeHTML(b.summary || "")}</p>
                <button onclick="window._removeBookmark('${encodeURI(b.url)}')" class="text-red-500 hover:text-red-700 text-xs mt-2 font-medium">Remove</button>
            </div>
        `).join("");
    }

    window._removeBookmark = function(url) {
        let bookmarks = getBookmarks();
        bookmarks = bookmarks.filter(b => encodeURI(b.url) !== url);
        saveBookmarks(bookmarks);
        renderBookmarksPanel();
    };

    bookmarksToggle.addEventListener("click", () => {
        renderBookmarksPanel();
        bookmarksPanel.classList.remove("hidden");
    });

    bookmarksClose.addEventListener("click", () => bookmarksPanel.classList.add("hidden"));
    bookmarksOverlay.addEventListener("click", () => bookmarksPanel.classList.add("hidden"));

    updateBookmarkCount();

    // --- Quick Topic Buttons ---
    quickTopics.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-topic]");
        if (!btn) return;
        topicInput.value = btn.dataset.topic;

        document.querySelectorAll(".topic-pill").forEach(p => {
            const match = p.dataset.topic === btn.dataset.topic;
            p.className = `topic-pill px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${match ? "bg-accent-50 text-accent-700 dark:bg-accent-700/20 dark:text-accent-400 ring-1 ring-accent-200 dark:ring-accent-700/40" : "bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700"}`;
        });

        fetchNews();
    });

    // --- Event Listeners ---
    fetchButton.addEventListener("click", fetchNews);
    topicInput.addEventListener("keydown", (e) => { if (e.key === "Enter") fetchNews(); });
    maxResultsInput.addEventListener("keydown", (e) => { if (e.key === "Enter") fetchNews(); });

    async function fetchPageData(topic, language, maxResults, page) {
        const baseURL = window.location.origin;
        const url = `${baseURL}/get-summarized-news?topic=${encodeURIComponent(topic)}&language=${language}&max_results=${maxResults}&summary_length=${summaryLength}&page=${page}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("HTTP error, Status: " + response.status);
        return response.json();
    }

    function getVisiblePages(current, totalPages) {
        const delta = 2;
        const pages = new Set([1]);
        for (let i = Math.max(2, current - delta); i <= Math.min(totalPages - 1, current + delta); i++) {
            pages.add(i);
        }
        if (totalPages > 1) pages.add(totalPages);
        pages.delete(current);
        return [...pages];
    }

    async function prefetchPages(topic, language, maxResults, fromPage, totalPages) {
        const version = ++prefetchVersion;

        const pagesToFetch = getVisiblePages(fromPage, totalPages)
            .filter(p => !pageCache[`${currentSearchKey}|${p}`])
            .sort((a, b) => Math.abs(a - fromPage) - Math.abs(b - fromPage));

        const failedPages = [];

        for (const targetPage of pagesToFetch) {
            if (prefetchVersion !== version) return;

            const cacheKey = `${currentSearchKey}|${targetPage}`;
            if (pageCache[cacheKey] || inFlightKeys.has(cacheKey)) continue;

            inFlightKeys.add(cacheKey);
            try {
                const data = await fetchPageData(topic, language, maxResults, targetPage);
                pageCache[cacheKey] = data;
            } catch (e) {
                failedPages.push(targetPage);
                continue;
            } finally {
                inFlightKeys.delete(cacheKey);
            }
        }

        if (failedPages.length === 0 || prefetchVersion !== version) return;

        await new Promise(r => setTimeout(r, 5000));

        for (const targetPage of failedPages) {
            if (prefetchVersion !== version) return;

            const cacheKey = `${currentSearchKey}|${targetPage}`;
            if (pageCache[cacheKey] || inFlightKeys.has(cacheKey)) continue;

            inFlightKeys.add(cacheKey);
            try {
                const data = await fetchPageData(topic, language, maxResults, targetPage);
                pageCache[cacheKey] = data;
            } catch (e) {
            } finally {
                inFlightKeys.delete(cacheKey);
            }
        }
    }

    async function fetchNews(page = 1) {
        currentPage = page;
        const topic = topicInput.value;
        const language = languageSelect.value;
        let max_results = parseInt(maxResultsInput.value) || 10;
        max_results = Math.max(1, Math.min(10, max_results));

        if (page === 1) addToSearchHistory(topic);

        // Highlight active topic pill
        document.querySelectorAll(".topic-pill").forEach(p => {
            const match = p.dataset.topic.toLowerCase() === topic.toLowerCase();
            p.className = `topic-pill px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${match ? "bg-accent-50 text-accent-700 dark:bg-accent-700/20 dark:text-accent-400 ring-1 ring-accent-200 dark:ring-accent-700/40" : "bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700"}`;
        });

        const searchKey = `${topic}|${language}|${max_results}|${summaryLength}`;
        if (searchKey !== currentSearchKey) {
            pageCache = {};
            currentSearchKey = searchKey;
        }

        const cacheKey = `${currentSearchKey}|${page}`;

        if (pageCache[cacheKey]) {
            const data = pageCache[cacheKey];
            errorMessage.classList.add("hidden");

            articleListContainer.style.opacity = "0";
            chartContainer.style.opacity = "0";
            paginationContainer.style.opacity = "0";

            await new Promise(r => setTimeout(r, 150));

            displayArticles(data.articles);
            renderSourceChart(data.articles);
            renderPagination(data.page, data.totalPages);

            articleListContainer.style.opacity = "1";
            chartContainer.style.opacity = "1";
            paginationContainer.style.opacity = "1";

            prefetchPages(topic, language, max_results, page, data.totalPages);
            return;
        }

        fetchButton.disabled = true;
        fetchButton.classList.add("opacity-60");
        searchIcon.classList.add("hidden");
        spinnerIcon.classList.remove("hidden");
        buttonText.textContent = "Summarizing...";

        skeletonLoader.classList.remove("hidden");
        errorMessage.classList.add("hidden");
        articleListContainer.innerHTML = "";
        chartContainer.classList.add("hidden");
        paginationContainer.classList.add("hidden");

        inFlightKeys.add(cacheKey);
        try {
            const data = await fetchPageData(topic, language, max_results, page);
            pageCache[cacheKey] = data;

            displayArticles(data.articles);
            renderSourceChart(data.articles);
            renderPagination(data.page, data.totalPages);

            prefetchPages(topic, language, max_results, page, data.totalPages);
        } catch (error) {
            displayError(error.message);
        } finally {
            inFlightKeys.delete(cacheKey);
            fetchButton.disabled = false;
            fetchButton.classList.remove("opacity-60");
            searchIcon.classList.remove("hidden");
            spinnerIcon.classList.add("hidden");
            buttonText.textContent = "Summarize";

            skeletonLoader.classList.add("hidden");
        }
    }

    function escapeHTML(str) {
        const div = document.createElement("div");
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    function timeAgo(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return "just now";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    }

    // --- Source Distribution Chart ---
    function renderSourceChart(articles) {
        const sourceCounts = {};
        articles.forEach(a => {
            const name = a.source?.name || "Unknown";
            sourceCounts[name] = (sourceCounts[name] || 0) + 1;
        });

        const labels = Object.keys(sourceCounts);
        const data = Object.values(sourceCounts);
        const colors = [
            "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#ef4444",
            "#ec4899", "#6366f1", "#84cc16", "#f97316", "#3b82f6"
        ];

        if (sourceChart) sourceChart.destroy();

        const isDark = document.documentElement.classList.contains("dark");

        chartContainer.classList.remove("hidden");
        sourceChart = new Chart(document.getElementById("source-chart"), {
            type: "doughnut",
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: isDark ? "#18181b" : "#ffffff"
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            color: isDark ? "#a1a1aa" : "#57534e",
                            padding: 16,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    function renderPagination(page, totalPages) {
        paginationContainer.innerHTML = "";
        if (totalPages <= 1) {
            paginationContainer.classList.add("hidden");
            return;
        }
        paginationContainer.classList.remove("hidden");

        const buttons = [];

        if (page > 1) {
            buttons.push(`<button data-page="${page - 1}" class="px-3 py-2 rounded-lg text-sm font-medium text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors">&laquo; Prev</button>`);
        }

        const delta = 2;
        const pages = [1];
        const rangeStart = Math.max(2, page - delta);
        const rangeEnd = Math.min(totalPages - 1, page + delta);

        if (rangeStart > 2) pages.push("...");
        for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);
        if (rangeEnd < totalPages - 1) pages.push("...");
        if (totalPages > 1) pages.push(totalPages);

        pages.forEach(p => {
            if (p === "...") {
                buttons.push(`<span class="px-2 py-2 text-sm text-stone-400 dark:text-zinc-600">&hellip;</span>`);
            } else {
                const isActive = p === page;
                buttons.push(`<button data-page="${p}" class="w-10 h-10 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-accent-500 text-white' : 'text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800'}">${p}</button>`);
            }
        });

        if (page < totalPages) {
            buttons.push(`<button data-page="${page + 1}" class="px-3 py-2 rounded-lg text-sm font-medium text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors">Next &raquo;</button>`);
        }

        paginationContainer.innerHTML = buttons.join("");

        paginationContainer.querySelectorAll("[data-page]").forEach(btn => {
            btn.addEventListener("click", () => {
                fetchNews(parseInt(btn.dataset.page));
                articleListContainer.scrollIntoView({ behavior: "smooth", block: "start" });
            });
        });
    }

    // --- Display Articles ---
    function displayArticles(articles) {
        articleListContainer.innerHTML = "";

        if(articles.length === 0) {
            articleListContainer.innerHTML = "<p class='text-stone-500 dark:text-zinc-400'>No articles found for this topic</p>";
            return;
        }

        articles.forEach((article, index) => {
            const title = escapeHTML(article.title || "");
            const sourceName = escapeHTML(article.source?.name || "");
            const summary = escapeHTML(article.summary || "");
            const description = escapeHTML(article.description || "");
            const url = encodeURI(article.url || "");
            const image = encodeURI(article.image || "");
            const publishedAt = article.publishedAt ? timeAgo(article.publishedAt) : "";
            const bookmarked = isBookmarked(article.url);
            const isFeatured = index === 0;

            const articleCardHTML = isFeatured ? `
            <div class="article-card md:col-span-2 lg:col-span-2 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl overflow-hidden flex flex-col md:flex-row" style="animation-delay: 0s">
                <div class="md:w-2/5 overflow-hidden">
                    <img class="w-full h-56 md:h-full object-cover" src="${image}" alt="" onerror="this.style.display='none'">
                </div>
                <div class="p-6 md:p-8 flex flex-col flex-grow justify-between">
                    <div>
                        <p class="text-xs uppercase tracking-wider text-stone-400 dark:text-zinc-500 font-medium mb-3">${sourceName}${publishedAt ? " &middot; " + publishedAt : ""}</p>
                        <h3 class="font-display text-2xl font-bold text-stone-900 dark:text-white mb-3 leading-tight">${title}</h3>
                        <div>
                            <p class="summary-text text-stone-600 dark:text-zinc-400 leading-relaxed">${summary}</p>
                            <p class="original-text text-stone-600 dark:text-zinc-400 leading-relaxed hidden">${description}</p>
                        </div>
                    </div>
                    <div class="flex items-center justify-between mt-6 pt-4 border-t border-stone-100 dark:border-zinc-800">
                        <a href="${url}" target="_blank" rel="noopener noreferrer" class="text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300 font-medium text-sm transition-colors">Read full article</a>
                        <div class="flex items-center gap-3">
                            <button class="compare-btn text-stone-400 dark:text-zinc-500 hover:text-stone-600 dark:hover:text-zinc-300 transition-colors text-xs underline underline-offset-2" data-index="${index}">Show original</button>
                            <button class="bookmark-btn ${bookmarked ? 'text-accent-500' : 'text-stone-400 dark:text-zinc-500'} hover:text-accent-500 transition-colors" data-index="${index}" aria-label="Bookmark">
                                <svg class="w-4 h-4" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="${bookmarked ? 'currentColor' : 'none'}"><path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>` : `
            <div class="article-card bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl overflow-hidden flex flex-col" style="animation-delay: ${index * 0.1}s">
                <div class="overflow-hidden">
                    <img class="w-full h-48 object-cover" src="${image}" alt="" onerror="this.style.display='none'">
                </div>
                <div class="p-5 flex flex-col flex-grow">
                    <p class="text-xs uppercase tracking-wider text-stone-400 dark:text-zinc-500 font-medium mb-2">${sourceName}${publishedAt ? " &middot; " + publishedAt : ""}</p>
                    <h3 class="font-display text-lg font-bold text-stone-900 dark:text-white mb-2 leading-snug">${title}</h3>
                    <div class="flex-grow">
                        <p class="summary-text text-stone-600 dark:text-zinc-400 text-sm leading-relaxed">${summary}</p>
                        <p class="original-text text-stone-600 dark:text-zinc-400 text-sm leading-relaxed hidden">${description}</p>
                    </div>
                    <div class="flex items-center justify-between mt-4 pt-3 border-t border-stone-100 dark:border-zinc-800">
                        <a href="${url}" target="_blank" rel="noopener noreferrer" class="text-accent-600 dark:text-accent-400 hover:text-accent-700 font-medium text-sm transition-colors">Read full article</a>
                        <div class="flex items-center gap-3">
                            <button class="compare-btn text-stone-400 dark:text-zinc-500 hover:text-stone-600 dark:hover:text-zinc-300 transition-colors text-xs underline underline-offset-2" data-index="${index}">Show original</button>
                            <button class="bookmark-btn ${bookmarked ? 'text-accent-500' : 'text-stone-400 dark:text-zinc-500'} hover:text-accent-500 transition-colors" data-index="${index}" aria-label="Bookmark">
                                <svg class="w-4 h-4" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="${bookmarked ? 'currentColor' : 'none'}"><path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
            articleListContainer.insertAdjacentHTML("beforeend", articleCardHTML);
        });

        // Attach bookmark click handlers
        articleListContainer.querySelectorAll(".bookmark-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const idx = parseInt(btn.dataset.index);
                toggleBookmark(articles[idx]);
                const svg = btn.querySelector("svg");
                const nowBookmarked = isBookmarked(articles[idx].url);
                svg.setAttribute("fill", nowBookmarked ? "currentColor" : "none");
                btn.classList.toggle("text-accent-500", nowBookmarked);
                btn.classList.toggle("text-stone-400", !nowBookmarked);
            });
        });

        // Attach compare toggle handlers
        articleListContainer.querySelectorAll(".compare-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const card = btn.closest(".article-card");
                const summaryEl = card.querySelector(".summary-text");
                const originalEl = card.querySelector(".original-text");
                const showingOriginal = !originalEl.classList.contains("hidden");

                summaryEl.classList.toggle("hidden", !showingOriginal);
                originalEl.classList.toggle("hidden", showingOriginal);
                btn.textContent = showingOriginal ? "Show original" : "Show summary";
            });
        });
    }

    function displayError(message) {
        errorMessage.textContent = `Error: ${message}. Please try again.`;
        errorMessage.classList.remove("hidden")
    }
});
