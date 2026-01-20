const chatEl = document.getElementById("chat");
const formEl = document.getElementById("composer");
const inputEl = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const statusEl = document.getElementById("status");

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const MODEL = import.meta.env.VITE_OPENAI_MODEL || "gpt-4o-mini";

/**
 * ✅ 점심 메뉴 추천 챗봇 (맥락 유지)
 * - history 배열을 그대로 API에 messages로 보내서 대화 맥락이 이어지게 함
 * - 처음에 선호(매운/국물/가격/시간/알레르기 등) 물어보도록 유도
 */
const history = [
  {
    role: "system",
    content: [
      "너는 '점심 메뉴 추천 챗봇'이야.",
      "사용자가 점심 메뉴를 정하는 데 도움을 주고, 대답은 한국어로 간결하게 해.",
      "매번 바로 하나만 고르기보다, 먼저 사용자의 상황을 1~2개 질문으로 확인하고(예: 매운 거 가능?, 예산, 혼밥/같이, 국물/면/밥, 다이어트 여부),",
      "그 다음 3가지 후보를 제안한 뒤, 사용자가 고르기 쉽게 '오늘은 이거' 1개를 추천해.",
      "사용자가 조건을 주면 그 조건을 최우선으로 반영해.",
      "사용자가 '아무거나'라고 하면 무난한 선택 + 도전적인 선택 + 가벼운 선택 3개로 제안해.",
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

  // ✅ Chat Completions로 messages(=history)를 그대로 보내 맥락 유지
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: history,
      temperature: 0.8,
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
      "⚠️ API 호출에 실패했어요.\n\n- 브라우저 CORS 차단일 수 있어요\n- API 키가 없거나 유효하지 않을 수 있어요\n- 네트워크/권한 문제일 수 있어요\n\n자세한 오류: " +
        (err?.message || String(err))
    );
    setBusy(false, "API 호출 실패 (콘솔도 확인해봐)");
    console.error(err);
  }
});

// ✅ 첫 안내 메시지(점심봇 톤으로)
addBubble(
  "bot",
  "점심 뭐 먹을지 같이 정해볼까? 😋\n1) 매운 거 가능해?\n2) 오늘 예산/상황(혼밥/같이, 시간 여유) 알려줘!"
);
history.push({
  role: "assistant",
  content:
    "점심 뭐 먹을지 같이 정해볼까? 😋\n1) 매운 거 가능해?\n2) 오늘 예산/상황(혼밥/같이, 시간 여유) 알려줘!",
});
