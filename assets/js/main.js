/* ============================================================
   SciBot — interactions: gallery filter, code tabs, nav, reveal
   ============================================================ */
(function () {
  "use strict";

  /* ---------------- Activity gallery data ---------------- */
  var ACTIVITIES = [
    { robot: "hamster", topic: "algorithm", emoji: "🛣️", bg: "linear-gradient(135deg,#fff0d1,#ffd98a)",
      title: "선 따라 달리기", level: "초급", time: "40분", sci: "빛의 반사·센서",
      desc: "바닥 센서 두 개로 검은 선을 인식해 트랙을 완주합니다. 조건문과 반복문을 몸으로 익혀요." },
    { robot: "hamster", topic: "algorithm", emoji: "🧱", bg: "linear-gradient(135deg,#ffe3c2,#ffbf7a)",
      title: "미로 탈출 로봇", level: "중급", time: "80분", sci: "적외선·거리 측정",
      desc: "근접 센서로 벽을 감지하고 우수법으로 미로를 빠져나가는 알고리즘을 설계합니다." },
    { robot: "hamster", topic: "sensor", emoji: "🌡️", bg: "linear-gradient(135deg,#ffe0d6,#ff9f8a)",
      title: "교실 온도 탐험대", level: "초급", time: "40분", sci: "열·온도",
      desc: "온도·조도 센서 값을 1초마다 출력하고, 창가와 그늘의 환경을 비교·기록합니다." },
    { robot: "hamster", topic: "sensor", emoji: "📐", bg: "linear-gradient(135deg,#e7e0ff,#b3a6ff)",
      title: "기울기 경보기", level: "중급", time: "40분", sci: "힘과 운동·중력",
      desc: "가속도 센서로 로봇의 기울기를 측정하고, 일정 각도를 넘으면 LED와 버저로 알립니다." },
    { robot: "hamster", topic: "art", emoji: "🎨", bg: "linear-gradient(135deg,#ffe6f0,#ffb3d1)",
      title: "펜을 든 화가 로봇", level: "중급", time: "80분", sci: "도형·외각의 합",
      desc: "전진·회전 명령을 조합해 정다각형과 별 모양을 그리는 거북이 그래픽 수업." },
    { robot: "hamster", topic: "art", emoji: "🎵", bg: "linear-gradient(135deg,#d7f2ee,#8fd9cf)",
      title: "달리는 멜로디", level: "초급", time: "40분", sci: "소리·진동수",
      desc: "buzzer와 note로 음을 연주하며 움직이는, 소리와 동작을 결합한 창작 활동." },
    { robot: "cheese", topic: "sensor", emoji: "🌦️", bg: "linear-gradient(135deg,#d7f2ee,#8fd9cf)",
      title: "우리 반 날씨 관측소", level: "초급", time: "40분", sci: "기후·습도",
      desc: "PID-26 환경 센서로 온도·습도를 측정해 하루 동안의 교실 기후를 기록합니다." },
    { robot: "cheese", topic: "art", emoji: "🎹", bg: "linear-gradient(135deg,#fff0d1,#ffd98a)",
      title: "터치 피아노 연주회", level: "초급", time: "40분", sci: "음계·진동수",
      desc: "HAT-022 터치 피아노로 도레미를 연주하고, 나만의 짧은 곡을 코드로 만들어요." },
    { robot: "cheese", topic: "art", emoji: "💡", bg: "linear-gradient(135deg,#ffe6f0,#ffb3d1)",
      title: "네오픽셀 무드등", level: "초급", time: "40분", sci: "빛의 삼원색",
      desc: "NeoPixel의 색과 밝기를 바꿔가며 나만의 조명 패턴을 디자인하는 창작 활동." },
    { robot: "cheese", topic: "sensor", emoji: "🔊", bg: "linear-gradient(135deg,#e7e0ff,#b3a6ff)",
      title: "소리 반응 램프", level: "중급", time: "40분", sci: "소리의 세기",
      desc: "CSD-07 소리 센서 값이 커지면 LED가 켜지는 인터랙티브 장치를 만듭니다." },
    { robot: "cheese", topic: "algorithm", emoji: "🕹️", bg: "linear-gradient(135deg,#ffe3c2,#ffbf7a)",
      title: "조이스틱 게임 컨트롤러", level: "중급", time: "80분", sci: "좌표·입력",
      desc: "PID-13 조이스틱 입력으로 5×5 매트릭스 위의 점을 움직이는 미니 게임 제작." },
    { robot: "cheese", topic: "algorithm", emoji: "🎛️", bg: "linear-gradient(135deg,#ffe0d6,#ff9f8a)",
      title: "볼륨으로 밝기 조절", level: "초급", time: "40분", sci: "아날로그 신호",
      desc: "CSD-03 회전 볼륨 값을 읽어 RGB LED의 밝기를 실시간으로 제어하는 아날로그 입력 실습." }
  ];

  var LEVEL_BADGE = { "초급": "badge--level", "중급": "badge--level", "고급": "badge--level" };

  function robotLabel(r) { return r === "hamster" ? "🐹 햄스터S" : "🧀 치즈스틱"; }
  function robotBadge(r) { return r === "hamster" ? "badge--hamster" : "badge--cheese"; }

  var grid = document.getElementById("gallery-grid");

  function render(filter) {
    var items = ACTIVITIES.filter(function (a) {
      return filter === "all" || a.robot === filter || a.topic === filter;
    });
    grid.innerHTML = items.map(function (a) {
      return '' +
        '<article class="card">' +
          '<div class="card__top">' +
            '<div class="card__thumb" style="background:' + a.bg + '">' + a.emoji + '</div>' +
            '<div class="card__badges">' +
              '<span class="badge ' + robotBadge(a.robot) + '">' + robotLabel(a.robot) + '</span>' +
              '<span class="badge badge--level">' + a.level + '</span>' +
              '<span class="badge badge--cheese">🔬 ' + a.sci + '</span>' +
            '</div>' +
          '</div>' +
          '<h3>' + a.title + '</h3>' +
          '<p>' + a.desc + '</p>' +
          '<div class="card__foot">' +
            '<span class="card__meta">⏱ ' + a.time + '</span>' +
            '<span class="card__link">자세히 →</span>' +
          '</div>' +
        '</article>';
    }).join("");
    if (!items.length) {
      grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--ink-300)">해당 조건의 활동이 아직 없어요.</p>';
    }
  }

  var filters = document.getElementById("filters");
  if (filters) {
    filters.addEventListener("click", function (e) {
      var btn = e.target.closest(".chip");
      if (!btn) return;
      filters.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("is-active"); });
      btn.classList.add("is-active");
      render(btn.dataset.filter);
    });
  }
  render("all");

  /* ---------------- Code showcase ---------------- */
  var SNIPPETS = [
    {
      key: "line", label: "선 따라 달리기", sub: "햄스터S · 바닥 센서", file: "hamster_line.py",
      code:
'from robomation import *\n\n' +
'hamster = HamsterS()\n\n' +
'# 바닥 센서로 검은 선을 따라 주행합니다\n' +
'while True:\n' +
'    left  = hamster.left_floor()\n' +
'    right = hamster.right_floor()\n' +
'    if left < 50 and right < 50:\n' +
'        hamster.wheels(30, 30)   # 직진\n' +
'    elif left >= 50:\n' +
'        hamster.wheels(30, 0)    # 오른쪽으로\n' +
'    else:\n' +
'        hamster.wheels(0, 30)    # 왼쪽으로'
    },
    {
      key: "obstacle", label: "장애물 피하기", sub: "햄스터S · 근접 센서", file: "hamster_avoid.py",
      code:
'from robomation import *\n\n' +
'hamster = HamsterS()\n\n' +
'while True:\n' +
'    front = hamster.left_proximity()\n' +
'    if front > 40:            # 앞에 장애물이 가까우면\n' +
'        hamster.rgbs(255, 0, 0)   # LED 빨강\n' +
'        hamster.turn_right(90)    # 방향을 틀고\n' +
'    else:\n' +
'        hamster.rgbs(0, 255, 0)   # LED 초록\n' +
'        hamster.move_forward()    # 계속 전진'
    },
    {
      key: "temp", label: "온도 탐험대", sub: "햄스터S · 센서 로그", file: "hamster_temp.py",
      code:
'from robomation import *\n\n' +
'hamster = HamsterS()\n\n' +
'# 1초마다 온도와 조도를 출력해 기록합니다\n' +
'for i in range(60):\n' +
'    temp  = hamster.temperature()\n' +
'    light = hamster.light()\n' +
'    print(i, "초 →", temp, "℃ /", light, "lux")\n' +
'    wait(1000)\n\n' +
'print("측정 완료! 그래프로 비교해 보세요.")'
    },
    {
      key: "piano", label: "터치 피아노", sub: "치즈스틱 · HAT-022", file: "cheese_piano.py",
      code:
'from robomation import *\n\n' +
'cheese = CheeseStick()\n' +
'piano  = cheese.HAT022()   # 터치 피아노 모듈\n\n' +
'notes = ["C4", "D4", "E4", "F4", "G4", "A4", "B4"]\n\n' +
'while True:\n' +
'    key = piano.touched()      # 눌린 건반 번호\n' +
'    if key is not None:\n' +
'        cheese.note(notes[key])  # 해당 음 연주'
    },
    {
      key: "neopixel", label: "네오픽셀 무드등", sub: "치즈스틱 · NeoPixel", file: "cheese_neopixel.py",
      code:
'from robomation import *\n\n' +
'cheese   = CheeseStick()\n' +
'neopixel = cheese.NeoPixel()\n\n' +
'# 무지개 색이 흐르는 무드등\n' +
'colors = ["red", "orange", "yellow",\n' +
'          "green", "blue", "purple"]\n\n' +
'while True:\n' +
'    for c in colors:\n' +
'        neopixel.set_color(c)\n' +
'        wait(300)'
    },
    {
      key: "weather", label: "날씨 관측소", sub: "치즈스틱 · PID-26", file: "cheese_weather.py",
      code:
'from robomation import *\n\n' +
'cheese = CheeseStick()\n' +
'env    = cheese.PID26()    # 환경 센서 모듈\n\n' +
'while True:\n' +
'    t = env.temperature()\n' +
'    h = env.humidity()\n' +
'    print("온도:", t, "℃  습도:", h, "%")\n' +
'    if h > 60:\n' +
'        print("→ 습해요! 환기하세요 💧")\n' +
'    wait(2000)'
    }
  ];

  function highlight(code) {
    // escape first
    var esc = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    var lines = esc.split("\n").map(function (line) {
      // comments
      var m = line.match(/^(.*?)(#.*)$/);
      var head = m ? m[1] : line;
      var comment = m ? m[2] : "";
      // strings
      head = head.replace(/("[^"]*")/g, '<span class="tok-str">$1</span>');
      // keywords
      head = head.replace(/\b(from|import|while|for|in|if|elif|else|and|or|not|True|False|None|range|print|def|return)\b/g,
        '<span class="tok-kw">$1</span>');
      // class names
      head = head.replace(/\b(HamsterS|CheeseStick)\b/g, '<span class="tok-cls">$1</span>');
      // method calls  .name(
      head = head.replace(/\.([a-zA-Z_]\w*)(?=\()/g, '.<span class="tok-fn">$1</span>');
      // numbers
      head = head.replace(/\b(\d+)\b/g, '<span class="tok-num">$1</span>');
      if (comment) comment = '<span class="tok-com">' + comment + "</span>";
      return head + comment;
    });
    return lines.join("\n");
  }

  var tabsEl = document.getElementById("codetabs");
  var bodyEl = document.getElementById("codeBody");
  var fileEl = document.getElementById("codeFile");

  if (tabsEl) {
    tabsEl.innerHTML = SNIPPETS.map(function (s, i) {
      return '<button class="codetab' + (i === 0 ? " is-active" : "") + '" data-i="' + i + '">' +
             '<b>' + s.label + '</b><span>' + s.sub + '</span></button>';
    }).join("");

    function showSnippet(i) {
      var s = SNIPPETS[i];
      bodyEl.innerHTML = highlight(s.code);
      fileEl.textContent = s.file;
      tabsEl.querySelectorAll(".codetab").forEach(function (t) {
        t.classList.toggle("is-active", +t.dataset.i === i);
      });
    }
    tabsEl.addEventListener("click", function (e) {
      var t = e.target.closest(".codetab");
      if (t) showSnippet(+t.dataset.i);
    });
    showSnippet(0);
  }

  /* ---------------- Scratch block renderer ---------------- */
  var CAT_CLASS = {
    motion: "sb--motion", looks: "sb--looks", sound: "sb--sound",
    sensing: "sb--sensing", control: "sb--control", ops: "sb--ops"
  };

  function renderTokens(tokens) {
    return tokens.map(function (t) {
      if (typeof t === "string") return t;
      if (t.pill) return '<span class="sb-pill">' + t.pill + "</span>";
      if (t.round) return '<span class="sb-pill sb-pill--round">' + t.round + "</span>";
      return "";
    }).join(" ");
  }

  // node: { cat, t:[...], report?, children?:[node...] }
  function renderBlock(node) {
    var cls = CAT_CLASS[node.cat] || "sb--motion";
    var shape = node.report ? " sb-report" : "";
    var head = '<div class="sb-block ' + cls + shape + '">' + renderTokens(node.t) + "</div>";
    if (node.children && node.children.length) {
      var inner = node.children.map(renderBlock).join("");
      head = '<div class="sb-block ' + cls + ' sb-c">' + renderTokens(node.t) + "</div>" +
             '<div class="sb-nest sb-nest--control">' + inner + "</div>";
    }
    return head;
  }

  function renderStack(nodes) {
    return '<div class="sb-stack">' + nodes.map(renderBlock).join("") + "</div>";
  }

  /* ---------------- Block dictionary data ---------------- */
  var DICT = [
    { cat: "motion", label: "동작", robot: "🐹 햄스터S",
      block: { cat: "motion", t: ["앞으로", { pill: "10" }, "cm 이동하기"] },
      py: "hamster.move_forward(10)", desc: "정해진 거리만큼 앞으로 이동합니다." },
    { cat: "motion", label: "동작", robot: "🐹 햄스터S",
      block: { cat: "motion", t: ["왼쪽으로", { pill: "90" }, "도 돌기"] },
      py: "hamster.turn_left(90)", desc: "제자리에서 왼쪽으로 지정한 각도만큼 회전합니다." },
    { cat: "motion", label: "동작", robot: "🐹 햄스터S",
      block: { cat: "motion", t: ["왼쪽 바퀴", { pill: "30" }, "오른쪽 바퀴", { pill: "30" }, "정하기"] },
      py: "hamster.wheels(30, 30)", desc: "두 바퀴의 속도를 직접 정해 자유롭게 움직입니다." },
    { cat: "motion", label: "동작", robot: "🐹 햄스터S",
      block: { cat: "motion", t: ["정지하기"] },
      py: "hamster.stop()", desc: "바퀴를 멈춰 로봇을 정지시킵니다." },
    { cat: "looks", label: "LED", robot: "🐹 햄스터S",
      block: { cat: "looks", t: ["전체 LED를", { pill: "빨강" }, "켜기"] },
      py: "hamster.rgbs(255, 0, 0)", desc: "RGB 값으로 앞쪽 LED 색을 정합니다." },
    { cat: "looks", label: "LED", robot: "🧀 치즈스틱",
      block: { cat: "looks", t: ["네오픽셀 색을", { pill: "파랑" }, "으로"] },
      py: 'neopixel.set_color("blue")', desc: "치즈스틱 NeoPixel 모듈의 색을 바꿉니다." },
    { cat: "sound", label: "소리", robot: "🐹 햄스터S",
      block: { cat: "sound", t: ["버저를", { pill: "440" }, "Hz로 정하기"] },
      py: "hamster.buzzer(440)", desc: "지정한 주파수로 버저 소리를 냅니다. 0이면 꺼집니다." },
    { cat: "sound", label: "소리", robot: "🐹 햄스터S",
      block: { cat: "sound", t: [{ pill: "도4" }, "음을", { pill: "4" }, "박자 연주하기"] },
      py: 'hamster.note("C4", 4)', desc: "계이름과 박자로 음을 연주합니다." },
    { cat: "sensing", label: "센서", robot: "🐹 햄스터S",
      block: { cat: "sensing", report: true, t: ["왼쪽 바닥 센서 값"] },
      py: "hamster.left_floor()", desc: "바닥의 밝기(0~100)를 읽어 선을 인식합니다." },
    { cat: "sensing", label: "센서", robot: "🐹 햄스터S",
      block: { cat: "sensing", report: true, t: ["왼쪽 근접 센서 값"] },
      py: "hamster.left_proximity()", desc: "앞쪽 물체와의 가까움(0~255)을 측정합니다." },
    { cat: "sensing", label: "센서", robot: "🧀 치즈스틱",
      block: { cat: "sensing", report: true, t: ["온도 센서 값"] },
      py: "env.temperature()", desc: "PID-26 환경 센서로 주변 온도를 측정합니다." },
    { cat: "control", label: "제어", robot: "공통",
      block: { cat: "control", t: ["계속 반복하기"], children: [{ cat: "motion", t: ["앞으로 이동하기"] }] },
      py: "while True:\n    hamster.move_forward()", desc: "안쪽 블록을 무한히 반복 실행합니다." },
    { cat: "control", label: "제어", robot: "공통",
      block: { cat: "control", t: ["만약", { round: "조건" }, "이라면"], children: [{ cat: "sound", t: ["삐 소리내기"] }] },
      py: "if 조건:\n    hamster.beep()", desc: "조건이 참일 때만 안쪽 블록을 실행합니다." }
  ];

  var dictGrid = document.getElementById("dict-grid");
  function renderDict(cat) {
    var items = DICT.filter(function (d) { return cat === "all" || d.cat === cat; });
    dictGrid.innerHTML = items.map(function (d) {
      return '' +
        '<div class="dict__card">' +
          '<span class="dict__cat">' + d.robot + " · " + d.label + "</span>" +
          '<div class="dict__block">' + renderBlock(d.block) + "</div>" +
          '<div class="dict__py"><code>' + highlight(d.py) + "</code></div>" +
          '<div class="dict__desc">' + d.desc + "</div>" +
        "</div>";
    }).join("");
  }
  var dictFilters = document.getElementById("dict-filters");
  if (dictFilters) {
    dictFilters.addEventListener("click", function (e) {
      var b = e.target.closest(".chip");
      if (!b) return;
      dictFilters.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("is-active"); });
      b.classList.add("is-active");
      renderDict(b.dataset.cat);
    });
    renderDict("all");
  }

  /* ---------------- Course (block ↔ python) ---------------- */
  var LESSONS = [
    { n: 1, title: "로봇 깨우기", sub: "연결하고 움직이기", badge: "🐹 햄스터S",
      goal: "햄스터S를 연결하고 앞으로 갔다가 방향을 튼 뒤 멈춰 봅니다. 명령이 위에서 아래로 순서대로 실행돼요.",
      blocks: [
        { cat: "motion", t: ["앞으로", { pill: "20" }, "cm 이동하기"] },
        { cat: "motion", t: ["오른쪽으로", { pill: "90" }, "도 돌기"] },
        { cat: "motion", t: ["정지하기"] }
      ],
      py: "from robomation import *\n\nhamster = HamsterS()\nhamster.move_forward(20)\nhamster.turn_right(90)\nhamster.stop()" },
    { n: 2, title: "빛과 소리", sub: "LED와 버저 다루기", badge: "🐹 햄스터S",
      goal: "LED를 켜고 두 개의 음을 연주해 봅니다. 색과 소리를 조합하면 상태를 표현할 수 있어요.",
      blocks: [
        { cat: "looks", t: ["전체 LED를", { pill: "초록" }, "켜기"] },
        { cat: "sound", t: [{ pill: "도4" }, "음을", { pill: "2" }, "박자 연주하기"] },
        { cat: "sound", t: [{ pill: "미4" }, "음을", { pill: "2" }, "박자 연주하기"] }
      ],
      py: "hamster.rgbs(0, 255, 0)\nhamster.note(\"C4\", 2)\nhamster.note(\"E4\", 2)" },
    { n: 3, title: "센서 값 읽기", sub: "관찰과 출력", badge: "🐹 햄스터S",
      goal: "1초마다 바닥 센서 값을 출력하며 관찰합니다. 값이 어떻게 바뀌는지 표에 기록해 보세요.",
      blocks: [
        { cat: "control", t: ["계속 반복하기"], children: [
          { cat: "looks", t: [{ round: "왼쪽 바닥 센서 값" }, "보이기"] },
          { cat: "control", t: [{ pill: "1" }, "초 기다리기"] }
        ] }
      ],
      py: "while True:\n    print(hamster.left_floor())\n    wait(1000)" },
    { n: 4, title: "조건으로 판단하기", sub: "선 따라가기", badge: "🐹 햄스터S",
      goal: "바닥 센서 값이 기준보다 작으면(검은 선이면) 앞으로, 아니면 방향을 틀도록 조건으로 판단합니다.",
      blocks: [
        { cat: "control", t: ["계속 반복하기"], children: [
          { cat: "control", t: ["만약", { round: "왼쪽 바닥 < 50" }, "이라면"], children: [
            { cat: "motion", t: ["왼쪽 바퀴", { pill: "30" }, "오른쪽 바퀴", { pill: "30" }, "정하기"] }
          ] },
          { cat: "control", t: ["아니면"], children: [
            { cat: "motion", t: ["왼쪽 바퀴", { pill: "30" }, "오른쪽 바퀴", { pill: "0" }, "정하기"] }
          ] }
        ] }
      ],
      py: "while True:\n    if hamster.left_floor() < 50:\n        hamster.wheels(30, 30)   # 직진\n    else:\n        hamster.wheels(30, 0)    # 방향 틀기" },
    { n: 5, title: "반복으로 그리기", sub: "정사각형 그리기", badge: "🐹 햄스터S",
      goal: "'앞으로–회전'을 4번 반복해 정사각형 경로를 그립니다. 반복이 코드를 얼마나 짧게 만드는지 느껴 보세요.",
      blocks: [
        { cat: "control", t: [{ pill: "4" }, "번 반복하기"], children: [
          { cat: "motion", t: ["앞으로", { pill: "10" }, "cm 이동하기"] },
          { cat: "motion", t: ["오른쪽으로", { pill: "90" }, "도 돌기"] }
        ] }
      ],
      py: "for i in range(4):\n    hamster.move_forward(10)\n    hamster.turn_right(90)" },
    { n: 6, title: "치즈스틱으로 확장", sub: "터치 피아노 연주", badge: "🧀 치즈스틱",
      goal: "치즈스틱 터치 피아노 모듈을 이용해 건반을 누르면 음이 나도록 만듭니다. 다른 로봇으로 확장하는 경험이에요.",
      blocks: [
        { cat: "control", t: ["계속 반복하기"], children: [
          { cat: "control", t: ["만약", { round: "1번 건반이 눌리면" }, "이라면"], children: [
            { cat: "sound", t: [{ pill: "도4" }, "음 연주하기"] }
          ] }
        ] }
      ],
      py: "from robomation import *\n\ncheese = CheeseStick()\npiano  = cheese.HAT022()\n\nwhile True:\n    if piano.touched() == 0:\n        cheese.note(\"C4\")" }
  ];

  var courseMode = "block";
  var courseList = document.getElementById("course-list");
  if (courseList) {
    courseList.innerHTML = LESSONS.map(function (l, i) {
      return '' +
        '<div class="lesson' + (i === 0 ? " is-open" : "") + '">' +
          '<button class="lesson__head" data-i="' + i + '">' +
            '<span class="lesson__num">' + l.n + "</span>" +
            '<span class="lesson__ttl"><b>' + l.title + "</b><span>" + l.sub + "</span></span>" +
            '<span class="lesson__badge">' + l.badge + "</span>" +
            '<span class="lesson__arrow">▾</span>' +
          "</button>" +
          '<div class="lesson__body">' +
            '<div class="lesson__goal">🎯 ' + l.goal + "</div>" +
            '<div class="lesson__view lesson__view--block is-shown">' + renderStack(l.blocks) + "</div>" +
            '<div class="lesson__view lesson__view--python"><code>' + highlight(l.py) + "</code></div>" +
          "</div>" +
        "</div>";
    }).join("");

    courseList.addEventListener("click", function (e) {
      var head = e.target.closest(".lesson__head");
      if (!head) return;
      head.parentElement.classList.toggle("is-open");
    });

    function applyCourseMode() {
      courseList.querySelectorAll(".lesson__view--block").forEach(function (v) {
        v.classList.toggle("is-shown", courseMode === "block");
      });
      courseList.querySelectorAll(".lesson__view--python").forEach(function (v) {
        v.classList.toggle("is-shown", courseMode === "python");
      });
    }
    var courseToggle = document.getElementById("course-toggle");
    courseToggle.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      courseMode = b.dataset.mode;
      courseToggle.querySelectorAll("button").forEach(function (x) {
        x.classList.toggle("is-active", x === b);
      });
      applyCourseMode();
    });
  }

  /* ---------------- Mobile nav ---------------- */
  var nav = document.getElementById("nav");
  var toggle = document.getElementById("navToggle");
  if (toggle) {
    toggle.addEventListener("click", function () { nav.classList.toggle("is-open"); });
    nav.querySelectorAll(".nav__links a, .nav__cta a").forEach(function (a) {
      a.addEventListener("click", function () { nav.classList.remove("is-open"); });
    });
  }

  /* ---------------- Reveal on scroll ---------------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
})();
