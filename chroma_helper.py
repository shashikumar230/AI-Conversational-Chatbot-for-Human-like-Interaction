"""
chroma_helper.py
----------------
Koi ChromaDB nahi, koi vector embeddings nahi.
Sirf:
  1. chroma_data/ ke saare .txt files padho
  2. Sab text ek saath Groq ko do
  3. Groq khud samjhega kya relevant hai

Tu bas chroma_data/ mein .txt files mein plain text likhta ja.
"""

import os
import glob

CHROMA_DATA_DIR = "chroma_data"
MAX_CONTEXT_CHARS = 6000  # Groq context limit ke andar raho


def load_all_data():
    """chroma_data/ ke saare .txt files ka content ek string mein."""
    all_text = []
    pattern = os.path.join(CHROMA_DATA_DIR, "**", "*.txt")
    files = glob.glob(pattern, recursive=True)

    if not files:
        return None

    for filepath in sorted(files):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read().strip()
            if content:
                filename = os.path.basename(filepath)
                all_text.append(f"=== {filename} ===\n{content}")
        except Exception:
            pass

    if not all_text:
        return None

    combined = "\n\n".join(all_text)

    # Too long ho to trim karo
    if len(combined) > MAX_CONTEXT_CHARS:
        combined = combined[:MAX_CONTEXT_CHARS] + "\n...(truncated)"

    return combined


def answer_from_data(user_question, groq_client):
    """
    chroma_data/ se answer dhundo.
    Returns: (answer_string, source)
      source = "data" agar mila, "ai" agar nahi
    """
    context = load_all_data()

    if not context:
        # chroma_data/ empty hai ya files nahi hain
        return None, "ai"

    prompt = f"""You are a helpful assistant. You have access to the following knowledge base:

{context}

---

User asked: "{user_question}"

Instructions:
- If the knowledge base contains relevant information to answer this question, answer using ONLY that information.
- Use markdown formatting where helpful.
- If the knowledge base does NOT contain relevant information for this question, reply with exactly this word: NOT_FOUND

Answer:"""

    try:
        resp = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1024,
            temperature=0.2
        )
        answer = resp.choices[0].message.content.strip()

        if "NOT_FOUND" in answer.upper() and len(answer) < 30:
            return None, "ai"

        return answer, "data"

    except Exception as e:
        # API error → AI fallback pe jaane do
        return None, "ai"
