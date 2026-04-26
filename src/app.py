from flask import Flask, request, jsonify, render_template
from concurrent.futures import ThreadPoolExecutor
import logging
import os
import requests
from src.fetch_news import fetch_top_headlines

logging.basicConfig(level=logging.INFO)

app = Flask(__name__, static_folder='static', template_folder='templates')

HF_API_TOKEN = os.getenv("HF_API_TOKEN")
HF_MODEL_URL = "https://api-inference.huggingface.co/models/VishalShaw/t5-small-finetuned-news"


SUMMARY_LENGTH_MAP = {
    "short": {"max_length": 40, "min_length": 15},
    "medium": {"max_length": 80, "min_length": 30},
    "long": {"max_length": 150, "min_length": 50},
}


def _summarize_one(args):
    text, length_params = args
    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
    payload = {
        "inputs": f"summarize: {text}",
        "parameters": {
            "max_length": length_params["max_length"],
            "min_length": length_params["min_length"],
            "num_beams": 4,
            "no_repeat_ngram_size": 2,
        },
        "options": {"wait_for_model": True},
    }
    try:
        response = requests.post(HF_MODEL_URL, headers=headers, json=payload)
        if response.status_code != 200:
            logging.error(f"HF API error: {response.status_code} {response.text}")
            return "Summary unavailable."
        result = response.json()
        logging.info(f"HF API response: {result}")
        if isinstance(result, list) and len(result) > 0:
            return result[0].get("summary_text") or result[0].get("generated_text") or "Summary unavailable."
    except Exception as e:
        logging.error(f"HF API request failed: {e}")
    return "Summary unavailable."


def generate_summary(texts, summary_length="medium"):
    length_params = SUMMARY_LENGTH_MAP.get(summary_length, SUMMARY_LENGTH_MAP["medium"])
    args = [(text, length_params) for text in texts]
    with ThreadPoolExecutor(max_workers=5) as executor:
        return list(executor.map(_summarize_one, args))


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/get-summarized-news", methods=["GET"])
def summarize_endpoint():
    topic = request.args.get("topic", "")
    language = request.args.get("language", "en")
    max_results = request.args.get("max_results", 10, type=int)
    max_results = max(1, min(10, max_results))
    summary_length = request.args.get("summary_length", "medium")
    if summary_length not in SUMMARY_LENGTH_MAP:
        summary_length = "medium"

    articles = fetch_top_headlines(topic, language, max_results)

    if not articles:
        return jsonify({'error': 'No text found!!'}), 404

    texts = [
        f"{article['title']}. {article['description']}" for article in articles
    ]

    try:
        summaries = generate_summary(texts, summary_length)
        output_data = []
        for i, article in enumerate(articles):
            article['summary'] = summaries[i]
            output_data.append(article)
        return jsonify(output_data)
    except Exception as e:
        logging.error(f'Error in /get-summarized-news: {e}')
        return jsonify({'error': 'Failed to process news!!'}), 500


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
