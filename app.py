from flask import Flask, render_template, request, jsonify, session
from groq import Groq
import uuid
import os
import sqlite3
import json
from datetime import datetime
from chroma_helper import answer_from_data

app = Flask(__name__)
app.secret_key = "your-secret-key-change-this"

PROVIDER = "groq"

groq_client = Groq(
    api_key="your api key here"
)

DB_PATH = "chats.db"
KNOWLEDGE_PATH = "knowledge.json"

SYSTEM_PROMPT = """You are a helpful, smart, and friendly AI assistant.
You provide clear, accurate, and concise answers.
You use markdown formatting when helpful (bold, bullet points, code blocks).
You are polite, professional, and empathetic."""


# ==========================
# Old Knowledge Base (keywords)
# ==========================

def load_knowledge():
    if not os.path.exists(KNOWLEDGE_PATH):
        return []
    try:
        with open(KNOWLEDGE_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data.get("entries", [])
    except Exception:
        return []


def search_knowledge(user_message):
    entries = load_knowledge()
    if not entries:
        return None
    msg_lower = user_message.lower()
    best_match = None
    best_score = 0
    for entry in entries:
        keywords = entry.get("keywords", [])
        score = sum(1 for kw in keywords if kw.lower() in msg_lower)
        if score > best_score:
            best_score = score
            best_match = entry
    if best_score >= 1 and best_match:
        return best_match.get("answer")
    return None


# ==========================
# Database
# ==========================

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS chats (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                title TEXT NOT NULL DEFAULT 'New Chat',
                preview TEXT DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chat_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(chat_id) REFERENCES chats(id) ON DELETE CASCADE
            )
        """)
        conn.commit()


init_db()


def now_iso():
    return datetime.utcnow().isoformat()


def get_user_id():
    if "user_id" not in session:
        session["user_id"] = str(uuid.uuid4())
    return session["user_id"]


def chat_belongs_to_user(chat_id, user_id):
    with get_db() as conn:
        row = conn.execute(
            "SELECT id FROM chats WHERE id=? AND user_id=?", (chat_id, user_id)
        ).fetchone()
    return row is not None


def get_messages(chat_id):
    with get_db() as conn:
        rows = conn.execute(
            "SELECT role, content FROM messages WHERE chat_id=? ORDER BY id ASC", (chat_id,)
        ).fetchall()
    return [{"role": r["role"], "content": r["content"]} for r in rows]


# ==========================
# Routes
# ==========================

@app.route("/")
def index():
    get_user_id()
    return render_template("index.html")


@app.route("/chats", methods=["GET"])
def list_chats():
    user_id = get_user_id()
    with get_db() as conn:
        rows = conn.execute(
            "SELECT id, title, preview, created_at, updated_at FROM chats WHERE user_id=? ORDER BY updated_at DESC",
            (user_id,)
        ).fetchall()
    return jsonify({"chats": [dict(r) for r in rows]})


@app.route("/chats", methods=["POST"])
def create_chat():
    user_id = get_user_id()
    chat_id = str(uuid.uuid4())
    ts = now_iso()
    with get_db() as conn:
        conn.execute(
            "INSERT INTO chats (id, user_id, title, preview, created_at, updated_at) VALUES (?,?,?,?,?,?)",
            (chat_id, user_id, "New Chat", "", ts, ts)
        )
        conn.commit()
    return jsonify({"id": chat_id, "title": "New Chat", "preview": "", "created_at": ts, "updated_at": ts})


@app.route("/chats/<chat_id>", methods=["PATCH"])
def rename_chat(chat_id):
    user_id = get_user_id()
    if not chat_belongs_to_user(chat_id, user_id):
        return jsonify({"error": "Not found"}), 404
    data = request.get_json()
    title = data.get("title", "").strip() or "Untitled"
    ts = now_iso()
    with get_db() as conn:
        conn.execute("UPDATE chats SET title=?, updated_at=? WHERE id=?", (title, ts, chat_id))
        conn.commit()
    return jsonify({"status": "ok", "title": title})


@app.route("/chats/<chat_id>", methods=["DELETE"])
def delete_chat(chat_id):
    user_id = get_user_id()
    if not chat_belongs_to_user(chat_id, user_id):
        return jsonify({"error": "Not found"}), 404
    with get_db() as conn:
        conn.execute("DELETE FROM messages WHERE chat_id=?", (chat_id,))
        conn.execute("DELETE FROM chats WHERE id=?", (chat_id,))
        conn.commit()
    return jsonify({"status": "deleted"})


@app.route("/chats/<chat_id>/messages", methods=["GET"])
def get_chat_messages(chat_id):
    user_id = get_user_id()
    if not chat_belongs_to_user(chat_id, user_id):
        return jsonify({"error": "Not found"}), 404
    return jsonify({"messages": get_messages(chat_id)})


@app.route("/chats/<chat_id>/messages", methods=["POST"])
def send_message(chat_id):
    user_id = get_user_id()
    if not chat_belongs_to_user(chat_id, user_id):
        return jsonify({"error": "Not found"}), 404

    data = request.get_json()
    user_message = data.get("message", "").strip()
    if not user_message:
        return jsonify({"reply": "Please send a message.", "error": True})

    ts = now_iso()
    with get_db() as conn:
        conn.execute(
            "INSERT INTO messages (chat_id, role, content, created_at) VALUES (?,?,?,?)",
            (chat_id, "user", user_message, ts)
        )
        conn.commit()

    reply = None
    source = "ai"

    # ──────────────────────────────────────────────
    # STEP 1: chroma_data/ se seedha data search
    # ──────────────────────────────────────────────
    reply, source = answer_from_data(user_message, groq_client)

    # ──────────────────────────────────────────────
    # STEP 2: knowledge.json (keyword-based) fallback
    # ──────────────────────────────────────────────
    if not reply:
        reply = search_knowledge(user_message)
        if reply:
            source = "knowledge"

    # ──────────────────────────────────────────────
    # STEP 3: Groq AI model fallback
    # ──────────────────────────────────────────────
    if not reply:
        history = get_messages(chat_id)[-20:]
        try:
            messages_for_ai = [{"role": "system", "content": SYSTEM_PROMPT}, *history]
            response = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages_for_ai,
                max_tokens=2048
            )
            reply = response.choices[0].message.content
            source = "ai"
        except Exception as e:
            return jsonify({"reply": f"⚠️ Error: {str(e)}", "error": True})

    # ──────────────────────────────────────────────
    # STEP 4: Save & return
    # ──────────────────────────────────────────────
    try:
        ts2 = now_iso()
        with get_db() as conn:
            conn.execute(
                "INSERT INTO messages (chat_id, role, content, created_at) VALUES (?,?,?,?)",
                (chat_id, "assistant", reply, ts2)
            )
            preview = user_message[:80] + ("…" if len(user_message) > 80 else "")
            row = conn.execute("SELECT title FROM chats WHERE id=?", (chat_id,)).fetchone()
            new_title = row["title"]
            if new_title == "New Chat":
                new_title = user_message[:40] + ("…" if len(user_message) > 40 else "")
            conn.execute(
                "UPDATE chats SET preview=?, updated_at=?, title=? WHERE id=?",
                (preview, ts2, new_title, chat_id)
            )
            conn.commit()

        return jsonify({
            "reply": reply,
            "timestamp": datetime.utcnow().strftime("%I:%M %p"),
            "title": new_title,
            "source": source,
            "error": False
        })

    except Exception as e:
        return jsonify({"reply": f"⚠️ Error: {str(e)}", "error": True})


# ==========================
# Knowledge Admin API
# ==========================

@app.route("/knowledge", methods=["GET"])
def get_knowledge():
    return jsonify({"entries": load_knowledge(), "total": len(load_knowledge())})


@app.route("/knowledge", methods=["POST"])
def add_knowledge():
    data = request.get_json()
    for field in ["keywords", "answer"]:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 400
    try:
        kb = json.load(open(KNOWLEDGE_PATH)) if os.path.exists(KNOWLEDGE_PATH) else {"entries": []}
        entries = kb.get("entries", [])
        new_id = max((e.get("id", 0) for e in entries), default=0) + 1
        new_entry = {"id": new_id, "keywords": data["keywords"], "question": data.get("question", ""), "answer": data["answer"]}
        entries.append(new_entry)
        kb["entries"] = entries
        with open(KNOWLEDGE_PATH, "w", encoding="utf-8") as f:
            json.dump(kb, f, ensure_ascii=False, indent=2)
        return jsonify({"status": "added", "entry": new_entry})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
