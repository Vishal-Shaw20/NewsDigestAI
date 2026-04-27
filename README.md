# NewsDigest AI

Real-time news summarization web application powered by a fine-tuned T5 Transformer model deployed on HuggingFace Spaces.

**Live Demo:** [newsdigestai.onrender.com](https://newsdigestai.onrender.com)

---

## Features

- Fetches live news using the GNews API
- Generates concise summaries using a fine-tuned T5-small model
- Paginated results with client-side caching and smooth page transitions
- Background prefetching of visible pages for instant navigation
- Dark mode with system preference detection
- Adjustable summary length (short / medium / long)
- Bookmarks with reading list panel (localStorage)
- Search history with quick-access chips
- Quick topic buttons for one-click searches
- Source distribution chart (Chart.js doughnut)
- Original vs summary comparison toggle
- Skeleton loading states
- Fully containerized with Docker, deployed on Render

---

## Model

This project uses a fine-tuned T5-small model specifically trained for news summarization.

- Model: [VishalShaw/t5-small-finetuned-news](https://huggingface.co/VishalShaw/t5-small-finetuned-news)
- Inference: [VishalShaw/t5-news-summarizer](https://huggingface.co/spaces/VishalShaw/t5-news-summarizer) (HuggingFace Space)

---

## Tech Stack

| Layer           | Technology                              |
|-----------------|-----------------------------------------|
| Backend         | Flask + Gunicorn                        |
| Model Inference | HuggingFace Spaces (Docker, CPU)        |
| Frontend        | HTML + Tailwind CSS + JavaScript        |
| Visualization   | Chart.js                                |
| News Source     | GNews REST API                          |
| Deployment      | Docker + Render                         |

---

## Architecture

```
Browser
  |
  v
Flask (Render)  -->  GNews API (fetch articles)
  |
  v
HuggingFace Space (T5 model, /batch-summarize)
  |
  v
JSON response  -->  JavaScript renders article cards
```

---

## Project Structure

```
NewsDigestAI/
|-- src/
|   |-- app.py              # Flask API + HuggingFace Space calls
|   |-- fetch_news.py        # Fetches news via GNews API
|   |-- templates/           # Frontend HTML (index.html)
|   +-- static/              # CSS + JS (style.css, script.js)
|
|-- hf-space/                # HuggingFace Space repo (gitignored)
|   |-- app.py               # Flask API serving T5 model
|   |-- Dockerfile           # Space Docker config
|   +-- requirements.txt     # Space dependencies (transformers, torch)
|
|-- Dockerfile               # Main app Docker config
|-- requirements.txt         # Main app dependencies (flask, requests)
+-- README.md
```

---

## Setup (Local Development)

1. Clone the repository:
```bash
git clone https://github.com/Vishal-Shaw20/NewsDigestAI.git
cd NewsDigestAI
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file in the project root:
```
NEWS_API_KEY=your_gnews_api_key_here
```
Get a GNews API key at https://gnews.io

4. Run the application:
```bash
cd src
python app.py
```

5. Open `http://localhost:5000` in your browser.

---

## Author

**Vishal Shaw**

- GitHub: [Vishal-Shaw20](https://github.com/Vishal-Shaw20)
- LinkedIn: [vishal-shaw-m200605](https://www.linkedin.com/in/vishal-shaw-m200605)
