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

        fetchButton.disabled = true;
        fetchButton.classList.add("opacity-70", "cursor-not-allowed");

        skeletonLoader.classList.remove("hidden");
        errorMessage.classList.add("hidden");
        articleListContainer.innerHTML = "";

        try {
            const baseURL = window.location.origin;
            const url = `${baseURL}/get-summarized-news?topic=${encodeURIComponent(topic)}&language=${language}&max_results=${max_results}`;
            const response = await fetch(url);

            if(!response.ok) {
                throw new Error("HTTP error, Status: " + response.status);
            }

            const articles = await response.json();

            displayArticles(articles);
        } catch (error) {
            displayError(error.message);
        } finally {
            fetchButton.disabled = false;
            fetchButton.classList.remove("opacity-70", "cursor-not-allowed");

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
            const url = encodeURI(article.url || "");
            const image = encodeURI(article.image || "");
            const publishedAt = article.publishedAt ? timeAgo(article.publishedAt) : "";

            const articleCardHTML = `
            <div class="article-card bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transform transition-transform hover:scale-105" style="animation-delay: ${index * 0.1}s">
                <a href="${url}" target="_blank" rel="noopener noreferrer">
                    <img class="w-full object-cover h-48" src="${image}" alt="Article Image" onerror="this.style.display='none'">
                </a>
                <div class="p-6">
                    <h3 class="text-xl font-semibold mb-2 text-gray-900 dark:text-white">${title}</h3>
                    <p class="text-gray-600 dark:text-gray-400 text-sm mb-1">${sourceName}${publishedAt ? " · " + publishedAt : ""}</p>
                    <p class="text-gray-700 dark:text-gray-300 text-base mb-4">
                        <strong>Summary:</strong> ${summary}
                    </p>
                    <a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium mt-4 inline-block">
                        Read Full Article &rarr;
                    </a>
                </div>
            </div>
            `;
            articleListContainer.insertAdjacentHTML("beforeend", articleCardHTML);
        });
    }

    function displayError(message) {
        errorMessage.textContent = `Error: ${message}. Please try again.`;
        errorMessage.classList.remove("hidden")
    }
});
