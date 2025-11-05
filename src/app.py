from flask import Flask, request, jsonify, render_template
from transformers import T5ForConditionalGeneration, T5Tokenizer
import logging
from src.fetch_news import fetch_top_headlines
import torch
import os  # <-- Import os

# Set threads for CPU-only environment
torch.set_num_threads(1)

# Set up logging
logging.basicConfig(level=logging.INFO)

# --- 1. Initialize the Flask App ---
app = Flask(__name__, static_folder='static', template_folder='templates')


# --- 2. "Lazy Load" Model Setup ---
# Set model and tokenizer to None. They will be loaded on the first API call.
MODEL_NAME = "VishalShaw/t5-small-finetuned-news"
tokenizer = None
model = None

def load_model_and_tokenizer():
    """
    Loads the model and tokenizer into the global variables.
    This is called by the first request to the /get-summarized-news endpoint.
    """
    global tokenizer, model

    # This check ensures the model is only loaded ONCE
    if model is None or tokenizer is None:
        logging.info("LAZY LOADING: Model and tokenizer not found. Loading now...")
        try:
            tokenizer = T5Tokenizer.from_pretrained(MODEL_NAME)
            model = T5ForConditionalGeneration.from_pretrained(MODEL_NAME, from_tf=True)
            logging.info(f"Successfully loaded fine-tuned model from '{MODEL_NAME}'")
        except Exception as e:
            logging.error(f"Error loading model: {e}")
            # If the model fails to load, we can't run.
            # This error will be seen in the logs of the first request.
            raise e
    else:
        logging.info("Model and tokenizer already loaded.")


# --- 3. Create the Summary Generation Function ---
def generate_summary(text_to_summarize):
    """
    Generates a summary for a given text using the fine-tuned model.
    """
    logging.info("Generating summary...")

    # Prepare the text (add the T5 prefix from training)
    input_text = [f"summarize: {text}" for text in text_to_summarize]

    inputs = tokenizer(
        input_text,
        return_tensors='pt',
        max_length=512,
        truncation=True,
        padding=True
    )

    # Generate summary IDs using the parameters from your tuning
    summary_ids = model.generate(
        inputs.input_ids,
        attention_mask=inputs.attention_mask,
        max_length=80,
        min_length=30,
        num_beams=4,
        no_repeat_ngram_size=2,
        early_stopping=True
    )

    summary = [tokenizer.decode(summary, skip_special_tokens=True) for summary in summary_ids]
    logging.info("Summary generation complete.")
    return summary


# --- 4. Define the Homepage Route ---
@app.route("/")
def home():
    """
    Serves the main index.html file.
    """
    return render_template("index.html")


# --- 5. Define the API Endpoint ---
@app.route("/get-summarized-news", methods=["GET"])
def summarize_endpoint():
    """
    API endpoint to fetch real time news, summarize, and return.
    """

    try:
        load_model_and_tokenizer()
    except Exception as e:
        logging.error(f"Failed to load model on demand: {e}")
        return jsonify({'error': 'Model failed to load, server is in a bad state.'}), 500

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
        summary = generate_summary(texts)
        output_data = []
        for i, article in enumerate(articles):
            article['summary'] = summary[i]
            output_data.append(article)
        return jsonify(output_data)
    except Exception as e:
        logging.error(f'Error in /get-summarized-news: {e}')
        return jsonify({'error': 'Failed to process news!!'}), 500


# --- 6. Run the App ---
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)