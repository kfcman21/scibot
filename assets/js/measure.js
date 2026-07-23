/* ============================================================
   SciBot 측정·그래프 탐구 — 센서 값을 실시간으로 측정하고 그래프로 탐구
   (실제 하드웨어 없이 시뮬레이션 · 예측 → 측정 → 관찰)
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

  /* ---------- sensors ---------- */
  var SENSORS = {
    temp: { name: "온도 센서", icon: "🌡️", unit: "℃", min: 10, max: 40, base: 24, noise: 0.4, color: "#ef476f",
      robot: "🐹 햄스터S", manip: "환경 온도", low: "시원하게", high: "따뜻하게",
      py: 'value = hamster.temperature()', label: "온도" },
    light: { name: "조도 센서", icon: "💡", unit: "", min: 0, max: 100, base: 55, noise: 2, color: "#ffab19",
      robot: "🐹 햄스터S", manip: "빛의 밝기", low: "손으로 가리기", high: "손전등 비추기",
      py: 'value = hamster.light()', label: "밝기" },
    sound: { name: "소리 센서", icon: "🔊", unit: "", min: 0, max: 100, base: 20, noise: 6, color: "#9966ff",
      robot: "🧀 치즈스틱", manip: "소리 크기", low: "조용히", high: "박수·큰 소리",
      py: 'value = sound.value()', label: "소리" },
    prox: { name: "근접 센서", icon: "📏", unit: "", min: 0, max: 255, base: 20, noise: 3, color: "#17a89a",
      robot: "🐹 햄스터S", manip: "물체 거리", low: "멀리", high: "가까이",
      py: 'value = hamster.left_proximity()', label: "근접" },
    accel: { name: "가속도 센서", icon: "📐", unit: "", min: -100, max: 100, base: 0, noise: 1.5, color: "#4c97ff",
      robot: "🐹 햄스터S", manip: "기울기", low: "왼쪽 기울임", high: "오른쪽 기울임",
      py: 'value = hamster.acceleration_x()', label: "기울기" }
  };
  var ORDER = ["temp", "light", "sound", "prox", "accel"];

  /* ---------- state ---------- */
  var cur = "temp";
  var value = SENSORS.temp.base;
  var sliderPct = 50;               // 0~100, 환경 조작
  var data = [];                    // {t, v}
  var startTime = 0;
  var running = false, timer = null;
  var predict = null;
  var SAMPLE = 500;                 // ms
  var WINDOW = 30;                  // 그래프에 보이는 시간(초)

  /* ---------- build sensor picker ---------- */
  var pick = document.getElementById("ms-sensors");
  pick.innerHTML = ORDER.map(function (k) {
    var s = SENSORS[k];
    return '<button class="ms-sensor' + (k === cur ? " is-active" : "") + '" data-k="' + k + '">' +
      '<span class="ico">' + s.icon + '</span>' +
      '<span><b>' + s.name + '</b><span>' + s.robot + '</span></span></button>';
  }).join("");

  pick.addEventListener("click", function (e) {
    var b = e.target.closest(".ms-sensor");
    if (!b || running) return;
    cur = b.dataset.k;
    pick.querySelectorAll(".ms-sensor").forEach(function (x) { x.classList.toggle("is-active", x === b); });
    resetSensor();
  });

  function sensorTarget() {
    var s = SENSORS[cur];
    return s.min + (sliderPct / 100) * (s.max - s.min);
  }
  function defaultPct() {
    var s = SENSORS[cur];
    return Math.round((s.base - s.min) / (s.max - s.min) * 100);
  }

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
    updatePy();
    updateStats();
    renderTable();
    draw();
    updateBig();
  }

  /* ---------- manipulation controls ---------- */
  var slider = document.getElementById("ms-slider");
  slider.addEventListener("input", function () { sliderPct = Number(this.value); });
  document.getElementById("ms-low").addEventListener("click", function () {
    sliderPct = Math.max(0, sliderPct - 25); slider.value = sliderPct;
  });
  document.getElementById("ms-high").addEventListener("click", function () {
    sliderPct = Math.min(100, sliderPct + 25); slider.value = sliderPct;
  });

  document.getElementById("ms-predict-in").addEventListener("input", function () {
    var v = this.value === "" ? null : Number(this.value);
    predict = (v === null || isNaN(v)) ? null : v;
    draw();
  });

  /* ---------- measuring loop ---------- */
  var startBtn = document.getElementById("ms-start");
  var stopBtn = document.getElementById("ms-stop");
  var liveEl = document.getElementById("ms-live");

  function tick() {
    var s = SENSORS[cur];
    var target = sensorTarget();
    var noise = (Math.random() - 0.5) * 2 * s.noise;
    value += (target - value) * 0.28 + noise;
    value = Math.max(s.min, Math.min(s.max, value));
    var t = (performance.now() - startTime) / 1000;
    data.push({ t: t, v: value });
    draw(); updateBig(); updateStats(); renderTable();
  }

  function start() {
    if (running) return;
    running = true;
    startTime = performance.now();
    if (!data.length) value = SENSORS[cur].base;
    liveEl.classList.add("is-live");
    startBtn.disabled = true;
    tick();
    timer = setInterval(tick, SAMPLE);
  }
  function stop() {
    running = false;
    clearInterval(timer);
    liveEl.classList.remove("is-live");
    startBtn.disabled = false;
  }
  startBtn.addEventListener("click", start);
  stopBtn.addEventListener("click", stop);
  document.getElementById("ms-clear").addEventListener("click", function () {
    if (running) stop();
    data = []; draw(); updateStats(); renderTable(); updateBig();
  });

  /* ---------- graph ---------- */
  var canvas = document.getElementById("ms-canvas");
  var ctx = canvas.getContext("2d");
  var W = 0, H = 0;
  function sizeCanvas() {
    var dpr = window.devicePixelRatio || 1;
    W = canvas.clientWidth || 600;
    H = canvas.clientHeight || 320;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  var PAD = { l: 46, r: 14, t: 14, b: 28 };
  function draw() {
    var s = SENSORS[cur];
    ctx.clearRect(0, 0, W, H);
    var gx0 = PAD.l, gx1 = W - PAD.r, gy0 = PAD.t, gy1 = H - PAD.b;
    // y range with padding
    var ymin = s.min, ymax = s.max;
    // time window
    var now = data.length ? data[data.length - 1].t : 0;
    var tmax = Math.max(WINDOW, now);
    var tmin = tmax - WINDOW;

    function X(t) { return gx0 + (t - tmin) / (tmax - tmin) * (gx1 - gx0); }
    function Y(v) { return gy1 - (v - ymin) / (ymax - ymin) * (gy1 - gy0); }

    // gridlines + y labels
    ctx.strokeStyle = "#eee3cf"; ctx.fillStyle = "#a29a8e"; ctx.lineWidth = 1;
    ctx.font = "11px Pretendard, sans-serif"; ctx.textAlign = "right"; ctx.textBaseline = "middle";
    for (var i = 0; i <= 4; i++) {
      var vv = ymin + (ymax - ymin) * i / 4;
      var yy = Y(vv);
      ctx.beginPath(); ctx.moveTo(gx0, yy); ctx.lineTo(gx1, yy); ctx.stroke();
      ctx.fillText(Math.round(vv), gx0 - 6, yy);
    }
    // x labels (time)
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    for (var j = 0; j <= 5; j++) {
      var tt = tmin + (tmax - tmin) * j / 5;
      ctx.fillText(Math.max(0, tt).toFixed(0) + "s", X(tt), gy1 + 6);
    }
    // axes
    ctx.strokeStyle = "#d8cdb5"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(gx0, gy0); ctx.lineTo(gx0, gy1); ctx.lineTo(gx1, gy1); ctx.stroke();

    // prediction line
    if (predict !== null && predict >= ymin && predict <= ymax) {
      ctx.strokeStyle = "#4c97ff"; ctx.lineWidth = 1.5; ctx.setLineDash([6, 5]);
      var py = Y(predict);
      ctx.beginPath(); ctx.moveTo(gx0, py); ctx.lineTo(gx1, py); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#4c97ff"; ctx.textAlign = "left"; ctx.textBaseline = "bottom";
      ctx.fillText("예측 " + predict, gx0 + 6, py - 3);
    }

    // data line
    var pts = data.filter(function (d) { return d.t >= tmin; });
    if (pts.length > 1) {
      ctx.strokeStyle = s.color; ctx.lineWidth = 2.5; ctx.lineJoin = "round";
      ctx.beginPath();
      pts.forEach(function (d, k) { var x = X(d.t), y = Y(d.v); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke();
      // area fill
      ctx.lineTo(X(pts[pts.length - 1].t), gy1); ctx.lineTo(X(pts[0].t), gy1); ctx.closePath();
      ctx.fillStyle = s.color + "1f"; ctx.fill();
      // current point
      var last = pts[pts.length - 1];
      ctx.fillStyle = s.color;
      ctx.beginPath(); ctx.arc(X(last.t), Y(last.v), 4, 0, 7); ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
    }
  }

  /* ---------- readouts ---------- */
  function updateBig() {
    var s = SENSORS[cur];
    var v = data.length ? data[data.length - 1].v : value;
    document.getElementById("ms-big").textContent = v.toFixed(1) + (s.unit || "");
  }
  function updateStats() {
    var s = SENSORS[cur];
    var el = { n: "ms-st-n", min: "ms-st-min", max: "ms-st-max", avg: "ms-st-avg" };
    if (!data.length) {
      document.getElementById(el.n).textContent = "0";
      document.getElementById(el.min).textContent = "–";
      document.getElementById(el.max).textContent = "–";
      document.getElementById(el.avg).textContent = "–";
      return;
    }
    var vs = data.map(function (d) { return d.v; });
    var mn = Math.min.apply(null, vs), mx = Math.max.apply(null, vs);
    var avg = vs.reduce(function (a, b) { return a + b; }, 0) / vs.length;
    document.getElementById(el.n).textContent = data.length;
    document.getElementById(el.min).textContent = mn.toFixed(1);
    document.getElementById(el.max).textContent = mx.toFixed(1);
    document.getElementById(el.avg).textContent = avg.toFixed(1);
  }
  function renderTable() {
    var body = document.getElementById("ms-tbody");
    var rows = data.slice(-40).reverse();
    body.innerHTML = rows.map(function (d) {
      return "<tr><td>" + d.t.toFixed(1) + "</td><td>" + d.v.toFixed(1) + "</td></tr>";
    }).join("") || '<tr><td colspan="2" style="color:var(--ink-300)">측정 데이터가 없습니다</td></tr>';
  }

  /* ---------- python code ---------- */
  function updatePy() {
    var s = SENSORS[cur];
    var head = "from robomation import *\n\n";
    head += s.robot.indexOf("치즈") >= 0
      ? "cheese = CheeseStick()\nsound  = cheese.CSD07()\n\n"
      : "hamster = HamsterS()\n\n";
    var code = head +
      "# 0.5초마다 " + s.label + " 값을 측정해 기록\n" +
      "for i in range(60):\n" +
      "    " + s.py + "\n" +
      '    print(i * 0.5, "초 →", value)\n' +
      "    wait(500)";
    document.getElementById("ms-pycode").innerHTML = highlight(code);
  }

  /* ---------- CSV export ---------- */
  document.getElementById("ms-csv").addEventListener("click", function () {
    if (!data.length) return;
    var s = SENSORS[cur];
    var csv = "time_s," + s.label + "\n" + data.map(function (d) { return d.t.toFixed(1) + "," + d.v.toFixed(1); }).join("\n");
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "scibot_" + cur + ".csv";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  /* ---------- init ---------- */
  window.addEventListener("resize", function () { sizeCanvas(); draw(); });
  sizeCanvas();
  resetSensor();
})();
