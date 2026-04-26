# NewsDigest AI 📰
Real-time news summarization web application powered by a fine-tuned T5 Transformer model via the HuggingFace Inference API.

---

## 🚀 Features
- Fetches **live news** using the GNews API
- Generates **concise summaries** using a **fine-tuned T5-small** model via HuggingFace Inference API
- Clean and responsive UI
- Fully containerized using **Docker**
- Easily deployable to **Render**

---

## 🧠 Model
This project uses a **fine-tuned T5-small model** specifically trained for **news summarization**.

Model Repository (Hugging Face):  
https://huggingface.co/VishalShaw/t5-small-finetuned-news

---

## 🏗️ Tech Stack

| Layer | Technology |
|------|------------|
| Backend | Flask + Gunicorn |
| Model Inference | HuggingFace Inference API (T5-small) |
| Frontend | HTML + TailwindCSS + JavaScript |
| News Source | GNews REST API |
| Deployment | Docker + Render |

---

## 📁 Project Structure
```
NewsDigestAI/
│── src/
│ ├── app.py              # Flask API + HuggingFace inference
│ ├── fetch_news.py        # Fetches news via GNews API
│ ├── templates/           # Frontend HTML (index.html)
│ └── static/              # CSS + JS (style.css, script.js)
│
│── Dockerfile             # Docker image build config
│── .dockerignore          # Files to ignore during Docker build
│── requirements.txt       # Python dependencies
│── README.md              # Project documentation
```

---

## 🔧 Setup (Local Development)

1. Clone the repository:
```bash
git clone https://github.com/Vishal-Shaw20/NewsDigestAI.git
cd NewsDigestAI
```
2. Install dependencies:
```bash
pip install -r requirements.txt
```
3. Create a `.env` file in the project root with your API keys:
```
NEWS_API_KEY=your_gnews_api_key_here
HF_API_TOKEN=your_huggingface_token_here
```
- Get a GNews API key at https://gnews.io
- Get a HuggingFace token at https://huggingface.co/settings/tokens (free, read-only)

4. Run the application:
```bash
cd src
python app.py
```
5. Open `http://localhost:5000` in your browser.

---

## ✨ Author

### **Vishal Shaw**  

GitHub: [Vishal-Shaw](https://github.com/Vishal-Shaw20)  
LinkedIn: *www.linkedin.com/in/vishal-shaw-m200605*  
