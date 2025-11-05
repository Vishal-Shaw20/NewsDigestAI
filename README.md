# NewsDigest AI 📰
Real-time news summarization web application powered by a fine-tuned T5 Transformer model.

---

## 🚀 Features
- Fetches **live news** using the GNews API
- Generates **concise summaries** using a **fine-tuned T5-small** model
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
| Model | T5-small (Transformers) + TensorFlow |
| Frontend | HTML + TailwindCSS + JavaScript |
| News Source | GNews REST API |
| Deployment | Docker + Render |

---

## 📁 Project Structure
```
NewsDigestAI/
│── src/
│ ├── app.py # Flask API + model inference
│ ├── fetch_news.py # Fetches news via GNews API
│ ├── templates/ # Frontend HTML (index.html)
│ └── static/ # CSS + JS (style.css, script.js)
│
│── model/ # (Removed in deployment - model now loads from HuggingFace)
│
│── environment.yml # Conda environment definition
│── Dockerfile # Docker image build config
│── .dockerignore # Files to ignore during Docker build
│── README.md # Project documentation
```

---

## 🔧 Setup (Local Development)

1. Clone the repository:
```bash
git clone [https://github.com/Vishal-Shaw20/NewsDigestAI.git](https://github.com/Vishal-Shaw20/NewsDigestAI.git)
cd NewsDigestAI
```
2. Create environment:
```bash
conda env create -f environment.yml
conda activate NewsDigestAI
```
3. Add your API key:
   Create a .env file in the project root (NewsDigestAI/) and add your API key:
```
GNEWS_API_KEY=your_gnews_api_key_here
```
4. Run the application:
```bash
cd src
python app.py
```
5. Open your browser and navigate to `http://localhost:5000` in your web browser.

---

## ✨ Author

### **Vishal Shaw**  

GitHub: [Vishal-Shaw](https://github.com/Vishal-Shaw20)  
LinkedIn: *www.linkedin.com/in/vishal-shaw-m200605*  