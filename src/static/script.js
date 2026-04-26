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
                b.classList.toggle("bg-blue-600", isActive);
                b.classList.toggle("text-white", isActive);
                b.classList.toggle("bg-gray-50", !isActive);
                b.classList.toggle("dark:bg-gray-700", !isActive);
                b.classList.toggle("text-gray-600", !isActive);
                b.classList.toggle("dark:text-gray-400", !isActive);
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
            `<button class="history-chip px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">${escapeHTML(h)}</button>`
        ).join("");
        searchHistoryContainer.innerHTML = `<span class="text-sm text-gray-500 dark:text-gray-400 self-center">Recent:</span>${chips}`;

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
            bookmarksList.innerHTML = `<p class="text-gray-500 dark:text-gray-400 text-center py-8">No saved articles yet</p>`;
            return;
        }
        bookmarksList.innerHTML = bookmarks.map(b => `
            <div class="border-b border-gray-200 dark:border-gray-700 py-4 last:border-0">
                <a href="${encodeURI(b.url)}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 font-medium hover:underline">${escapeHTML(b.title)}</a>
                <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">${escapeHTML(b.source)} · ${timeAgo(b.savedAt)}</p>
                <p class="text-gray-600 dark:text-gray-300 text-sm mt-2">${escapeHTML(b.summary || "")}</p>
                <button onclick="window._removeBookmark('${encodeURI(b.url)}')" class="text-red-500 hover:text-red-700 text-sm mt-2">Remove</button>
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
        fetchNews();
    });

    // --- Event Listeners ---
    fetchButton.addEventListener("click", fetchNews);
    topicInput.addEventListener("keydown", (e) => { if (e.key === "Enter") fetchNews(); });
    maxResultsInput.addEventListener("keydown", (e) => { if (e.key === "Enter") fetchNews(); });

    async function fetchNews() {
        const topic = topicInput.value;
        const language = languageSelect.value;
        let max_results = parseInt(maxResultsInput.value) || 10;
        max_results = Math.max(1, Math.min(10, max_results));

        addToSearchHistory(topic);

        fetchButton.disabled = true;
        fetchButton.classList.add("opacity-70", "cursor-not-allowed");
        searchIcon.classList.add("hidden");
        spinnerIcon.classList.remove("hidden");
        buttonText.textContent = "Summarizing...";

        skeletonLoader.classList.remove("hidden");
        errorMessage.classList.add("hidden");
        articleListContainer.innerHTML = "";
        chartContainer.classList.add("hidden");

        try {
            const baseURL = window.location.origin;
            const url = `${baseURL}/get-summarized-news?topic=${encodeURIComponent(topic)}&language=${language}&max_results=${max_results}&summary_length=${summaryLength}`;
            const response = await fetch(url);

            if(!response.ok) {
                throw new Error("HTTP error, Status: " + response.status);
            }

            const articles = await response.json();

            displayArticles(articles);
            renderSourceChart(articles);
        } catch (error) {
            displayError(error.message);
        } finally {
            fetchButton.disabled = false;
            fetchButton.classList.remove("opacity-70", "cursor-not-allowed");
            searchIcon.classList.remove("hidden");
            spinnerIcon.classList.add("hidden");
            buttonText.textContent = "Fetch & Summarize";

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
            "#3b82f6", "#8b5cf6", "#ef4444", "#10b981", "#f59e0b",
            "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1"
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
                    borderColor: isDark ? "#1f2937" : "#ffffff"
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            color: isDark ? "#d1d5db" : "#374151",
                            padding: 16,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    // --- Display Articles ---
    function displayArticles(articles) {
        articleListContainer.innerHTML = "";

        if(articles.length === 0) {
            articleListContainer.innerHTML = "<p class='text-gray-600 dark:text-gray-400'>No articles found for this topic</p>";
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

            const articleCardHTML = `
            <div class="article-card bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transform transition-transform hover:scale-105" style="animation-delay: ${index * 0.1}s">
                <a href="${url}" target="_blank" rel="noopener noreferrer">
                    <img class="w-full object-cover h-48" src="${image}" alt="Article Image" onerror="this.style.display='none'">
                </a>
                <div class="p-6">
                    <div class="flex items-start justify-between gap-2">
                        <h3 class="text-xl font-semibold mb-2 text-gray-900 dark:text-white">${title}</h3>
                        <button class="bookmark-btn flex-shrink-0 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" data-index="${index}" aria-label="Bookmark">
                            <svg class="w-5 h-5 ${bookmarked ? 'text-blue-600 fill-blue-600' : 'text-gray-400'}" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="${bookmarked ? 'currentColor' : 'none'}">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                            </svg>
                        </button>
                    </div>
                    <p class="text-gray-600 dark:text-gray-400 text-sm mb-1">${sourceName}${publishedAt ? " · " + publishedAt : ""}</p>
                    <div class="mt-2 mb-4">
                        <div class="flex items-center gap-2 mb-2">
                            <button class="compare-btn text-xs px-2 py-0.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" data-index="${index}">Show Original</button>
                        </div>
                        <p class="summary-text text-gray-700 dark:text-gray-300 text-base">
                            <strong>Summary:</strong> ${summary}
                        </p>
                        <p class="original-text text-gray-700 dark:text-gray-300 text-base hidden">
                            <strong>Original:</strong> ${description}
                        </p>
                    </div>
                    <a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium mt-4 inline-block">
                        Read Full Article &rarr;
                    </a>
                </div>
            </div>
            `;
            articleListContainer.insertAdjacentHTML("beforeend", articleCardHTML);
        });

        // Attach bookmark click handlers
        articleListContainer.querySelectorAll(".bookmark-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const idx = parseInt(btn.dataset.index);
                toggleBookmark(articles[idx]);
                const svg = btn.querySelector("svg");
                const nowBookmarked = isBookmarked(articles[idx].url);
                svg.classList.toggle("text-blue-600", nowBookmarked);
                svg.classList.toggle("fill-blue-600", nowBookmarked);
                svg.classList.toggle("text-gray-400", !nowBookmarked);
                svg.setAttribute("fill", nowBookmarked ? "currentColor" : "none");
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
                btn.textContent = showingOriginal ? "Show Original" : "Show Summary";
            });
        });
    }

    function displayError(message) {
        errorMessage.textContent = `Error: ${message}. Please try again.`;
        errorMessage.classList.remove("hidden")
    }
});
