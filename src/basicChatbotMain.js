const chatEl = document.getElementById("chat");
const formEl = document.getElementById("composer");
const inputEl = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const statusEl = document.getElementById("status");

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const MODEL = import.meta.env.VITE_OPENAI_MODEL || "gpt-4o-mini";

/**
 * ✅ 중학생 대상 일차방정식 풀이 챗봇
 * - history 배열을 그대로 API에 messages로 보내서 대화 맥락이 이어지게 함
 * - 일차방정식을 단계별로 쉽게 설명하도록 유도
 */
const history = [
  {
    role: "system",
    content: [
      "너는 중학생을 위한 일차방정식 풀이 챗봇이야.",
      "모든 답변은 한국어로 하고, 친절하고 이해하기 쉽게 설명해.",
      "사용자가 입력한 문제를 중학생 눈높이에 맞게 단계별로 풀어줘.",
      "정답만 말하지 말고, 왜 그렇게 푸는지 간단한 이유도 함께 설명해.",
      "풀이에서는 등식의 양변에 같은 수를 더하거나 빼고, 같은 수로 나누는 과정을 분명하게 보여줘.",
      "가능하면 답변 형식은 다음 순서를 따라: 1. 문제 확인 2. 풀이 3. 답",
      "사용자가 식만 입력하면 바로 풀이를 시작해.",
      "사용자가 틀린 풀이를 가져오면 어디가 왜 틀렸는지 짚어줘.",
      "일차방정식이 아니거나 식이 불분명하면, 식을 다시 입력해 달라고 짧고 친절하게 안내해.",
      "설명은 너무 길지 않게 하고, 한 번에 이해할 수 있도록 간단명료하게 해."
    ].join(" "),
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

async function callOpenAI() {
  if (!API_KEY) {
    throw new Error(
      "Missing API key. Put VITE_OPENAI_API_KEY in your .env and restart the dev server."
    );
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: history,
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(
      `OpenAI API error (${res.status}): ${errText || res.statusText}`
    );
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim() || "";
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
    const botText = await callOpenAI();
    addBubble("bot", botText);
    history.push({ role: "assistant", content: botText });
    setBusy(false, "");
  } catch (err) {
    addBubble(
      "bot",
      "⚠️ API 호출에 실패했어요.\n\n잠시 후 다시 시도해 주세요.\n\n자세한 오류: " +
        (err?.message || String(err))
    );
    setBusy(false, "API 호출 실패 (콘솔도 확인해봐)");
    console.error(err);
  }
});

// ✅ 첫 안내 메시지
addBubble(
  "bot",
  "안녕! 나는 일차방정식 풀이를 도와주는 수학 챗봇이야 😊\n문제를 입력해 줘.\n예: 2x + 3 = 11"
);
history.push({
  role: "assistant",
  content:
    "안녕! 나는 일차방정식 풀이를 도와주는 수학 챗봇이야 😊\n문제를 입력해 줘.\n예: 2x + 3 = 11",
});