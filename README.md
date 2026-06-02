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
# Aspo AI Chat Assistant

A modern AI-powered chatbot built with Flask, Groq LLM (Llama 3.3 70B), SQLite, and a premium ChatGPT-style user interface.

# Features
Modern ChatGPT-inspired UI
Multi-chat conversation management
Chat history stored in SQLite
Rename and delete conversations
Dark / Light theme support
Markdown rendering
Syntax highlighting for code blocks
Knowledge Base support (knowledge.json)
RAG support through ChromaDB (answer_from_data)
Groq Llama 3.3 70B integration
Responsive design for desktop and mobile

