/* ============================================================
   SciBot Playground — 블록을 조립해 가상 햄스터S를 실행하는 실습장
   지능형 과학실 연계 · 과학/수학 이론과 연결
   ============================================================ */
(function () {
  "use strict";

  /* ---------- shared: python highlighter ---------- */
  function highlight(code) {
    var esc = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return esc.split("\n").map(function (line) {
      var m = line.match(/^(.*?)(#.*)$/);
      var head = m ? m[1] : line, comment = m ? m[2] : "";
      head = head.replace(/("[^"]*")/g, '<span class="tok-str">$1</span>');
      head = head.replace(/\b(from|import|while|for|in|if|elif|else|and|or|not|True|False|None|range|print|def|return)\b/g, '<span class="tok-kw">$1</span>');
      head = head.replace(/\b(HamsterS|CheeseStick)\b/g, '<span class="tok-cls">$1</span>');
      head = head.replace(/\.([a-zA-Z_]\w*)(?=\()/g, '.<span class="tok-fn">$1</span>');
      head = head.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tok-num">$1</span>');
      if (comment) comment = '<span class="tok-com">' + comment + "</span>";
      return head + comment;
    }).join("\n");
  }

  /* ---------- lookup tables ---------- */
  var COLORS = {
    "빨강": { hex: "#ff4d4d", rgb: [255, 0, 0] },
    "초록": { hex: "#35d06a", rgb: [0, 255, 0] },
    "파랑": { hex: "#4d8bff", rgb: [0, 0, 255] },
    "노랑": { hex: "#ffd23f", rgb: [255, 255, 0] },
    "보라": { hex: "#a86bff", rgb: [128, 0, 255] },
    "하양": { hex: "#ffffff", rgb: [255, 255, 255] },
    "끄기": { hex: "#4a453d", rgb: [0, 0, 0] }
  };
  var NOTES = {
    "도4": { py: "C4", f: 261.63 }, "레4": { py: "D4", f: 293.66 }, "미4": { py: "E4", f: 329.63 },
    "파4": { py: "F4", f: 349.23 }, "솔4": { py: "G4", f: 392.00 }, "라4": { py: "A4", f: 440.00 },
    "시4": { py: "B4", f: 493.88 }, "도5": { py: "C5", f: 523.25 }
  };

  function opt(list, sel) {
    return list.map(function (v) {
      return '<option' + (v === sel ? " selected" : "") + ">" + v + "</option>";
    }).join("");
  }
  function num(id, p, v) { return '<input type="number" data-id="' + id + '" data-p="' + p + '" value="' + v + '">'; }
  function drop(id, p, v, list) { return '<select data-id="' + id + '" data-p="' + p + '">' + opt(list, v) + "</select>"; }

  /* ---------- block specs ---------- */
  var SPECS = {
    forward:  { cat: "motion", def: { n: 15 },
      pal: ["앞으로", "◻ cm 이동하기"], sb: function (id, p) { return "앞으로 " + num(id, "n", p.n) + " cm 이동하기"; },
      py: function (p) { return "hamster.move_forward(" + p.n + ")"; } },
    backward: { cat: "motion", def: { n: 15 },
      pal: ["뒤로", "◻ cm 이동하기"], sb: function (id, p) { return "뒤로 " + num(id, "n", p.n) + " cm 이동하기"; },
      py: function (p) { return "hamster.move_backward(" + p.n + ")"; } },
    turnL:    { cat: "motion", def: { d: 90 },
      pal: ["왼쪽으로", "◻ 도 돌기"], sb: function (id, p) { return "왼쪽으로 " + num(id, "d", p.d) + " 도 돌기"; },
      py: function (p) { return "hamster.turn_left(" + p.d + ")"; } },
    turnR:    { cat: "motion", def: { d: 90 },
      pal: ["오른쪽으로", "◻ 도 돌기"], sb: function (id, p) { return "오른쪽으로 " + num(id, "d", p.d) + " 도 돌기"; },
      py: function (p) { return "hamster.turn_right(" + p.d + ")"; } },
    stop:     { cat: "motion", def: {},
      pal: ["정지하기"], sb: function () { return "정지하기"; },
      py: function () { return "hamster.stop()"; } },
    led:      { cat: "looks", def: { c: "빨강" },
      pal: ["전체 LED를 ◻ 켜기"], sb: function (id, p) { return "전체 LED를 " + drop(id, "c", p.c, Object.keys(COLORS)) + " 켜기"; },
      py: function (p) { var r = COLORS[p.c].rgb; return "hamster.rgbs(" + r[0] + ", " + r[1] + ", " + r[2] + ")"; } },
    note:     { cat: "sound", def: { note: "도4", beat: 1 },
      pal: ["◻ 음을 ◻ 박자 연주하기"], sb: function (id, p) { return drop(id, "note", p.note, Object.keys(NOTES)) + " 음을 " + num(id, "beat", p.beat) + " 박자 연주하기"; },
      py: function (p) { return 'hamster.note("' + NOTES[p.note].py + '", ' + p.beat + ")"; } },
    beep:     { cat: "sound", def: {},
      pal: ["삐 소리내기"], sb: function () { return "삐 소리내기"; },
      py: function () { return "hamster.beep()"; } },
    wait:     { cat: "control", def: { s: 1 },
      pal: ["◻ 초 기다리기"], sb: function (id, p) { return num(id, "s", p.s) + " 초 기다리기"; },
      py: function (p) { return "wait(" + Math.round(p.s * 1000) + ")"; } },
    repeat:   { cat: "control", container: true, def: { n: 4 },
      pal: ["◻ 번 반복하기"], sb: function (id, p) { return num(id, "n", p.n) + " 번 반복하기"; },
      py: function (p) { return "for i in range(" + p.n + "):"; } }
  };

  var CAT_HEX = { motion: "#4c97ff", looks: "#9966ff", sound: "#cf63cf", control: "#ffab19" };

  /* ---------- palette ---------- */
  var PALETTE = [
    { label: "동작", kinds: ["forward", "backward", "turnL", "turnR", "stop"] },
    { label: "LED", kinds: ["led"] },
    { label: "소리", kinds: ["note", "beep"] },
    { label: "제어", kinds: ["wait", "repeat"] }
  ];

  var palEl = document.getElementById("pg-palette");
  palEl.innerHTML = PALETTE.map(function (group) {
    return '<div class="pg-catlabel">' + group.label + "</div>" +
      group.kinds.map(function (k) {
        var s = SPECS[k];
        return '<button class="pg-pal-block sb-block sb--' + s.cat + '" data-kind="' + k + '">' +
          s.pal.join(" ").replace(/◻/g, "▢") + "</button>";
      }).join("");
  }).join("");

  /* ---------- script model ---------- */
  var nodes = [];
  var uid = 1;
  var activeContainer = null; // repeat node id, or null = root

  function makeNode(kind) {
    var s = SPECS[kind];
    var n = { id: uid++, kind: kind, params: Object.assign({}, s.def) };
    if (s.container) n.children = [];
    return n;
  }
  function targetArray() {
    if (activeContainer == null) return nodes;
    var c = findNode(activeContainer);
    return c && c.children ? c.children : nodes;
  }
  function findNode(id, list) {
    list = list || nodes;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
      if (list[i].children) { var f = findNode(id, list[i].children); if (f) return f; }
    }
    return null;
  }
  function removeNode(id, list) {
    list = list || nodes;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) { list.splice(i, 1); return true; }
      if (list[i].children && removeNode(id, list[i].children)) return true;
    }
    return false;
  }

  /* ---------- render script ---------- */
  var scriptEl = document.getElementById("pg-script");

  function renderNode(n) {
    var s = SPECS[n.kind];
    var color = CAT_HEX[s.cat];
    var sb = '<div class="pg-sb" style="background:' + color + '" data-node="' + n.id + '">' +
      s.sb(n.id, n.params) +
      '<button class="pg-del" data-del="' + n.id + '" title="삭제">×</button></div>';
    if (s.container) {
      var inner = n.children.length
        ? n.children.map(function (c) { return '<div class="pg-node">' + renderNode(c) + "</div>"; }).join("")
        : '<div class="pg-repeat__hint">여기에 넣을 블록을 왼쪽에서 눌러 담으세요</div>';
      var active = activeContainer === n.id ? " is-active" : "";
      return '<div class="pg-repeat' + active + '" data-repeat="' + n.id + '">' + sb +
        '<div class="pg-repeat__nest">' + inner + "</div></div>";
    }
    return sb;
  }

  function renderScript() {
    scriptEl.classList.toggle("is-root-active", activeContainer == null);
    if (!nodes.length) {
      scriptEl.innerHTML = '<div class="pg-empty">왼쪽 블록을 눌러 프로그램을 만들어 보세요.<br>만든 프로그램은 ▶ 실행으로 확인합니다.</div>';
    } else {
      scriptEl.innerHTML = nodes.map(function (n) { return '<div class="pg-node">' + renderNode(n) + "</div>"; }).join("");
    }
    renderPython();
  }

  function addBlock(kind) {
    var s = SPECS[kind];
    var node = makeNode(kind);
    if (s.container) { nodes.push(node); activeContainer = node.id; } // repeat always at root, becomes active
    else targetArray().push(node);
    renderScript();
  }

  palEl.addEventListener("click", function (e) {
    var b = e.target.closest(".pg-pal-block");
    if (b) addBlock(b.dataset.kind);
  });

  scriptEl.addEventListener("click", function (e) {
    var del = e.target.closest(".pg-del");
    if (del) { removeNode(+del.dataset.del); if (activeContainer && !findNode(activeContainer)) activeContainer = null; renderScript(); return; }
    var rep = e.target.closest(".pg-repeat");
    if (rep && !e.target.closest(".pg-sb input, .pg-sb select") && e.target.closest(".pg-sb")) {
      var id = +rep.dataset.repeat;
      activeContainer = (activeContainer === id) ? null : id;
      renderScript(); return;
    }
    if (e.target === scriptEl || e.target.classList.contains("pg-empty")) { activeContainer = null; renderScript(); }
  });

  scriptEl.addEventListener("input", function (e) {
    var el = e.target;
    if (el.dataset && el.dataset.id) {
      var node = findNode(+el.dataset.id);
      if (node) {
        var val = el.type === "number" ? (el.value === "" ? 0 : Number(el.value)) : el.value;
        node.params[el.dataset.p] = val;
        renderPython();
      }
    }
  });

  /* ---------- python generation ---------- */
  var pyEl = document.getElementById("pg-pycode");
  function genPy(list, indent) {
    var out = [];
    list.forEach(function (n) {
      var s = SPECS[n.kind];
      out.push(indent + s.py(n.params));
      if (s.container) {
        if (n.children.length) out = out.concat(genPy(n.children, indent + "    "));
        else out.push(indent + "    pass");
      }
    });
    return out;
  }
  function fullPython() {
    var head = "from robomation import *\n\nhamster = HamsterS()\n\n";
    var body = nodes.length ? genPy(nodes, "").join("\n") : "# 블록을 담으면 코드가 나타납니다";
    return head + body;
  }
  function renderPython() { pyEl.innerHTML = highlight(fullPython()); }

  document.getElementById("pg-copy").addEventListener("click", function () {
    var text = fullPython();
    if (navigator.clipboard) navigator.clipboard.writeText(text);
    var btn = this, old = btn.textContent;
    btn.textContent = "복사됨!"; setTimeout(function () { btn.textContent = old; }, 1200);
  });

  /* ============================================================
     SIMULATOR
     ============================================================ */
  var canvas = document.getElementById("pg-canvas");
  var ctx = canvas.getContext("2d");
  var SCALE = 3;               // 1cm = 3px
  var robot, trail, running = false, stopReq = false;

  function resetRobot() {
    var w = canvas._logW, h = canvas._logH;
    robot = { x: w / 2, y: h / 2, heading: 0, led: null };
    trail = [{ x: robot.x, y: robot.y }];
    draw();
    updateReadouts();
  }

  function sizeCanvas() {
    var dpr = window.devicePixelRatio || 1;
    var cssW = Math.round(canvas.clientWidth || canvas.parentElement.clientWidth || 360);
    canvas.width = cssW * dpr; canvas.height = cssW * dpr;
    canvas.style.height = cssW + "px";     // keep square, undo dpr stretch
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvas._logW = cssW; canvas._logH = cssW; // logical coords for all math
  }

  function L(v) { return v; } // logical passthrough

  function draw() {
    var w = canvas._logW, h = canvas._logH;
    ctx.clearRect(0, 0, w, h);
    // grid
    ctx.strokeStyle = "#e6ddca"; ctx.lineWidth = 1;
    for (var g = 0; g <= w; g += 30) {
      ctx.beginPath(); ctx.moveTo(g, 0); ctx.lineTo(g, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, g); ctx.lineTo(w, g); ctx.stroke();
    }
    // start marker
    ctx.fillStyle = "#c9bfa8";
    ctx.beginPath(); ctx.arc(w / 2, h / 2, 4, 0, 7); ctx.fill();
    // trail
    if (trail.length > 1) {
      ctx.strokeStyle = "#f5810a"; ctx.lineWidth = 3; ctx.lineJoin = "round"; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(trail[0].x, trail[0].y);
      for (var i = 1; i < trail.length; i++) ctx.lineTo(trail[i].x, trail[i].y);
      ctx.stroke();
    }
    // robot
    ctx.save();
    ctx.translate(robot.x, robot.y);
    ctx.rotate(robot.heading * Math.PI / 180);
    // body
    ctx.fillStyle = "#ff9f1c"; ctx.strokeStyle = "#c96b00"; ctx.lineWidth = 2;
    roundRect(-13, -13, 26, 26, 7); ctx.fill(); ctx.stroke();
    // direction nose
    ctx.fillStyle = "#c96b00";
    ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(-6, -11); ctx.lineTo(6, -11); ctx.closePath(); ctx.fill();
    // LED ring
    if (robot.led) {
      ctx.fillStyle = robot.led;
      ctx.beginPath(); ctx.arc(0, 3, 5, 0, 7); ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,.2)"; ctx.stroke();
    }
    // eyes
    ctx.fillStyle = "#3a2400";
    ctx.beginPath(); ctx.arc(-5, -5, 2, 0, 7); ctx.arc(5, -5, 2, 0, 7); ctx.fill();
    ctx.restore();
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function updateReadouts() {
    var w = canvas._logW, h = canvas._logH;
    document.getElementById("pg-r-x").textContent = Math.round((robot.x - w / 2) / SCALE);
    document.getElementById("pg-r-y").textContent = Math.round((h / 2 - robot.y) / SCALE);
    var head = ((Math.round(robot.heading) % 360) + 360) % 360;
    document.getElementById("pg-r-h").textContent = head + "°";
  }

  /* ---------- console ---------- */
  var consoleEl = document.getElementById("pg-console");
  function log(msg, err) { consoleEl.innerHTML += (err ? '<span class="err">' + msg + "</span>" : msg) + "\n"; consoleEl.scrollTop = consoleEl.scrollHeight; }
  function clearLog() { consoleEl.innerHTML = ""; }

  /* ---------- animation helpers ---------- */
  function delay(ms) {
    return new Promise(function (res) {
      var start = performance.now();
      (function step(now) {
        if (stopReq || now - start >= ms) return res();
        requestAnimationFrame(step);
      })(performance.now());
    });
  }
  function tween(duration, onUpdate) {
    return new Promise(function (res) {
      var start = performance.now();
      (function frame(now) {
        if (stopReq) return res();
        var t = Math.min(1, (now - start) / duration);
        var e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // easeInOut
        onUpdate(e);
        if (t < 1) requestAnimationFrame(frame); else res();
      })(performance.now());
    });
  }

  /* ---------- audio ---------- */
  var actx = null;
  function tone(freq, ms) {
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = "triangle"; o.frequency.value = freq;
      g.gain.value = 0.12; o.connect(g); g.connect(actx.destination);
      o.start(); o.stop(actx.currentTime + ms / 1000);
    } catch (e) { /* audio optional */ }
  }

  /* ---------- executor ---------- */
  var SPEED = 130;   // px per second
  var TURNSPEED = 200; // deg per second

  async function execNode(n) {
    if (stopReq) return;
    var p = n.params;
    switch (n.kind) {
      case "forward":
      case "backward": {
        var cm = (n.kind === "backward" ? -1 : 1) * Number(p.n);
        var dist = cm * SCALE;
        var rad = robot.heading * Math.PI / 180;
        var sx = robot.x, sy = robot.y;
        var tx = sx + dist * Math.sin(rad), ty = sy - dist * Math.cos(rad);
        log((n.kind === "backward" ? "뒤로 " : "앞으로 ") + Math.abs(cm) + "cm");
        await tween(Math.abs(dist) / SPEED * 1000, function (e) {
          robot.x = sx + (tx - sx) * e; robot.y = sy + (ty - sy) * e;
          trail.push({ x: robot.x, y: robot.y }); draw(); updateReadouts();
        });
        break;
      }
      case "turnL":
      case "turnR": {
        var dd = (n.kind === "turnL" ? -1 : 1) * Number(p.d);
        var sh = robot.heading;
        log((n.kind === "turnL" ? "왼쪽 " : "오른쪽 ") + Math.abs(dd) + "° 회전");
        await tween(Math.abs(dd) / TURNSPEED * 1000, function (e) {
          robot.heading = sh + dd * e; draw(); updateReadouts();
        });
        break;
      }
      case "stop":
        log("정지"); await delay(150); break;
      case "led": {
        var c = COLORS[p.c]; robot.led = (p.c === "끄기") ? null : c.hex;
        log("LED → " + p.c); draw(); await delay(200); break;
      }
      case "note": {
        var info = NOTES[p.note]; log("♪ " + p.note + " (" + info.py + ")");
        tone(info.f, Number(p.beat) * 350); await delay(Number(p.beat) * 350); break;
      }
      case "beep": log("삐!"); tone(880, 150); await delay(200); break;
      case "wait": log(p.s + "초 대기"); await delay(Number(p.s) * 1000); break;
      case "repeat": {
        var reps = Number(p.n);
        for (var i = 0; i < reps && !stopReq; i++) {
          log("반복 " + (i + 1) + "/" + reps);
          await execList(n.children);
        }
        break;
      }
    }
  }
  async function execList(list) {
    for (var i = 0; i < list.length; i++) {
      if (stopReq) return;
      await execNode(list[i]);
    }
  }

  var runBtn = document.getElementById("pg-run");
  var stopBtn = document.getElementById("pg-stop");

  async function run() {
    if (running) return;
    if (!nodes.length) { log("먼저 블록을 담아 주세요.", true); return; }
    running = true; stopReq = false;
    runBtn.disabled = true; runBtn.textContent = "실행 중…";
    resetRobot(); clearLog(); log("▶ 실행 시작");
    await execList(nodes);
    log(stopReq ? "■ 중지됨" : "✔ 실행 완료");
    running = false; stopReq = false;
    runBtn.disabled = false; runBtn.textContent = "▶ 실행";
  }
  function stop() { if (running) { stopReq = true; } }

  runBtn.addEventListener("click", run);
  stopBtn.addEventListener("click", stop);
  document.getElementById("pg-clear").addEventListener("click", function () {
    if (running) return;
    nodes = []; activeContainer = null; renderScript(); resetRobot(); clearLog();
  });
  document.getElementById("pg-reset-stage").addEventListener("click", function () {
    if (running) return; resetRobot(); clearLog();
  });

  /* ---------- presets (과학·수학 이론 연계) ---------- */
  var PRESETS = {
    square: { // 도형: 정사각형, 외각 90°
      build: function () {
        var r = makeNode("repeat"); r.params.n = 4;
        r.children = [mk("forward", { n: 20 }), mk("turnR", { d: 90 })];
        return [r];
      }
    },
    triangle: { // 도형: 정삼각형, 외각 120°
      build: function () {
        var r = makeNode("repeat"); r.params.n = 3;
        r.children = [mk("forward", { n: 22 }), mk("turnR", { d: 120 })];
        return [r];
      }
    },
    star: { // 별: 외각 144°
      build: function () {
        var r = makeNode("repeat"); r.params.n = 5;
        r.children = [mk("forward", { n: 26 }), mk("turnR", { d: 144 })];
        return [r];
      }
    },
    rainbow: { // 빛의 색: LED 색 변화
      build: function () {
        var r = makeNode("repeat"); r.params.n = 1;
        r.children = ["빨강", "노랑", "초록", "파랑", "보라"].reduce(function (acc, c) {
          acc.push(mk("led", { c: c })); acc.push(mk("wait", { s: 0.4 })); return acc;
        }, []);
        return [r];
      }
    },
    melody: { // 소리: 진동수와 음높이 (도레미파솔)
      build: function () {
        return ["도4", "레4", "미4", "파4", "솔4"].map(function (nt) { return mk("note", { note: nt, beat: 1 }); });
      }
    }
  };
  function mk(kind, params) { var n = makeNode(kind); n.params = Object.assign({}, SPECS[kind].def, params); return n; }

  document.getElementById("pg-presets").addEventListener("click", function (e) {
    var b = e.target.closest("[data-preset]");
    if (!b || running) return;
    // reassign ids so they are unique/current
    nodes = PRESETS[b.dataset.preset].build();
    (function reid(list) { list.forEach(function (n) { n.id = uid++; if (n.children) reid(n.children); }); })(nodes);
    activeContainer = null;
    renderScript();
    resetRobot(); clearLog();
    log("예제 불러옴 · ▶ 실행을 눌러 보세요");
  });

  /* ---------- init ---------- */
  window.addEventListener("resize", function () { if (!running) { var pw = robot ? { x: robot.x, y: robot.y } : null; sizeCanvas(); resetRobot(); } });
  sizeCanvas();
  resetRobot();
  renderScript();
})();
