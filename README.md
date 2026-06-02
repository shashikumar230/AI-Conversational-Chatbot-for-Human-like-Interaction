# AspoAI — Setup Guide

## Folder Structure
```
AspoAI/
├── app.py                ← Main Flask server
├── chroma_helper.py      ← Data search (no extra libs needed)
├── knowledge.json        ← Keyword-based Q&A (optional)
├── requirements.txt      ← Sirf: flask, groq
├── chroma_data/          ← ⭐ APNA DATA YAHAN LIKHO ⭐
│   ├── about.txt
│   ├── products.txt
│   └── (jitni chaaho .txt files)
├── templates/
│   └── index.html
└── static/
    ├── script.js
    └── style.css
```

---

## Install & Run

```bash
# Step 1: Dependencies
pip install -r requirements.txt

# Step 2: Server
python app.py

# Step 3: Browser mein kholo
# http://localhost:5000
```


