from flask import Flask, request, jsonify, render_template
from transformers import T5ForConditionalGeneration, T5Tokenizer
import logging
from src.fetch_news import fetch_top_headlines
import torch
torch.set_num_threads(1)


# Set up logging so you can see what's happening
logging.basicConfig(level=logging.INFO)

# --- 1. Initialize the Flask App ---
app = Flask(__name__, static_folder='static', template_folder='templates')



# --- 2. Load Your Fine-Tuned Model ---
# This is the path to the folder you unzipped
MODEL_NAME = "VishalShaw/t5-small-finetuned-news"



logging.info("Loading model and tokenizer...")
try:
    tokenizer = T5Tokenizer.from_pretrained(MODEL_NAME)
    model = T5ForConditionalGeneration.from_pretrained(MODEL_NAME)
    logging.info(f"Successfully loaded fine-tuned model from '{MODEL_NAME}'")
except Exception as e:
    logging.error(f"Error loading model: {e}")
    # If the app can't load the model, there's no point in running.
    raise e



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
        num_beams=4,      # 4 beams is a good balance of quality and speed
        no_repeat_ngram_size=2, # Stops repetition
        early_stopping=True
    )

    summary = [tokenizer.decode(summary, skip_special_tokens=True) for summary in summary_ids]
    logging.info("Summary generation complete.")
    return summary



# --- 4. Define the API Endpoint ---
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
    API endpoint to fetch real time news from,
    a news API and accept the topic, language and max_results from the user
    and return a summary.
    """
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
    # You can set debug=True for development, but set to False for production
    app.run(host='0.0.0.0', port=5000)