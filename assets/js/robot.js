/* ============================================================
   SciBot Robot Bridge (client) — 다중 로봇
   햄스터S·치즈스틱을 로컬 파이썬 브리지(WebSocket)로 동시에 연결.
   전역 window.SciBotRobot 로 노출.
   ============================================================ */
(function () {
  "use strict";

  var DEFAULT_URL = "ws://localhost:8765";
  var LABELS = { HamsterS: "🐹 햄스터S", CheeseStick: "🧀 치즈스틱" };

  var R = {
    ws: null,
    connected: false,        // 브리지 소켓 연결 여부
    status: {},              // { HamsterS:true, CheeseStick:true } 연결된 로봇
    latest: {},              // { HamsterS:{...센서...}, CheeseStick:{...} }
    ai: false,               // 브리지에 Upstage 키가 설정됨(프록시 가능)
    url: DEFAULT_URL,
    _chatWait: {},
    _chatId: 0,
    _listeners: { status: [], sensors: [], error: [] }
  };

  function emit(ev, data) { (R._listeners[ev] || []).forEach(function (fn) { try { fn(data); } catch (e) {} }); }
  R.on = function (ev, fn) { if (R._listeners[ev]) R._listeners[ev].push(fn); return R; };

  function statusObj() { return { connected: R.connected, robots: R.status }; }
  R.getStatus = statusObj;
  R.isReady = function (name) {
    if (!R.connected) return false;
    if (name) return !!R.status[name];
    return Object.keys(R.status).length > 0;   // 아무 로봇이나 연결됨
  };
  R.latestFor = function (name) { return R.latest[name] || {}; };

  function connectSocket() {
    if (R.connected) return Promise.resolve(statusObj());
    return new Promise(function (resolve, reject) {
      var ws;
      try { ws = new WebSocket(R.url); }
      catch (e) { emit("error", "WebSocket 생성 실패: " + e.message); return reject(e); }
      var settled = false;
      var to = setTimeout(function () { if (!settled) { settled = true; try { ws.close(); } catch (e) {} reject(new Error("연결 시간 초과")); } }, 4000);
      ws.onopen = function () { R.ws = ws; R.connected = true; send({ op: "hello" }); send({ op: "stream", on: true, hz: 10 }); };
      ws.onmessage = function (msg) {
        var m; try { m = JSON.parse(msg.data); } catch (e) { return; }
        handle(m);
        if (!settled && m.op === "status") { settled = true; clearTimeout(to); resolve(statusObj()); }
      };
      ws.onerror = function () {
        emit("error", "브리지에 연결할 수 없습니다. 로컬 브리지(scibot_bridge.py)가 실행 중인지 확인하세요.");
        if (!settled) { settled = true; clearTimeout(to); reject(new Error("연결 실패")); }
      };
      ws.onclose = function () { R.connected = false; R.status = {}; R.latest = {}; R.ws = null; emit("status", statusObj()); };
    });
  }

  function handle(m) {
    switch (m.op) {
      case "status": R.status = m.robots || {}; R.ai = !!m.ai; emit("status", statusObj()); break;
      case "sensors": R.latest = m.data || {}; emit("sensors", R.latest); break;
      case "chat":
        var w = R._chatWait[m.id];
        if (w) { delete R._chatWait[m.id]; m.error ? w.reject(new Error(m.error)) : w.resolve(m.reply); }
        break;
      case "error": emit("error", m.msg || "브리지 오류"); break;
    }
  }

  // 브리지를 통해 Upstage Solar 채팅 프록시. Promise<reply>.
  R.chatViaBridge = function (messages) {
    return new Promise(function (resolve, reject) {
      if (!(R.connected && R.ai)) { reject(new Error("no-bridge-ai")); return; }
      var id = ++R._chatId;
      R._chatWait[id] = { resolve: resolve, reject: reject };
      send({ op: "chat", id: id, messages: messages });
      setTimeout(function () { if (R._chatWait[id]) { delete R._chatWait[id]; reject(new Error("응답 시간 초과")); } }, 45000);
    });
  };

  function send(obj) {
    if (R.ws && R.connected && R.ws.readyState === 1) { R.ws.send(JSON.stringify(obj)); return true; }
    return false;
  }
  R.send = send;

  /* ---- 연결 ---- */
  R.connect = connectSocket;   // 로봇 없이 브리지 소켓만 열기(AI 사용 등)
  R.connectRobot = function (name) {
    return connectSocket().then(function () { send({ op: "connect", robot: name }); });
  };
  R.disconnectRobot = function (name) { send({ op: "disconnect_robot", robot: name }); };
  R.disconnectAll = function () { if (R.ws) { try { R.ws.close(); } catch (e) {} } };

  /* ---- 명령 (robot 지정) ---- */
  R.wheels = function (n, l, r) { return send({ op: "wheels", robot: n, left: l, right: r }); };
  R.moveForward = function (n, cm) { return send({ op: "move_forward", robot: n, cm: cm }); };
  R.moveBackward = function (n, cm) { return send({ op: "move_backward", robot: n, cm: cm }); };
  R.turnLeft = function (n, d) { return send({ op: "turn_left", robot: n, deg: d }); };
  R.turnRight = function (n, d) { return send({ op: "turn_right", robot: n, deg: d }); };
  R.stop = function (n) { return send({ op: "stop", robot: n }); };
  R.rgbs = function (n, r, g, b) { return send({ op: "rgbs", robot: n, r: r, g: g, b: b }); };
  R.note = function (n, p, b) { return send({ op: "note", robot: n, pitch: p, beats: b }); };
  R.beep = function (n) { return send({ op: "beep", robot: n }); };
  // 하위호환: 로봇을 명시 안 하면 첫 연결 로봇 사용(브리지가 처리)
  R.selectRobot = function (n) { return R.connectRobot(n); };

  window.SciBotRobot = R;

  /* ============================================================
     연결 위젯: 로봇별 연결 버튼(구분 표시)
     ============================================================ */
  function mountWidget(el) {
    el.innerHTML =
      '<button class="btn btn--ghost btn--sm rc-btn rc-off" type="button" data-robot="HamsterS">' +
        '<span class="rc-dot"></span>🐹 햄스터S</button>' +
      '<button class="btn btn--ghost btn--sm rc-btn rc-off" type="button" data-robot="CheeseStick">' +
        '<span class="rc-dot"></span>🧀 치즈스틱</button>';

    function paint() {
      el.querySelectorAll(".rc-btn").forEach(function (b) {
        var name = b.dataset.robot;
        var on = R.connected && R.status[name];
        b.classList.toggle("rc-on", !!on);
        b.classList.toggle("rc-off", !on);
        b.lastChild && (b.lastChild.textContent = (name === "HamsterS" ? "🐹 햄스터S" : "🧀 치즈스틱") + (on ? " ✓" : ""));
      });
    }
    R.on("status", paint);
    R.on("error", function (msg) {
      var t = el.querySelector(".rc-err");
      if (!t) { t = document.createElement("span"); t.className = "rc-err"; el.appendChild(t); }
      t.textContent = msg;
      setTimeout(function () { if (t) t.textContent = ""; }, 4000);
    });

    el.querySelectorAll(".rc-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        var name = b.dataset.robot;
        if (R.connected && R.status[name]) { R.disconnectRobot(name); return; }
        b.classList.add("rc-wait");
        R.connectRobot(name).catch(function () {}).finally(function () { b.classList.remove("rc-wait"); paint(); });
      });
    });
    paint();
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-robot-connect]").forEach(mountWidget);
  });
})();
