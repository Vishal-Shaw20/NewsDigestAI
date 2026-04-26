from dotenv import load_dotenv
import logging
import os
import requests

load_dotenv()
API_KEY = os.getenv("NEWS_API_KEY")

BASE_URL = "https://gnews.io/api/v4/top-headlines"

def fetch_top_headlines(query = '', language = 'en', max_results = 10):
    params = {
        'q' : query,
        'lang' : language,
        'max' : max_results,
        'token' : API_KEY
    }
    try:
        response = requests.get(BASE_URL, params=params)
        response.raise_for_status()
        data = response.json()
        return data.get('articles', [])
    except requests.RequestException as e:
        logging.error(f"GNews API error: {e}")
        return []