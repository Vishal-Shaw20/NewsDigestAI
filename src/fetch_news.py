from dotenv import load_dotenv
import os
import requests
import pandas as pd

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
    response = requests.get(BASE_URL, params=params)
    data = response.json()
    article = data.get('articles', [])
    return article