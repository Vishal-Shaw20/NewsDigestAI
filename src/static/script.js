document.addEventListener("DOMContentLoaded", () => {
    const topicInput = document.getElementById("topic-input");
    const maxResultsInput = document.getElementById("max-results-input");
    const fetchButton = document.getElementById("fetch-button");
    const errorMessage = document.getElementById("error-message")
    const articleListContainer = document.getElementById("article-list-container");
    const skeletonLoader = document.getElementById("skeleton-loader-container");

    fetchButton.addEventListener("click", fetchNews);

    async function fetchNews() {
        const topic = topicInput.value;
        const max_results = maxResultsInput.value;

        fetchButton.disabled = true;
        fetchButton.classList.add("opacity-70", "cursor-not-allowed");

        skeletonLoader.classList.remove("hidden");
        errorMessage.classList.add("hidden");
        articleListContainer.innerHTML = "";

        try {
            const baseURL = window.location.origin;
            const url = `${baseURL}/get-summarized-news?topic=${topic}&max_results=${max_results}`;
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

    function displayArticles(articles) {
        articleListContainer.innerHTML = "";

        if(articles.length === 0) {
            articleListContainer.innerHTML = "<p class='text-gray-600'>No articles found for this topic</p>";
            return;
        }

        articles.forEach((article, index) => {
            const articleCardHTML = `
            <div class="article-card bg-white rounded-lg shadow-md overflow-hidden transform transition-transform hover:scale-105" style="animation-delay: ${index * 0.1}s">
                <a href="${article.url}" target="_blank" rel="noopener noreferrer">
                    <img class="w-full object-cover h-48" src="${article.image}" alt="Article Image" onerror="this.style.display='none'">
                </a>
                <div class="p-6">
                    <h3 class="text-xl font-semibold mb-2">${article.title}</h3>
                    <p class="text-gray-600 text-sm mb-1">${article.source.name}</p>
                    <p class="text-gray-700 text-base mb-4">
                        <strong>Summary:</strong> ${article.summary}
                    </p>
                    <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 font-medium mt-4 inline-block">
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