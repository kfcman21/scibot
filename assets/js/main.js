/* ============================================================
   SciBot — 측정하고 탐구하는 과학실험실 (지능형 과학교실)
   랜딩 상호작용: 측정 실험 갤러리 필터 + 스크롤 리빌 + 모바일 내비
   ============================================================ */
(function () {
  "use strict";

  /* ---------- 측정 실험 갤러리 ---------- */
  var EXPERIMENTS = window.SCIBOT_EXPERIMENTS || [];

  function robotLabel(r) { return r === "hamster" ? "🐹 햄스터S" : "🧀 치즈스틱"; }
  function robotBadge(r) { return r === "hamster" ? "badge--hamster" : "badge--cheese"; }

  var grid = document.getElementById("gallery-grid");
  function render(filter) {
    if (!grid) return;
    var items = EXPERIMENTS.filter(function (a) { return filter === "all" || a.robot === filter || a.gradeGroup === filter; });
    var ownCard = '<a class="card" href="measure.html">' +
      '<div class="card__top"><div class="card__thumb" style="background:linear-gradient(135deg,#eee9df,#d3c8b4)">🧪</div>' +
      '<div class="card__badges"><span class="badge badge--level">자유 탐구</span><span class="badge badge--cheese">📝 빈 보고서</span></div></div>' +
      '<h3>나만의 실험</h3><p>로봇과 센서를 자유롭게 골라 측정하고, 빈 실험 보고서를 직접 채워 완성합니다.</p>' +
      '<div class="card__foot"><span class="card__meta">⏱ 자유</span><span class="card__link">시작하기 →</span></div></a>';
    grid.innerHTML = ownCard + items.map(function (a) {
      return '' +
        '<a class="card" href="measure.html?exp=' + a.id + '">' +
          '<div class="card__top">' +
            '<div class="card__thumb" style="background:' + a.bg + '">' + a.emoji + '</div>' +
            '<div class="card__badges">' +
              '<span class="badge badge--hamster">🎓 ' + a.grade + '</span>' +
              '<span class="badge ' + robotBadge(a.robot) + '">' + robotLabel(a.robot) + '</span>' +
              '<span class="badge badge--level">' + a.sensorName + '</span>' +
            '</div>' +
          '</div>' +
          '<h3>' + a.title + '</h3>' +
          '<p>' + a.goal + '</p>' +
          '<div class="card__foot">' +
            '<span class="card__meta">📘 ' + a.unitName + ' · ⏱ ' + a.time + '</span>' +
            '<span class="card__link">측정하기 →</span>' +
          '</div>' +
        '</a>';
    }).join("");
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

  /* ---------- 모바일 내비 ---------- */
  var nav = document.getElementById("nav");
  var toggle = document.getElementById("navToggle");
  if (toggle) {
    toggle.addEventListener("click", function () { nav.classList.toggle("is-open"); });
    nav.querySelectorAll(".nav__links a").forEach(function (a) {
      a.addEventListener("click", function () { nav.classList.remove("is-open"); });
    });
  }

  /* ---------- 스크롤 리빌 ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
})();
