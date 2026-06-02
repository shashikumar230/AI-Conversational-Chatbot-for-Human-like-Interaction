

# 🤖 Aspo AI Chat Assistant

A modern AI-powered chatbot built with Flask, Groq LLM (Llama 3.3 70B), SQLite, and a premium ChatGPT-style interface.
<img width="1906" height="938" alt="aspo" src="https://github.com/user-attachments/assets/bca8b14c-3613-4aa7-a774-094e70c44292" />

---

# 🚀 Folder Structure

```text
AspoAI/
├── app.py                ← Main Flask server
├── chroma_helper.py      ← Local data search engine
├── knowledge.json        ← Keyword-based Q&A database
├── requirements.txt      ← Required dependencies
│
├── chroma_data/          ← Custom knowledge files
│   ├── about.txt
│   ├── products.txt
│   ├── faq.txt
│   ├── services.txt
│   └── any_other_file.txt
│
├── templates/
│   └── index.html
│
├── static/
│   ├── script.js
│   └── style.css
│
├── chats.db              ← SQLite database
└── README.md
```

---
# ⚡ Features

## 🎨 Modern Interface

- ChatGPT-inspired design
- Responsive layout
- Dark & Light mode
- Animated UI effects
- Glassmorphism design
- Mobile-friendly interface

## 💬 Conversation Management

- Create unlimited chats
- Rename conversations
- Delete conversations
- Automatic chat titles
- Conversation previews
- Persistent history

## 🧠 AI Capabilities

- Powered by Groq Llama 3.3 70B
- Natural language understanding
- Context-aware responses
- Code generation
- Bug fixing assistance
- Technical explanations
- Content writing
- Summarization
- Question answering

## 📚 Knowledge Base

- knowledge.json support
- Custom FAQ system
- Business information storage
- Fast keyword matching
- Local knowledge retrieval

## 🔍 Smart Data Search

- Reads all .txt files from chroma_data/
- Searches company data instantly
- Uses local documents before AI
- Reduces API usage
- Faster responses

## 📝 Markdown Support

- Headers
- Lists
- Tables
- Blockquotes
- Code blocks
- Syntax highlighting

## 💻 Developer Features

- Flask backend
- REST API architecture
- SQLite storage
- Session management
- Modular code structure
- Easy deployment

<img width="1894" height="930" alt="aspo1" src="https://github.com/user-attachments/assets/ad455c34-3296-4d9b-adbb-1a616f2e3e11" />
---

# 🏗️ System Workflow

```text
User Question
      │
      ▼
Search chroma_data/
      │
      ▼
Search knowledge.json
      │
      ▼
Groq LLM (Llama 3.3 70B)
      │
      ▼
Final Response
```

---

# 📦 Installation

## Step 1: Clone Project

```bash
git clone https://github.com/yourusername/aspo-ai.git
cd aspo-ai
```

## Step 2: Install Dependencies

```bash
pip install -r requirements.txt
```

## Step 3: Add Groq API Key

Open:

```python
app.py
```

Replace:

```python
groq_client = Groq(
    api_key="YOUR_GROQ_API_KEY"
)
```

## Step 4: Run Server

```bash
python app.py
```

## Step 5: Open Browser

```text
http://localhost:5000
```

---

# 📡 API Endpoints

## Create Chat

```http
POST /chats
```

## Get Chats

```http
GET /chats
```

## Rename Chat

```http
PATCH /chats/<chat_id>
```

## Delete Chat

```http
DELETE /chats/<chat_id>
```

## Get Messages

```http
GET /chats/<chat_id>/messages
```

## Send Message

```http
POST /chats/<chat_id>/messages
```

## Get Knowledge

```http
GET /knowledge
```

## Add Knowledge

```http
POST /knowledge
```

---

# 🗄 Database Schema

## chats Table

| Column | Type |
|----------|----------|
| id | TEXT |
| user_id | TEXT |
| title | TEXT |
| preview | TEXT |
| created_at | TEXT |
| updated_at | TEXT |

## messages Table

| Column | Type |
|----------|----------|
| id | INTEGER |
| chat_id | TEXT |
| role | TEXT |
| content | TEXT |
| created_at | TEXT |

---

# 📁 Adding Custom Data

Place your files inside:

```text
chroma_data/
```

Example:

```text
about.txt
products.txt
services.txt
faq.txt
company.txt
```

Example Content:

```text
Aspo AI is an advanced AI assistant platform developed to provide intelligent responses and document-based search.
```

The chatbot will automatically search these files before calling the AI model.

---

# 🔒 Security Recommendations

Before production deployment:

- Move API keys to environment variables
- Disable debug mode
- Change Flask secret key
- Enable HTTPS
- Add user authentication
- Add rate limiting
- Secure admin APIs

---

# 🌟 Future Roadmap

- PDF Chat
- Image Analysis
- Voice Assistant
- Speech-to-Text
- Text-to-Speech
- Multi-language Support
- Web Search
- File Upload Support
- User Accounts
- OAuth Login
- Chat Sharing
- AI Agents
- Streaming Responses
- OpenAI Support
- Gemini Support
- Claude Support

---

# 🛠 Tech Stack

### Backend

- Python
- Flask
- SQLite
- Groq API

### Frontend

- HTML5
- CSS3
- JavaScript

### AI

- Groq
- Llama 3.3 70B
- Local Knowledge Retrieval

---


# 👨‍💻 Developed By

### Aspo AI Team

Building intelligent AI experiences with Flask, Groq, and modern web technologies.

⭐ Star the repository if you like this project.
```
<img width="1906" height="938" alt="aspo" src="https://github.com/user-attachments/assets/ac279f91-f614-47a3-9538-4b8e30d792d2" />

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
<img width="1885" height="930" alt="aspo2" src="https://github.com/user-attachments/assets/32677e8f-faea-4229-9c80-9f6beb2add82" />






