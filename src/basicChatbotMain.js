const chatEl = document.getElementById("chat");
const formEl = document.getElementById("composer");
const inputEl = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const statusEl = document.getElementById("status");

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const MODEL = import.meta.env.VITE_OPENAI_MODEL || "gpt-4o-mini";

const history = [
  {
    role: "system",
    content:
      "You are a helpful assistant. Keep answers concise. If unsure, ask a short follow-up question.",
  },
];

function nowTime() {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function addBubble(role, text) {
  const wrap = document.createElement("div");
  wrap.className = `bubble ${role === "user" ? "user" : "bot"}`;

  const msg = document.createElement("div");
  msg.textContent = text;

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = `${role === "user" ? "You" : "Bot"} • ${nowTime()}`;

  wrap.appendChild(msg);
  wrap.appendChild(meta);
  chatEl.appendChild(wrap);
  chatEl.scrollTop = chatEl.scrollHeight;
}

function setBusy(isBusy, message = "") {
  inputEl.disabled = isBusy;
  sendBtn.disabled = isBusy;
  statusEl.textContent = message;
}

function buildTranscript(messages) {
  // Responses API에서 가장 단순하게 쓰기 위해 "대화 내용"을 텍스트로 합쳐 보냄
  // (정교한 상태 관리는 response_id 등을 쓰는 방식도 있지만, 여기선 최대한 간단하게)
  return messages
    .filter((m) => m.role !== "system")
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");
}

async function callOpenAI(userText) {
  if (!API_KEY) {
    throw new Error(
      "Missing API key. Put VITE_OPENAI_API_KEY in your .env and restart the dev server."
    );
  }

  const transcript = buildTranscript([...history, { role: "user", content: userText }]);

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      input: transcript || userText,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenAI API error (${res.status}): ${errText || res.statusText}`);
  }

  const data = await res.json();

  // Responses API는 output 배열에 텍스트가 들어오는 형태가 일반적이라 이를 최대한 방어적으로 파싱
  const text =
    data?.output_text ||
    data?.output?.[0]?.content?.find?.((c) => c.type === "output_text")?.text ||
    data?.output?.[0]?.content?.[0]?.text ||
    "";

  return text || "(No text output)";
}

formEl.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userText = inputEl.value.trim();
  if (!userText) return;

  addBubble("user", userText);
  history.push({ role: "user", content: userText });
  inputEl.value = "";

  setBusy(true, "Thinking…");

  try {
    const botText = await callOpenAI(userText);
    addBubble("bot", botText);
    history.push({ role: "assistant", content: botText });
    setBusy(false, "");
  } catch (err) {
    // CORS/키 노출/네트워크 문제 등이 여기로 들어올 수 있음
    addBubble(
      "bot",
      "⚠️ API 호출에 실패했어요.\n\n- 브라우저 CORS 차단일 수 있어요\n- API 키가 없거나 유효하지 않을 수 있어요\n- 네트워크/권한 문제일 수 있어요\n\n자세한 오류: " +
        (err?.message || String(err))
    );
    setBusy(false, "API 호출 실패 (콘솔도 확인해봐)");
    console.error(err);
  }
});

// 첫 안내 메시지
addBubble("bot", "Hi! Type something and press Send 🙂");
