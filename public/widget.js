/**
 * T2R (2ndrefind.com) — Embeddable AI Chat Widget
 * Usage on your site (e.g. Hostinger Custom Code):
 *   <script src="https://YOUR-APP-NAME.onrender.com/widget.js"></script>
 * That single line injects the chat bubble + AI chatbot, bottom-right, on every page.
 */
(function () {
  // This script is served from the same Render app as /api/chat,
  // so we can call a relative path — no URL to configure here.
  const API_URL = new URL("/api/chat", document.currentScript.src).toString();

  const style = document.createElement("style");
  style.textContent = `
    #t2r-chat-bubble {
      position: fixed; bottom: 24px; right: 24px; width: 60px; height: 60px;
      border-radius: 50%; background: #111; color: #fff; display: flex;
      align-items: center; justify-content: center; cursor: pointer;
      box-shadow: 0 6px 18px rgba(0,0,0,0.25); z-index: 999999;
      transition: transform 0.15s ease; font-family: Arial, sans-serif;
    }
    #t2r-chat-bubble:hover { transform: scale(1.06); }
    #t2r-chat-bubble svg { width: 26px; height: 26px; }
    #t2r-chat-window {
      position: fixed; bottom: 96px; right: 24px; width: 340px;
      max-width: calc(100vw - 32px); height: 460px; max-height: calc(100vh - 140px);
      background: #fff; border-radius: 14px; box-shadow: 0 10px 40px rgba(0,0,0,0.25);
      display: none; flex-direction: column; overflow: hidden; z-index: 999999;
      font-family: Arial, sans-serif;
    }
    #t2r-chat-window.open { display: flex; }
    #t2r-chat-header {
      background: #111; color: #fff; padding: 14px 16px; font-weight: bold;
      font-size: 15px; display: flex; justify-content: space-between; align-items: center;
    }
    #t2r-chat-close { cursor: pointer; font-size: 18px; line-height: 1; opacity: 0.8; }
    #t2r-chat-close:hover { opacity: 1; }
    #t2r-chat-messages { flex: 1; overflow-y: auto; padding: 12px; background: #f7f7f7; }
    .t2r-msg {
      max-width: 80%; padding: 9px 12px; border-radius: 12px; margin-bottom: 8px;
      font-size: 14px; line-height: 1.4; white-space: pre-wrap;
    }
    .t2r-msg.user { background: #111; color: #fff; margin-left: auto; border-bottom-right-radius: 3px; }
    .t2r-msg.bot { background: #eaeaea; color: #111; margin-right: auto; border-bottom-left-radius: 3px; }
    .t2r-msg.typing { opacity: 0.6; font-style: italic; }
    #t2r-chat-input-row { display: flex; border-top: 1px solid #eee; padding: 8px; gap: 8px; }
    #t2r-chat-input {
      flex: 1; border: 1px solid #ddd; border-radius: 20px; padding: 9px 14px;
      font-size: 14px; outline: none;
    }
    #t2r-chat-send {
      background: #111; color: #fff; border: none; border-radius: 20px;
      padding: 0 16px; cursor: pointer; font-size: 14px;
    }
    #t2r-chat-send:disabled { opacity: 0.5; cursor: default; }
  `;
  document.head.appendChild(style);

  const bubble = document.createElement("div");
  bubble.id = "t2r-chat-bubble";
  bubble.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
  </svg>`;

  const win = document.createElement("div");
  win.id = "t2r-chat-window";
  win.innerHTML = `
    <div id="t2r-chat-header">
      <span>T2R Support</span>
      <span id="t2r-chat-close">✕</span>
    </div>
    <div id="t2r-chat-messages"></div>
    <div id="t2r-chat-input-row">
      <input id="t2r-chat-input" type="text" placeholder="Ask about sizing, shipping..." />
      <button id="t2r-chat-send">Send</button>
    </div>
  `;

  document.body.appendChild(bubble);
  document.body.appendChild(win);

  const messagesEl = win.querySelector("#t2r-chat-messages");
  const inputEl = win.querySelector("#t2r-chat-input");
  const sendBtn = win.querySelector("#t2r-chat-send");
  let history = [];

  function addMessage(role, text) {
    const div = document.createElement("div");
    div.className = "t2r-msg " + (role === "user" ? "user" : "bot");
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;

    addMessage("user", text);
    history.push({ role: "user", content: text });
    inputEl.value = "";
    sendBtn.disabled = true;

    const typingEl = addMessage("bot", "typing...");
    typingEl.classList.add("typing");

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      typingEl.remove();

      if (data.error) {
        addMessage("bot", "Sorry, I'm having trouble connecting right now. Please email the2ndrefind@gmail.com.");
      } else {
        addMessage("bot", data.reply);
        history.push({ role: "assistant", content: data.reply });
      }
    } catch (e) {
      typingEl.remove();
      addMessage("bot", "Sorry, something went wrong. Please try again or email the2ndrefind@gmail.com.");
    } finally {
      sendBtn.disabled = false;
      inputEl.focus();
    }
  }

  function toggle() {
    const nowOpen = !win.classList.contains("open");
    win.classList.toggle("open");
    if (nowOpen) {
      if (history.length === 0) {
        addMessage("bot", "Hey! 👋 Welcome to The 2nd Refind. Ask me about sizing, fabric, shipping, or returns.");
      }
      inputEl.focus();
    }
  }

  bubble.addEventListener("click", toggle);
  win.querySelector("#t2r-chat-close").addEventListener("click", toggle);
  sendBtn.addEventListener("click", sendMessage);
  inputEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter") sendMessage();
  });
})();
