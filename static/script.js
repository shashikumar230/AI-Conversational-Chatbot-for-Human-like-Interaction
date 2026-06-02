// ═══════════════════════════════════════════════
// Aspo AI — Frontend Logic v4.0
// ═══════════════════════════════════════════════

let isWaiting = false;
let isDark = true;
let currentChatId = null;
let chats = [];
let lastSource = "";

// ─── Marked config ───────────────────────────
marked.setOptions({
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) return hljs.highlight(code, { language: lang }).value;
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true
});

// ═══════════════════════════════════════════════
// CHAT LIST
// ═══════════════════════════════════════════════

async function loadChatList() {
  const res = await fetch("/chats");
  const data = await res.json();
  chats = data.chats || [];
  renderChatList();
}

function renderChatList() {
  const list = document.getElementById("chat-list");
  list.innerHTML = "";

  if (chats.length === 0) {
    list.innerHTML = `<div class="chat-list-empty">No conversations yet.<br>Start a new one above.</div>`;
    return;
  }

  chats.forEach(chat => {
    const item = document.createElement("div");
    item.classList.add("chat-item");
    if (chat.id === currentChatId) item.classList.add("active");
    item.dataset.id = chat.id;

    const body = document.createElement("div");
    body.classList.add("chat-item-body");

    const title = document.createElement("div");
    title.classList.add("chat-item-title");
    title.textContent = chat.title || "New Conversation";

    const preview = document.createElement("div");
    preview.classList.add("chat-item-preview");
    preview.textContent = chat.preview || "No messages yet";

    body.appendChild(title);
    body.appendChild(preview);

    const del = document.createElement("button");
    del.classList.add("chat-item-delete");
    del.title = "Delete";
    del.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><path d="M18 6L6 18M6 6l12 12"/></svg>`;
    del.onclick = e => { e.stopPropagation(); deleteChatById(chat.id); };

    item.appendChild(body);
    item.appendChild(del);
    item.onclick = () => switchToChat(chat.id);

    list.appendChild(item);
  });
}

// ═══════════════════════════════════════════════
// CREATE / SWITCH / DELETE
// ═══════════════════════════════════════════════

async function createNewChat() {
  const res = await fetch("/chats", { method: "POST" });
  const chat = await res.json();
  chats.unshift(chat);
  renderChatList();
  await switchToChat(chat.id);
}

async function switchToChat(chatId) {
  currentChatId = chatId;

  document.querySelectorAll(".chat-item").forEach(el => {
    el.classList.toggle("active", el.dataset.id === chatId);
  });

  const chat = chats.find(c => c.id === chatId);
  document.getElementById("chat-title-display").textContent = chat ? chat.title : "Conversation";
  document.getElementById("rename-btn").style.display = "inline-flex";
  document.getElementById("delete-btn").style.display = "inline-flex";
  cancelRename();

  const chatbox = document.getElementById("chatbox");
  chatbox.innerHTML = "";

  const res = await fetch(`/chats/${chatId}/messages`);
  const data = await res.json();
  const messages = data.messages || [];

  if (messages.length === 0) {
    showWelcome();
  } else {
    messages.forEach(m => appendMessage(m.role === "user" ? "user" : "bot", m.content));
  }
}

async function deleteChatById(chatId) {
  if (!confirm("Delete this conversation?")) return;
  await fetch(`/chats/${chatId}`, { method: "DELETE" });
  chats = chats.filter(c => c.id !== chatId);

  if (currentChatId === chatId) {
    currentChatId = null;
    document.getElementById("chat-title-display").textContent = "New Conversation";
    document.getElementById("rename-btn").style.display = "none";
    document.getElementById("delete-btn").style.display = "none";
    cancelRename();
    showWelcome();
    setSourceChip("", "");
  }
  renderChatList();
}

async function deleteCurrentChat() {
  if (!currentChatId) return;
  await deleteChatById(currentChatId);
}

// ═══════════════════════════════════════════════
// RENAME
// ═══════════════════════════════════════════════

function startRename() {
  document.getElementById("title-static").style.display = "none";
  const bar = document.getElementById("rename-bar");
  bar.style.display = "flex";
  const input = document.getElementById("rename-input");
  input.value = document.getElementById("chat-title-display").textContent;
  input.focus();
  input.select();
}

function cancelRename() {
  document.getElementById("rename-bar").style.display = "none";
  document.getElementById("title-static").style.display = "flex";
}

async function submitRename() {
  if (!currentChatId) return cancelRename();
  const input = document.getElementById("rename-input");
  const newTitle = input.value.trim();
  if (!newTitle) return cancelRename();

  const res = await fetch(`/chats/${currentChatId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: newTitle })
  });
  const data = await res.json();
  cancelRename();

  const chat = chats.find(c => c.id === currentChatId);
  if (chat) chat.title = data.title;
  document.getElementById("chat-title-display").textContent = data.title;
  renderChatList();
}

// ═══════════════════════════════════════════════
// SEND MESSAGE
// ═══════════════════════════════════════════════

async function sendMessage() {
  if (isWaiting) return;

  const input = document.getElementById("user-input");
  const message = input.value.trim();
  if (!message) return;

  // Auto-create chat if none
  if (!currentChatId) {
    const res = await fetch("/chats", { method: "POST" });
    const chat = await res.json();
    chats.unshift(chat);
    currentChatId = chat.id;
    document.getElementById("chat-title-display").textContent = chat.title;
    document.getElementById("rename-btn").style.display = "inline-flex";
    document.getElementById("delete-btn").style.display = "inline-flex";
    renderChatList();
  }

  // Remove welcome
  const welcome = document.getElementById("welcome-screen");
  if (welcome) welcome.remove();

  appendMessage("user", message);
  input.value = "";
  autoResize(input);
  updateCharCount();

  const typingEl = showTyping();
  isWaiting = true;
  document.getElementById("send-btn").disabled = true;

  try {
    const res = await fetch(`/chats/${currentChatId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await res.json();
    removeTyping(typingEl);

    if (data.error) {
      appendMessage("bot", data.reply, "", "error", "⚠️ Error");
    } else {
      appendMessage("bot", data.reply, data.timestamp || "", data.source || "llm", data.source_label || "✦ AI");
      setSourceChip(data.source, data.source_label);

      const chat = chats.find(c => c.id === currentChatId);
      if (chat) {
        chat.title = data.title || chat.title;
        chat.preview = message.substring(0, 80);
        chats = [chat, ...chats.filter(c => c.id !== currentChatId)];
      }
      document.getElementById("chat-title-display").textContent = data.title || "Conversation";
      renderChatList();
    }

  } catch (err) {
    removeTyping(typingEl);
    appendMessage("bot", "⚠️ Could not connect to the server. Please try again.");
  }

  isWaiting = false;
  document.getElementById("send-btn").disabled = false;
  input.focus();
}

// ═══════════════════════════════════════════════
// DOM HELPERS
// ═══════════════════════════════════════════════

function showWelcome() {
  const chatbox = document.getElementById("chatbox");
  chatbox.innerHTML = "";
  const el = document.createElement("div");
  el.className = "welcome-screen";
  el.id = "welcome-screen";
  el.innerHTML = `
    <div class="welcome-glyph">
      <div class="welcome-ring">
        <span class="welcome-icon-inner">S</span>
      </div>
    </div>
    <h1 class="welcome-headline">How can I help?</h1>
    <p class="welcome-sub">Ask anything </p>
    <div class="rag-pill">
      <span>●</span> Aspo AI + Groq LLM
    </div>
    <div class="chips">
      <button class="chip" onclick="useChip(this)">What is Aspo AI?</button>
      <button class="chip" onclick="useChip(this)">Write a Python function</button>
      <button class="chip" onclick="useChip(this)">Explain RAG in simple terms</button>
      <button class="chip" onclick="useChip(this)">Summarize a topic for me</button>
      <button class="chip" onclick="useChip(this)">Fix my code</button>
      <button class="chip" onclick="useChip(this)">Help me write an email</button>
    </div>
  `;
  chatbox.appendChild(el);
}

function appendMessage(role, text, timestamp = "", source = "", sourceLabel = "") {
  const chatbox = document.getElementById("chatbox");

  const row = document.createElement("div");
  row.classList.add("message-row", role);

  const avatar = document.createElement("div");
  avatar.classList.add("avatar", role === "bot" ? "bot-avatar" : "user-avatar");
  avatar.textContent = role === "bot" ? "✦" : "U";

  const col = document.createElement("div");
  col.classList.add("bubble-col");

  const bubble = document.createElement("div");
  bubble.classList.add("bubble", role === "bot" ? "bot-bubble" : "user-bubble");

  if (role === "bot") {
    bubble.innerHTML = marked.parse(text);
    bubble.querySelectorAll("pre").forEach(pre => {
      const btn = document.createElement("button");
      btn.className = "copy-code-btn";
      btn.textContent = "copy";
      btn.onclick = () => {
        navigator.clipboard.writeText(pre.querySelector("code")?.innerText || "").then(() => {
          btn.textContent = "copied!";
          setTimeout(() => btn.textContent = "copy", 2000);
        });
      };
      pre.appendChild(btn);
    });
    bubble.querySelectorAll("pre code").forEach(b => hljs.highlightElement(b));
  } else {
    bubble.textContent = text;
  }

  col.appendChild(bubble);

  // Meta row
  if (role === "bot" && (source || timestamp)) {
    const meta = document.createElement("div");
    meta.className = "msg-meta";

    if (source && source !== "user") {
      const badge = document.createElement("span");
      badge.className = `source-badge ${source === "data_file" ? "badge-kb" : "badge-ai"}`;
      badge.textContent = sourceLabel || (source === "data_file" ? "📄 KB" : "✦ AI");
      meta.appendChild(badge);
    }

    if (timestamp) {
      const ts = document.createElement("span");
      ts.className = "msg-time";
      ts.textContent = timestamp;
      meta.appendChild(ts);
    }

    col.appendChild(meta);
  }

  row.appendChild(avatar);
  row.appendChild(col);
  chatbox.appendChild(row);
  chatbox.scrollTop = chatbox.scrollHeight;
}

function showTyping() {
  const chatbox = document.getElementById("chatbox");
  const row = document.createElement("div");
  row.className = "typing-row";

  const avatar = document.createElement("div");
  avatar.classList.add("avatar", "bot-avatar");
  avatar.textContent = "N";

  const bubble = document.createElement("div");
  bubble.className = "typing-bubble";
  bubble.innerHTML = "<span></span><span></span><span></span>";

  row.appendChild(avatar);
  row.appendChild(bubble);
  chatbox.appendChild(row);
  chatbox.scrollTop = chatbox.scrollHeight;
  return row;
}

function removeTyping(el) {
  if (el?.parentNode) el.parentNode.removeChild(el);
}

function setSourceChip(source, label) {
  const chip = document.getElementById("source-chip");
  const text = document.getElementById("source-chip-text");
  if (!source) { chip.style.display = "none"; return; }
  chip.style.display = "inline-flex";
  chip.className = `source-chip${source === "data_file" ? " kb" : ""}`;
  text.textContent = label || (source === "data_file" ? "📄 KB" : "✦ AI");
}

// ═══════════════════════════════════════════════
// UI UTILS
// ═══════════════════════════════════════════════

function useChip(btn) {
  const input = document.getElementById("user-input");
  input.value = btn.textContent;
  input.focus();
  autoResize(input);
  updateCharCount();
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("hidden");
}

function toggleTheme() {
  isDark = !isDark;
  document.body.classList.toggle("light", !isDark);
  document.getElementById("theme-icon").textContent = isDark ? "🌙" : "☀️";
  document.getElementById("theme-label").textContent = isDark ? "Dark" : "Light";
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

function autoResize(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 160) + "px";
}

function updateCharCount() {
  const input = document.getElementById("user-input");
  document.getElementById("char-count").textContent = `${input.value.length} / 4000`;
}

// ═══════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", async () => {
  const input = document.getElementById("user-input");

  input.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  input.addEventListener("input", function() { autoResize(this); updateCharCount(); });

  document.getElementById("rename-input").addEventListener("keydown", e => {
    if (e.key === "Enter") submitRename();
    if (e.key === "Escape") cancelRename();
  });

  // Restore theme
  const saved = localStorage.getItem("theme");
  if (saved === "light") {
    isDark = false;
    document.body.classList.add("light");
    document.getElementById("theme-icon").textContent = "☀️";
    document.getElementById("theme-label").textContent = "Light";
  }

  await loadChatList();

  if (chats.length > 0) {
    await switchToChat(chats[0].id);
  } else {
    showWelcome();
  }

  input.focus();
});