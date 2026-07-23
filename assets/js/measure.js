/* ============================================================
   SciBot 측정·그래프 탐구
   - 햄스터S / 치즈스틱 로봇별 센서 선택
   - 실물 연결 시 실제 센서 값, 미연결 시 시뮬레이션
   - 실시간 센서 모니터(모든 센서 값 라이브 표시)
   ============================================================ */
(function () {
  "use strict";

  function highlight(code) {
    var esc = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return esc.split("\n").map(function (line) {
      var m = line.match(/^(.*?)(#.*)$/);
      var head = m ? m[1] : line, comment = m ? m[2] : "";
      head = head.replace(/("[^"]*")/g, '<span class="tok-str">$1</span>');
      head = head.replace(/\b(from|import|while|for|in|if|else|range|print|def|return)\b/g, '<span class="tok-kw">$1</span>');
      head = head.replace(/\b(HamsterS|CheeseStick)\b/g, '<span class="tok-cls">$1</span>');
      head = head.replace(/\.([a-zA-Z_]\w*)(?=\()/g, '.<span class="tok-fn">$1</span>');
      head = head.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tok-num">$1</span>');
      if (comment) comment = '<span class="tok-com">' + comment + "</span>";
      return head + comment;
    }).join("\n");
  }

  /* ---------- 로봇 & 센서 정의 ---------- */
  var ROBOTS = {
    hamster: { select: "HamsterS", sensors: ["h_temp", "h_light", "h_prox", "h_accel"] },
    cheese:  { select: "CheeseStick", sensors: ["c_light", "c_sound", "c_temp", "c_env", "c_pressure", "c_volume"] }
  };

  // real: 브리지 센서 필드명 / setup·read: 파이썬 코드 조각
  var SENSORS = {
    h_temp: { robot: "hamster", name: "온도 센서", icon: "🌡️", unit: "℃", min: 10, max: 40, base: 24, noise: 0.4,
      color: "#ef476f", manip: "환경 온도", low: "시원하게", high: "따뜻하게", label: "온도",
      real: "temperature", read: "hamster.temperature()" },
    h_light: { robot: "hamster", name: "조도 센서", icon: "💡", unit: "", min: 0, max: 100, base: 55, noise: 2,
      color: "#ffab19", manip: "빛의 밝기", low: "가리기", high: "손전등", label: "밝기",
      real: "light", read: "hamster.light()" },
    h_prox: { robot: "hamster", name: "근접 센서", icon: "📏", unit: "", min: 0, max: 255, base: 20, noise: 3,
      color: "#17a89a", manip: "물체 거리", low: "멀리", high: "가까이", label: "근접",
      real: "left_proximity", read: "hamster.left_proximity()" },
    h_accel: { robot: "hamster", name: "가속도 센서", icon: "📐", unit: "", min: -100, max: 100, base: 0, noise: 1.5,
      color: "#4c97ff", manip: "기울기", low: "왼쪽", high: "오른쪽", label: "기울기",
      real: "accel_x", read: "hamster.acceleration_x()" },

    c_light: { robot: "cheese", name: "조도 센서 (CSD-10)", icon: "💡", unit: "", min: 0, max: 100, base: 60, noise: 2,
      color: "#ffab19", manip: "빛의 밝기", low: "가리기", high: "손전등", label: "밝기",
      real: "light", setup: "light = cheese.CSD10()\nlight.set_port('Sa')", read: "light.get_input()" },
    c_sound: { robot: "cheese", name: "소리 센서 (CSD-07)", icon: "🔊", unit: "", min: 0, max: 100, base: 20, noise: 6,
      color: "#9966ff", manip: "소리 크기", low: "조용히", high: "박수", label: "소리",
      real: "sound", setup: "sound = cheese.CSD07()\nsound.set_port('Sb')", read: "sound.get_input()" },
    c_temp: { robot: "cheese", name: "온도 센서 (PID-26)", icon: "🌡️", unit: "℃", min: 10, max: 40, base: 24, noise: 0.4,
      color: "#ef476f", manip: "환경 온도", low: "시원하게", high: "따뜻하게", label: "온도",
      real: "temperature", setup: "env = cheese.PID26()", read: "env.temperature()" },
    c_env: { robot: "cheese", name: "습도 센서 (PID-26)", icon: "🌦️", unit: "%", min: 0, max: 100, base: 50, noise: 1.5,
      color: "#2ec4b6", manip: "습도", low: "건조하게", high: "습하게", label: "습도",
      real: "humidity", setup: "env = cheese.PID26()", read: "env.humidity()" },
    c_pressure: { robot: "cheese", name: "기압 센서 (PID-26)", icon: "🌬️", unit: "hPa", min: 990, max: 1030, base: 1013, noise: 0.5,
      color: "#5cb1d6", manip: "기압", low: "저기압", high: "고기압", label: "기압",
      real: "pressure", setup: "env = cheese.PID26()", read: "env.pressure()" },
    c_volume: { robot: "cheese", name: "회전 볼륨 (CSD-03)", icon: "🎛️", unit: "", min: 0, max: 100, base: 50, noise: 1,
      color: "#a86bff", manip: "볼륨 회전", low: "왼쪽으로", high: "오른쪽으로", label: "입력값",
      real: "volume", setup: "vol = cheese.CSD03()\nvol.set_port('Sc')", read: "vol.get_input()" }
  };

  // 실시간 모니터: 브리지가 보내는 필드 → 표시 정보
  var FIELD = {
    temperature: { name: "온도", unit: "℃", min: 10, max: 40, color: "#ef476f" },
    light: { name: "조도", unit: "", min: 0, max: 100, color: "#ffab19" },
    humidity: { name: "습도", unit: "%", min: 0, max: 100, color: "#2ec4b6" },
    pressure: { name: "기압", unit: "hPa", min: 990, max: 1030, color: "#5cb1d6" },
    sound: { name: "소리", unit: "", min: 0, max: 100, color: "#9966ff" },
    volume: { name: "볼륨", unit: "", min: 0, max: 100, color: "#a86bff" },
    left_proximity: { name: "근접 L", unit: "", min: 0, max: 255, color: "#17a89a" },
    right_proximity: { name: "근접 R", unit: "", min: 0, max: 255, color: "#17a89a" },
    left_floor: { name: "바닥 L", unit: "", min: 0, max: 100, color: "#4c97ff" },
    right_floor: { name: "바닥 R", unit: "", min: 0, max: 100, color: "#4c97ff" },
    accel_x: { name: "가속 X", unit: "", min: -100, max: 100, color: "#9966ff" },
    accel_y: { name: "가속 Y", unit: "", min: -100, max: 100, color: "#9966ff" },
    accel_z: { name: "가속 Z", unit: "", min: -2000, max: 2000, color: "#9966ff" }
  };

  /* ---------- 상태 ---------- */
  var curRobot = "hamster";
  var cur = "h_temp";
  var value = SENSORS.h_temp.base;
  var sliderPct = 50;
  var data = [];
  var startTime = 0;
  var running = false, timer = null;
  var predict = null;
  var SAMPLE = 500, WINDOW = 30;

  /* ---------- 로봇 선택 ---------- */
  var robotsEl = document.getElementById("ms-robots");
  robotsEl.addEventListener("click", function (e) {
    var b = e.target.closest(".ms-robot");
    if (!b || running) return;
    curRobot = b.dataset.robot;
    robotsEl.querySelectorAll(".ms-robot").forEach(function (x) { x.classList.toggle("is-active", x === b); });
    cur = ROBOTS[curRobot].sensors[0];
    buildSensorList();
    resetSensor();
  });

  /* ---------- 센서 목록 ---------- */
  var pick = document.getElementById("ms-sensors");
  function buildSensorList() {
    pick.innerHTML = ROBOTS[curRobot].sensors.map(function (k) {
      var s = SENSORS[k];
      return '<button class="ms-sensor' + (k === cur ? " is-active" : "") + '" data-k="' + k + '">' +
        '<span class="ico">' + s.icon + '</span>' +
        '<span><b>' + s.name + '</b><span>' + (s.unit ? "단위 " + s.unit : "0~" + s.max) + '</span></span></button>';
    }).join("");
  }
  pick.addEventListener("click", function (e) {
    var b = e.target.closest(".ms-sensor");
    if (!b || running) return;
    cur = b.dataset.k;
    pick.querySelectorAll(".ms-sensor").forEach(function (x) { x.classList.toggle("is-active", x === b); });
    resetSensor();
  });

  function sensorTarget() { var s = SENSORS[cur]; return s.min + (sliderPct / 100) * (s.max - s.min); }
  function defaultPct() { var s = SENSORS[cur]; return Math.round((s.base - s.min) / (s.max - s.min) * 100); }

  function resetSensor() {
    var s = SENSORS[cur];
    sliderPct = defaultPct();
    value = s.base;
    data = [];
    predict = null;
    document.getElementById("ms-slider").value = sliderPct;
    document.getElementById("ms-predict-in").value = "";
    document.getElementById("ms-manip-label").textContent = s.manip;
    document.getElementById("ms-low").textContent = "◀ " + s.low;
    document.getElementById("ms-high").textContent = s.high + " ▶";
    document.getElementById("ms-graph-title").textContent = s.icon + " " + s.name + " 측정";
    document.getElementById("ms-unit").textContent = s.unit || "값";
    updatePy(); updateStats(); renderTable(); draw(); updateBig();
  }

  /* ---------- 환경 조작 ---------- */
  var slider = document.getElementById("ms-slider");
  slider.addEventListener("input", function () { sliderPct = Number(this.value); });
  document.getElementById("ms-low").addEventListener("click", function () { sliderPct = Math.max(0, sliderPct - 25); slider.value = sliderPct; });
  document.getElementById("ms-high").addEventListener("click", function () { sliderPct = Math.min(100, sliderPct + 25); slider.value = sliderPct; });
  document.getElementById("ms-predict-in").addEventListener("input", function () {
    var v = this.value === "" ? null : Number(this.value);
    predict = (v === null || isNaN(v)) ? null : v; draw();
  });

  /* ---------- 측정 루프 ---------- */
  var startBtn = document.getElementById("ms-start");
  var stopBtn = document.getElementById("ms-stop");
  var liveEl = document.getElementById("ms-live");

  function tick() {
    var s = SENSORS[cur];
    var sel = ROBOTS[curRobot].select;
    var B = window.SciBotRobot;
    var latest = (B && B.latestFor) ? B.latestFor(sel) : null;
    var real = B && B.isReady && B.isReady(sel) && s.real && latest && latest[s.real] != null;
    if (real) {
      value = Number(latest[s.real]);
    } else {
      var target = sensorTarget();
      var noise = (Math.random() - 0.5) * 2 * s.noise;
      value += (target - value) * 0.28 + noise;
    }
    value = Math.max(s.min, Math.min(s.max, value));
    var t = (performance.now() - startTime) / 1000;
    data.push({ t: t, v: value });
    draw(); updateBig(); updateStats(); renderTable();
  }
  function start() {
    if (running) return;
    running = true; startTime = performance.now();
    if (!data.length) value = SENSORS[cur].base;
    liveEl.classList.add("is-live"); startBtn.disabled = true;
    tick(); timer = setInterval(tick, SAMPLE);
  }
  function stop() { running = false; clearInterval(timer); liveEl.classList.remove("is-live"); startBtn.disabled = false; }
  startBtn.addEventListener("click", start);
  stopBtn.addEventListener("click", stop);
  document.getElementById("ms-clear").addEventListener("click", function () {
    if (running) stop(); data = []; draw(); updateStats(); renderTable(); updateBig();
  });

  /* ---------- 그래프 ---------- */
  var canvas = document.getElementById("ms-canvas");
  var ctx = canvas.getContext("2d");
  var W = 0, H = 0;
  function sizeCanvas() {
    var dpr = window.devicePixelRatio || 1;
    W = canvas.clientWidth || 600; H = canvas.clientHeight || 320;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  var PAD = { l: 46, r: 14, t: 14, b: 28 };
  function draw() {
    var s = SENSORS[cur];
    ctx.clearRect(0, 0, W, H);
    var gx0 = PAD.l, gx1 = W - PAD.r, gy0 = PAD.t, gy1 = H - PAD.b;
    var ymin = s.min, ymax = s.max;
    var now = data.length ? data[data.length - 1].t : 0;
    var tmax = Math.max(WINDOW, now), tmin = tmax - WINDOW;
    function X(t) { return gx0 + (t - tmin) / (tmax - tmin) * (gx1 - gx0); }
    function Y(v) { return gy1 - (v - ymin) / (ymax - ymin) * (gy1 - gy0); }

    ctx.strokeStyle = "#eee3cf"; ctx.fillStyle = "#a29a8e"; ctx.lineWidth = 1;
    ctx.font = "11px Pretendard, sans-serif"; ctx.textAlign = "right"; ctx.textBaseline = "middle";
    for (var i = 0; i <= 4; i++) {
      var vv = ymin + (ymax - ymin) * i / 4, yy = Y(vv);
      ctx.beginPath(); ctx.moveTo(gx0, yy); ctx.lineTo(gx1, yy); ctx.stroke();
      ctx.fillText(Math.round(vv), gx0 - 6, yy);
    }
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    for (var j = 0; j <= 5; j++) { var tt = tmin + (tmax - tmin) * j / 5; ctx.fillText(Math.max(0, tt).toFixed(0) + "s", X(tt), gy1 + 6); }
    ctx.strokeStyle = "#d8cdb5"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(gx0, gy0); ctx.lineTo(gx0, gy1); ctx.lineTo(gx1, gy1); ctx.stroke();

    if (predict !== null && predict >= ymin && predict <= ymax) {
      ctx.strokeStyle = "#4c97ff"; ctx.lineWidth = 1.5; ctx.setLineDash([6, 5]);
      var py = Y(predict); ctx.beginPath(); ctx.moveTo(gx0, py); ctx.lineTo(gx1, py); ctx.stroke();
      ctx.setLineDash([]); ctx.fillStyle = "#4c97ff"; ctx.textAlign = "left"; ctx.textBaseline = "bottom";
      ctx.fillText("예측 " + predict, gx0 + 6, py - 3);
    }
    var pts = data.filter(function (d) { return d.t >= tmin; });
    if (pts.length > 1) {
      ctx.strokeStyle = s.color; ctx.lineWidth = 2.5; ctx.lineJoin = "round";
      ctx.beginPath(); pts.forEach(function (d, k) { var x = X(d.t), y = Y(d.v); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
      ctx.lineTo(X(pts[pts.length - 1].t), gy1); ctx.lineTo(X(pts[0].t), gy1); ctx.closePath();
      ctx.fillStyle = s.color + "1f"; ctx.fill();
      var last = pts[pts.length - 1];
      ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(X(last.t), Y(last.v), 4, 0, 7); ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
    }
  }

  function updateBig() {
    var s = SENSORS[cur];
    var v = data.length ? data[data.length - 1].v : value;
    document.getElementById("ms-big").textContent = v.toFixed(1) + (s.unit || "");
  }
  function updateStats() {
    if (!data.length) {
      ["ms-st-n", "ms-st-min", "ms-st-max", "ms-st-avg"].forEach(function (id, i) {
        document.getElementById(id).textContent = i === 0 ? "0" : "–";
      });
      return;
    }
    var vs = data.map(function (d) { return d.v; });
    var mn = Math.min.apply(null, vs), mx = Math.max.apply(null, vs);
    var avg = vs.reduce(function (a, b) { return a + b; }, 0) / vs.length;
    document.getElementById("ms-st-n").textContent = data.length;
    document.getElementById("ms-st-min").textContent = mn.toFixed(1);
    document.getElementById("ms-st-max").textContent = mx.toFixed(1);
    document.getElementById("ms-st-avg").textContent = avg.toFixed(1);
  }
  function renderTable() {
    var body = document.getElementById("ms-tbody");
    var rows = data.slice(-40).reverse();
    body.innerHTML = rows.map(function (d) { return "<tr><td>" + d.t.toFixed(1) + "</td><td>" + d.v.toFixed(1) + "</td></tr>"; }).join("") ||
      '<tr><td colspan="2" style="color:var(--ink-300)">측정 데이터가 없습니다</td></tr>';
  }

  /* ---------- 파이썬 코드 ---------- */
  function updatePy() {
    var el = document.getElementById("ms-pycode");
    if (!el) return;   // 측정 코드 패널 미표시
    var s = SENSORS[cur];
    var head, code;
    if (s.robot === "cheese") {
      head = "from robomation import *\n\ncheese = CheeseStick()\n" + (s.setup ? s.setup + "\n" : "") + "\n";
    } else {
      head = "from robomation import *\n\nhamster = HamsterS()\n\n";
    }
    code = head +
      "# 0.5초마다 " + s.label + " 값을 측정해 기록\n" +
      "for i in range(60):\n" +
      "    value = " + s.read + "\n" +
      '    print(i * 0.5, "초 →", value)\n' +
      "    wait(500)";
    el.innerHTML = highlight(code);
  }

  /* ---------- CSV ---------- */
  document.getElementById("ms-csv").addEventListener("click", function () {
    if (!data.length) return;
    var s = SENSORS[cur];
    var csv = "time_s," + s.label + "\n" + data.map(function (d) { return d.t.toFixed(1) + "," + d.v.toFixed(1); }).join("\n");
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "scibot_" + cur + ".csv"; a.click();
    URL.revokeObjectURL(a.href);
  });

  /* ============================================================
     실시간 센서 모니터 (연결 시 모든 센서 라이브 표시)
     ============================================================ */
  var monEl = document.getElementById("ms-monitor");
  var monLive = document.getElementById("ms-mon-live");
  var monHint = document.getElementById("ms-mon-hint");
  var monSig = "";
  var ROBOT_TITLE = { HamsterS: "🐹 햄스터S", CheeseStick: "🧀 치즈스틱" };
  var ROBOT_CLS = { HamsterS: "h", CheeseStick: "c" };

  function monitorEmpty() {
    monEl.classList.add("is-off");
    monEl.innerHTML = '<div class="ms-monitor-empty">🔌 위의 [햄스터S]·[치즈스틱] 버튼으로 로봇을 연결하면, 로봇별 모든 센서 값이 실시간으로 표시됩니다.</div>';
    monSig = "";
    monLive.classList.remove("is-live");
    monLive.innerHTML = '<span class="dot"></span> 대기';
    if (monHint) monHint.style.display = "";
  }

  // data = { HamsterS:{...}, CheeseStick:{...} }
  function updateMonitor(data) {
    var robotsPresent = Object.keys(data).filter(function (rn) {
      var v = data[rn]; return v && Object.keys(v).some(function (k) { return FIELD[k] && v[k] != null; });
    });
    if (!robotsPresent.length) { return; }

    // 시그니처(로봇+필드 구성)가 바뀌면 다시 그림
    var sig = robotsPresent.map(function (rn) {
      return rn + ":" + Object.keys(data[rn]).filter(function (k) { return FIELD[k] && data[rn][k] != null; }).join(",");
    }).join("|");

    if (sig !== monSig) {
      monEl.classList.remove("is-off");
      monEl.innerHTML = robotsPresent.map(function (rn) {
        var v = data[rn];
        var keys = Object.keys(v).filter(function (k) { return FIELD[k] && v[k] != null; });
        var tiles = keys.map(function (k) {
          var f = FIELD[k];
          return '<div class="msm-tile">' +
            '<div class="msm-name">' + f.name + '</div>' +
            '<div class="msm-val" id="msm-v-' + rn + '-' + k + '">–</div>' +
            '<div class="msm-bar"><span id="msm-b-' + rn + '-' + k + '" style="width:0%;background:' + f.color + '"></span></div>' +
            '</div>';
        }).join("");
        return '<div class="msm-group">' +
          '<div class="msm-gtitle ' + (ROBOT_CLS[rn] || "h") + '">' + (ROBOT_TITLE[rn] || rn) + '</div>' +
          '<div class="msm-grid">' + tiles + '</div></div>';
      }).join("");
      monSig = sig;
    }

    robotsPresent.forEach(function (rn) {
      var v = data[rn];
      Object.keys(v).forEach(function (k) {
        if (!FIELD[k] || v[k] == null) return;
        var f = FIELD[k], val = Number(v[k]);
        var ve = document.getElementById("msm-v-" + rn + "-" + k);
        var be = document.getElementById("msm-b-" + rn + "-" + k);
        if (ve) ve.innerHTML = (Math.round(val * 10) / 10) + (f.unit ? ' <small>' + f.unit + '</small>' : "");
        if (be) { var pct = Math.max(0, Math.min(100, (val - f.min) / (f.max - f.min) * 100)); be.style.width = pct + "%"; }
      });
    });

    monLive.classList.add("is-live");
    monLive.innerHTML = '<span class="dot"></span> LIVE';
    if (monHint) monHint.style.display = "none";
  }

  if (window.SciBotRobot) {
    window.SciBotRobot.on("sensors", updateMonitor);
    window.SciBotRobot.on("status", function (s) {
      if (!s.connected || !Object.keys(s.robots || {}).length) monitorEmpty();
    });
  }

  /* ============================================================
     실험 배너 (갤러리에서 고른 실험 표시 + 로봇/센서 자동 선택)
     ============================================================ */
  var ROBOT_KO = { hamster: "🐹 햄스터S", cheese: "🧀 치즈스틱" };
  var curExp = null;

  // 챗봇이 참고할 현재 실험/측정 맥락
  window.SciBotContext = function () {
    var s = SENSORS[cur];
    var vs = data.map(function (d) { return d.v; });
    var stats = data.length ? {
      n: data.length, min: Math.min.apply(null, vs).toFixed(1),
      max: Math.max.apply(null, vs).toFixed(1),
      avg: (vs.reduce(function (a, b) { return a + b; }, 0) / vs.length).toFixed(1)
    } : null;
    return {
      experiment: curExp ? curExp.title : null,
      goal: curExp ? curExp.goal : null,
      sci: curExp ? curExp.sci : val("rep-sci"),
      sensor: s.name, unit: s.unit || "", robot: ROBOT_KO[curRobot],
      stats: stats, predict: predict
    };
  };
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function val(id) { var e = document.getElementById(id); return e ? e.value.trim() : ""; }
  function todayStr() { var d = new Date(), p = function (n) { return (n < 10 ? "0" : "") + n; }; return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()); }

  function applyExperiment(exp) {
    curExp = exp;
    curRobot = exp.robot;
    cur = exp.sensor;
    robotsEl.querySelectorAll(".ms-robot").forEach(function (x) { x.classList.toggle("is-active", x.dataset.robot === exp.robot); });
    buildSensorList();
    resetSensor();
    var el = document.getElementById("ms-exp");
    el.style.display = "";
    el.innerHTML = '<div class="ms-exp__card">' +
      '<div class="ms-exp__badges"><span>' + ROBOT_KO[exp.robot] + '</span>' +
      '<span>' + exp.sensorName + '</span><span>🔬 ' + exp.sci + '</span><span>⏱ ' + exp.time + ' · ' + exp.level + '</span></div>' +
      '<h2>' + exp.emoji + ' ' + exp.title + '</h2>' +
      '<div class="ms-exp__goal">🎯 ' + exp.goal + '</div>' +
      '<ul class="ms-exp__steps">' + exp.steps.map(function (s, i) { return '<li><b>' + (i + 1) + '</b><span>' + esc(s) + '</span></li>'; }).join("") + '</ul>' +
      '</div>';
    document.getElementById("rep-title").value = exp.title;
    document.getElementById("rep-sci").value = exp.sci;
  }

  function showOwnExperiment() {
    curExp = null;
    var el = document.getElementById("ms-exp");
    el.style.display = "";
    el.innerHTML = '<div class="ms-exp__card">' +
      '<div class="ms-exp__badges"><span>🧪 나만의 실험</span><span>자유 탐구</span></div>' +
      '<h2>🧪 나만의 실험 · 빈 보고서</h2>' +
      '<div class="ms-exp__goal">로봇과 센서를 자유롭게 골라 측정하고, 아래 <b>실험 보고서</b>를 직접 채워 완성하세요.</div>' +
      '</div>';
  }

  /* ============================================================
     실험 보고서 (생성·인쇄 / 내 기록 저장)
     ============================================================ */
  function collectReport() {
    var s = SENSORS[cur];
    var vs = data.map(function (d) { return d.v; });
    var stats = data.length ? {
      n: data.length,
      min: Math.min.apply(null, vs).toFixed(1),
      max: Math.max.apply(null, vs).toFixed(1),
      avg: (vs.reduce(function (a, b) { return a + b; }, 0) / vs.length).toFixed(1)
    } : { n: 0, min: "–", max: "–", avg: "–" };
    return {
      title: val("rep-title") || (s.name + " 측정"),
      name: val("rep-name"), date: val("rep-date") || todayStr(), sci: val("rep-sci"),
      hypo: val("rep-hypo"), obs: val("rep-obs"), conc: val("rep-conc"),
      sensor: s.name, unit: s.unit || "", robot: ROBOT_KO[curRobot],
      predict: predict, stats: stats,
      exp: curExp ? { id: curExp.id, title: curExp.title, goal: curExp.goal, steps: curExp.steps, sci: curExp.sci } : null,
      img: data.length ? canvas.toDataURL("image/png") : "",   // 📸 그래프 캡쳐
      rows: data.slice(0, 300)
    };
  }

  function reportHTML(r) {
    var rows = r.rows.map(function (d) { return "<tr><td>" + d.t.toFixed(1) + "</td><td>" + d.v.toFixed(1) + "</td></tr>"; }).join("");
    var pred = (r.predict != null ? " (예측값 " + r.predict + r.unit + ")" : "");
    return '<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>' + esc(r.title) + ' — 실험보고서</title>' +
      '<style>body{font-family:"Malgun Gothic","Apple SD Gothic Neo",sans-serif;color:#222;max-width:760px;margin:24px auto;padding:0 20px;line-height:1.6}' +
      'h1{font-size:1.5rem;border-bottom:3px solid #ff9f1c;padding-bottom:8px}h2{font-size:1.05rem;margin:20px 0 6px;color:#b5610a}' +
      'table.meta{border-collapse:collapse;width:100%;margin:12px 0}table.meta td{border:1px solid #e5ddcb;padding:7px 10px;font-size:.92rem}' +
      'table.meta td.k{background:#fbf5ea;font-weight:800;width:110px}' +
      'img{max-width:100%;border:1px solid #eee;border-radius:8px}' +
      'table.data{border-collapse:collapse;font-size:.82rem;margin-top:6px}table.data td,table.data th{border:1px solid #e5ddcb;padding:3px 12px;text-align:center}' +
      '.box{background:#fbf7ef;border-left:4px solid #ffb638;border-radius:0 8px 8px 0;padding:10px 14px;min-height:24px;white-space:pre-wrap}' +
      '.stats{display:flex;gap:10px;flex-wrap:wrap}.stats div{background:#fbf5ea;border-radius:8px;padding:8px 14px;font-weight:700}' +
      'footer{margin-top:30px;color:#999;font-size:.8rem;border-top:1px solid #eee;padding-top:10px}' +
      '@media print{button{display:none}}</style></head><body>' +
      '<h1>🔬 실험 보고서</h1>' +
      '<table class="meta">' +
      '<tr><td class="k">실험 제목</td><td>' + esc(r.title) + '</td><td class="k">날짜</td><td>' + esc(r.date) + '</td></tr>' +
      '<tr><td class="k">이름/모둠</td><td>' + esc(r.name) + '</td><td class="k">로봇</td><td>' + esc(r.robot) + '</td></tr>' +
      '<tr><td class="k">센서</td><td>' + esc(r.sensor) + '</td><td class="k">과학 개념</td><td>' + esc(r.sci) + '</td></tr>' +
      '</table>' +
      (r.exp ? '<h2>🎯 실험 목표</h2><div class="box">' + esc(r.exp.goal) + '</div>' +
        (r.exp.steps && r.exp.steps.length ? '<ol style="margin:6px 0 0;padding-left:20px">' + r.exp.steps.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join("") + '</ol>' : '') : '') +
      '<h2>🔮 예측 · 가설</h2><div class="box">' + esc(r.hypo) + pred + '</div>' +
      '<h2>📈 측정 그래프</h2>' + (r.img ? '<img src="' + r.img + '">' : '<div class="box">측정 데이터가 없습니다.</div>') +
      '<h2>📋 측정 결과</h2><div class="stats"><div>측정 ' + r.stats.n + '회</div><div>최소 ' + r.stats.min + r.unit + '</div><div>최대 ' + r.stats.max + r.unit + '</div><div>평균 ' + r.stats.avg + r.unit + '</div></div>' +
      (rows ? '<table class="data"><tr><th>시간(초)</th><th>' + esc(r.sensor) + '</th></tr>' + rows + '</table>' : '') +
      '<h2>🔬 관찰한 점</h2><div class="box">' + esc(r.obs) + '</div>' +
      '<h2>✅ 알게 된 점 · 결론</h2><div class="box">' + esc(r.conc) + '</div>' +
      '<footer>SciBot · 지능형 과학교실 · 측정하고 탐구하는 과학실험실</footer>' +
      '<script>window.onload=function(){setTimeout(function(){window.print();},300);};<\/script>' +
      '</body></html>';
  }

  function repMsg(t, warn) {
    var m = document.getElementById("rep-msg");
    if (!m) return;
    m.style.color = warn ? "var(--danger)" : "var(--teal-600)";
    m.textContent = t;
    setTimeout(function () { m.textContent = ""; }, 4000);
  }

  document.getElementById("rep-make").addEventListener("click", function () {
    var r = collectReport();
    var w = window.open("", "_blank");
    if (!w) { repMsg("팝업이 차단되었습니다. 허용 후 다시 시도하세요.", true); return; }
    w.document.write(reportHTML(r));
    w.document.close();
  });

  document.getElementById("rep-save").addEventListener("click", function () {
    if (!data.length) { repMsg("먼저 측정을 진행해 주세요.", true); return; }
    var r = collectReport();
    var rec = {
      savedAt: Date.now(), title: r.title, name: r.name, date: r.date, sci: r.sci,
      sensor: r.sensor, unit: r.unit, robot: r.robot, predict: r.predict,
      hypo: r.hypo, obs: r.obs, conc: r.conc, stats: r.stats,
      exp: r.exp, img: r.img,   // 실험 연동 정보 + 그래프 캡쳐 저장
      data: r.rows
    };
    // 학생 로그인이 있으면 그 계정에 저장(추후 연동), 없으면 로컬 공용 저장
    var saver = (window.SciBotAuth && window.SciBotAuth.saveReport) ? window.SciBotAuth.saveReport : function (x) {
      var store = JSON.parse(localStorage.getItem("scibot_reports") || "[]");
      store.push(x); localStorage.setItem("scibot_reports", JSON.stringify(store)); return store.length;
    };
    var n = saver(rec);
    repMsg("내 기록에 저장했습니다!" + (n ? " (" + n + "개)" : ""));
  });

  /* ---------- 초기화 ---------- */
  window.addEventListener("resize", function () { sizeCanvas(); draw(); });
  var params = new URLSearchParams(location.search);
  var exp = (window.SCIBOT_FIND_EXP && params.get("exp")) ? window.SCIBOT_FIND_EXP(params.get("exp")) : null;
  buildSensorList();
  sizeCanvas();
  if (exp) applyExperiment(exp); else { resetSensor(); showOwnExperiment(); }
  monitorEmpty();
  var repDate = document.getElementById("rep-date");
  if (repDate) repDate.value = todayStr();
})();
