/* ============================================================
   SciBot 실험 도우미 챗봇 (Upstage Solar) — 실험 연계
   · 현재 실험/센서/측정 요약을 맥락으로 학생 눈높이 도움
   · 브리지 프록시(키 서버측) 우선, 없으면 직접 호출(키 입력)
   ============================================================ */
(function () {
  "use strict";

  function directChat(messages) {
    var key = localStorage.getItem("scibot_upstage_key");
    var model = localStorage.getItem("scibot_upstage_model") || "solar-pro2";
    if (!key) return Promise.reject(new Error("no-key"));
    return fetch("https://api.upstage.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({ model: model, messages: messages, temperature: 0.4 })
    }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (d) { return d.choices[0].message.content; });
  }

  // 서버 프록시(키는 서버 보관) — 배포 사이트에서 브리지 없이 동작
  function serverChat(message, hist, context) {
    var url = (location.hostname === "kfcman.link") ? "/api/scibot/chat" : "https://kfcman.link/api/scibot/chat";
    return fetch(url, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message, history: hist, context: context })
    }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (res.ok && res.j.reply) return res.j.reply;
        throw new Error(res.j.error || "server error");
      });
  }

  // 우선순위: 로컬 브리지(연결 시) → 서버 프록시 → 직접 키
  function respond(text, ctx) {
    var R = window.SciBotRobot;
    if (R && R.connected && R.ai) return R.chatViaBridge([systemPrompt()].concat(history));
    return serverChat(text, history.slice(0, -1), ctx).catch(function (e) {
      if (localStorage.getItem("scibot_upstage_key")) return directChat([systemPrompt()].concat(history));
      throw e;
    });
  }

  function systemPrompt() {
    var c = (window.SciBotContext && window.SciBotContext()) || {};
    var lines = [
      "너는 SciBot 지능형 과학교실의 '실험 도우미'야.",
      "초등·중학생이 로봇 센서로 측정·탐구하는 과학 실험을 돕는다.",
      "친절한 존댓말로, 학생 눈높이에서 쉽고 짧게(3~5문장) 설명해.",
      "정답만 주지 말고 스스로 생각하도록 질문도 섞어. 안전과 예의를 지켜.",
      "지금 학생이 하는 실험 맥락:"
    ];
    if (c.experiment) lines.push("- 실험: " + c.experiment + (c.goal ? " (목표: " + c.goal + ")" : ""));
    if (c.sci) lines.push("- 관련 과학 개념: " + c.sci);
    if (c.sensor) lines.push("- 사용 센서: " + c.sensor + (c.robot ? " / " + c.robot : ""));
    if (c.stats) lines.push("- 측정 요약: " + c.stats.n + "회, 최소 " + c.stats.min + ", 최대 " + c.stats.max + ", 평균 " + c.stats.avg + (c.unit || ""));
    if (c.predict != null) lines.push("- 학생의 예측값: " + c.predict + (c.unit || ""));
    return { role: "system", content: lines.join("\n") };
  }

  var history = [];   // {role, content}

  /* ---------- UI ---------- */
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  var fab, win, msgsEl, input;

  function addMsg(role, text) {
    var m = el("div", "chat-msg chat-" + role);
    m.textContent = text;
    msgsEl.appendChild(m);
    msgsEl.scrollTop = msgsEl.scrollHeight;
    return m;
  }

  function greet() {
    var c = (window.SciBotContext && window.SciBotContext()) || {};
    var hi = c.experiment
      ? ("안녕하세요! ‘" + c.experiment + "’ 실험을 도와드릴게요. 무엇이든 물어보세요 🙂")
      : "안녕하세요! 측정·실험에 대해 궁금한 점을 물어보세요 🙂";
    addMsg("bot", hi);
  }

  function setKeyFlow() {
    var cur = localStorage.getItem("scibot_upstage_key") || "";
    var key = prompt("Upstage API 키를 입력하세요. (직접 호출용 · 브라우저에만 저장)\n※ 권장: 브리지에 --upstage-key 로 설정하면 키가 노출되지 않습니다.", cur);
    if (key === null) return;
    key = key.trim();
    if (key) { localStorage.setItem("scibot_upstage_key", key); addMsg("bot", "API 키를 저장했어요. 이제 질문해 보세요!"); }
    else { localStorage.removeItem("scibot_upstage_key"); addMsg("bot", "저장된 API 키를 지웠어요."); }
  }

  function send() {
    var text = input.value.trim();
    if (!text) return;
    input.value = "";
    addMsg("user", text);
    history.push({ role: "user", content: text });
    if (history.length > 12) history = history.slice(-12);

    var thinking = addMsg("bot", "생각 중…");
    var ctx = (window.SciBotContext && window.SciBotContext()) || {};
    respond(text, ctx).then(function (reply) {
      thinking.textContent = reply;
      history.push({ role: "assistant", content: reply });
    }).catch(function (e) {
      var msg = (e && e.message) || "";
      if (msg === "no-key") thinking.textContent = "API 키가 없어요. ⚙ 버튼으로 Upstage 키를 입력하거나 브리지에 설정하세요.";
      else if (/Failed to fetch|HTTP 40|CORS/i.test(msg)) thinking.textContent = "AI 연결에 문제가 있어요. 잠시 후 다시 시도해 주세요.";
      else thinking.textContent = "오류가 발생했어요: " + msg;
    });
  }

  function build() {
    fab = el("button", "chatfab", "🤖");
    fab.title = "실험 도우미";
    document.body.appendChild(fab);

    win = el("div", "chatwin");
    win.innerHTML =
      '<div class="chat-head"><span>🤖 실험 도우미 <small>Solar AI</small></span>' +
      '<span class="chat-actions"><button class="chat-gear" title="API 키 설정">⚙</button>' +
      '<button class="chat-close" title="닫기">×</button></span></div>' +
      '<div class="chat-msgs"></div>' +
      '<div class="chat-input"><input type="text" placeholder="실험이 궁금해요…" /><button class="chat-send">보내기</button></div>';
    document.body.appendChild(win);

    msgsEl = win.querySelector(".chat-msgs");
    input = win.querySelector(".chat-input input");

    fab.addEventListener("click", function () {
      win.classList.toggle("is-open");
      if (win.classList.contains("is-open")) { if (!msgsEl.children.length) greet(); input.focus(); }
    });
    win.querySelector(".chat-close").addEventListener("click", function () { win.classList.remove("is-open"); });
    win.querySelector(".chat-gear").addEventListener("click", setKeyFlow);
    win.querySelector(".chat-send").addEventListener("click", send);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });
  }

  document.addEventListener("DOMContentLoaded", build);
})();
