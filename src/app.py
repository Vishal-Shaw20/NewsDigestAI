from flask import Flask, request, jsonify, render_template
import logging
import os
import requests
from src.fetch_news import fetch_top_headlines

logging.basicConfig(level=logging.INFO)

app = Flask(__name__, static_folder='static', template_folder='templates')

HF_API_TOKEN = os.getenv("HF_API_TOKEN")
HF_MODEL_URL = "https://api-inference.huggingface.co/models/VishalShaw/t5-small-finetuned-news"


def generate_summary(texts):
    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
    summaries = []

    for text in texts:
        payload = {
            "inputs": f"summarize: {text}",
            "parameters": {
                "max_length": 80,
                "min_length": 30,
                "num_beams": 4,
                "no_repeat_ngram_size": 2,
            },
            "options": {"wait_for_model": True},
        }
        response = requests.post(HF_MODEL_URL, headers=headers, json=payload)

        if response.status_code != 200:
            logging.error(f"HF API error: {response.status_code} {response.text}")
            summaries.append("Summary unavailable.")
            continue

        result = response.json()
        if isinstance(result, list) and len(result) > 0:
            summaries.append(result[0].get("summary_text", "Summary unavailable."))
        else:
            summaries.append("Summary unavailable.")

    return summaries


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/get-summarized-news", methods=["GET"])
def summarize_endpoint():
    topic = request.args.get("topic", "")
    language = request.args.get("language", "en")
    max_results = request.args.get("max_results", 10, type=int)

    articles = fetch_top_headlines(topic, language, max_results)

    if not articles:
        return jsonify({'error': 'No text found!!'}), 404

    texts = [
        f"{article['title']}. {article['description']}" for article in articles
    ]

    try:
        summaries = generate_summary(texts)
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
