from dotenv import load_dotenv
import logging
import os
import requests

load_dotenv()
API_KEY = os.getenv("NEWS_API_KEY")

HEADLINES_URL = "https://gnews.io/api/v4/top-headlines"
SEARCH_URL = "https://gnews.io/api/v4/search"

VALID_CATEGORIES = {
    "general", "world", "nation", "business",
    "technology", "entertainment", "sports", "science", "health",
}

def fetch_top_headlines(query = '', language = 'en', max_results = 10, page = 1):
    query = query.strip()
    is_category = query.lower() in VALID_CATEGORIES

    if is_category:
        url = HEADLINES_URL
        params = {
            'category': query.lower(),
            'lang': language,
            'max': max_results,
            'page': page,
            'token': API_KEY,
        }
    elif query:
        url = SEARCH_URL
        params = {
            'q': query,
            'lang': language,
            'max': max_results,
            'page': page,
            'token': API_KEY,
        }
    else:
        url = HEADLINES_URL
        params = {
            'lang': language,
            'max': max_results,
            'page': page,
            'token': API_KEY,
        }
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        total_articles = data.get('totalArticles', 0)
        articles = data.get('articles', [])
        return articles, total_articles
    except requests.RequestException as e:
        logging.error(f"GNews API error: {e}")
        return [], 0