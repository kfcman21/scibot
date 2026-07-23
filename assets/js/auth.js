/* ============================================================
   SciBot 로그인/기록 (교사·학생) — 정적 사이트용 localStorage 기반
   · 교사: 반 만들기 → 반 코드 발급, 학생·보고서 열람
   · 학생: 반 코드 + 이름으로 로그인 → 측정 보고서 저장
   전역 window.SciBotAuth 로 노출.
   ※ 서버 없이 브라우저(기기)에 저장되는 교육용 데모입니다.
   ============================================================ */
(function () {
  "use strict";
  var DB_KEY = "scibot_db", SES_KEY = "scibot_session";

  function db() { try { return JSON.parse(localStorage.getItem(DB_KEY)) || { classes: {} }; } catch (e) { return { classes: {} }; } }
  function saveDb(d) { localStorage.setItem(DB_KEY, JSON.stringify(d)); }
  function session() { try { return JSON.parse(localStorage.getItem(SES_KEY)) || null; } catch (e) { return null; } }
  function setSession(s) { if (s) localStorage.setItem(SES_KEY, JSON.stringify(s)); else localStorage.removeItem(SES_KEY); }
  function newCode() { var c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", s = ""; for (var i = 0; i < 6; i++) s += c[Math.floor(Math.random() * c.length)]; return s; }

  var A = {
    getSession: session,
    logout: function () { setSession(null); },

    /* ---- 교사 ---- */
    teacherLogin: function (name) {
      name = (name || "").trim(); if (!name) return null;
      var s = { role: "teacher", teacher: name }; setSession(s); return s;
    },
    createClass: function (className) {
      var s = session(); if (!s || s.role !== "teacher") return null;
      var d = db(), c = newCode(); while (d.classes[c]) c = newCode();
      d.classes[c] = { code: c, className: (className || "").trim() || "우리 반", teacher: s.teacher, createdAt: Date.now(), students: {} };
      saveDb(d); return c;
    },
    teacherClasses: function () {
      var s = session(); if (!s) return [];
      var d = db(); return Object.keys(d.classes).map(function (k) { return d.classes[k]; }).filter(function (c) { return c.teacher === s.teacher; }).sort(function (a, b) { return b.createdAt - a.createdAt; });
    },
    deleteClass: function (code) { var d = db(); delete d.classes[code]; saveDb(d); },

    /* ---- 학생 ---- */
    studentLogin: function (codeIn, name) {
      var c = (codeIn || "").toUpperCase().trim(); name = (name || "").trim();
      var d = db();
      if (!d.classes[c]) return { error: "반 코드를 찾을 수 없습니다. 선생님께 확인하세요." };
      if (!name) return { error: "이름을 입력하세요." };
      if (!d.classes[c].students[name]) d.classes[c].students[name] = { reports: [] };
      saveDb(d);
      var s = { role: "student", classCode: c, className: d.classes[c].className, student: name };
      setSession(s); return { session: s };
    },

    /* ---- 보고서 ---- */
    saveReport: function (rec) {
      var s = session();
      if (!s || s.role !== "student") {
        var store = JSON.parse(localStorage.getItem("scibot_reports") || "[]");
        store.push(rec); localStorage.setItem("scibot_reports", JSON.stringify(store)); return store.length;
      }
      var d = db(), cl = d.classes[s.classCode]; if (!cl) return 0;
      if (!cl.students[s.student]) cl.students[s.student] = { reports: [] };
      cl.students[s.student].reports.push(rec); saveDb(d);
      return cl.students[s.student].reports.length;
    },
    studentReports: function () {
      var s = session(); if (!s || s.role !== "student") return [];
      var cl = db().classes[s.classCode]; return (cl && cl.students[s.student]) ? cl.students[s.student].reports : [];
    },

    label: function () {
      var s = session(); if (!s) return null;
      return s.role === "teacher" ? ("👩‍🏫 " + s.teacher + " 선생님") : ("🧑‍🎓 " + s.student + " · " + s.className);
    }
  };
  window.SciBotAuth = A;

  /* ---- 헤더 로그인 위젯: [data-auth] 요소 ---- */
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-auth]").forEach(function (el) {
      var s = session();
      if (s) {
        el.innerHTML = '<span class="auth-who">' + A.label() + '</span>' +
          (s.role === "teacher"
            ? '<a class="btn btn--ghost btn--sm" href="teacher.html">교사 대시보드</a>'
            : '<a class="btn btn--ghost btn--sm" href="student.html">내 기록</a>') +
          '<button class="btn btn--ghost btn--sm" data-logout>로그아웃</button>';
        var lo = el.querySelector("[data-logout]");
        if (lo) lo.addEventListener("click", function () { A.logout(); location.reload(); });
      } else {
        el.innerHTML = '<a class="btn btn--ghost btn--sm" href="login.html">🔑 교사·학생 로그인</a>';
      }
    });

    // 지능형 과학교실 ON 연계 링크 (교사가 포털 URL을 한 번 설정)
    document.querySelectorAll("[data-on-link]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var url = localStorage.getItem("scibot_on_url");
        if (!url || e.shiftKey) {
          url = prompt("‘지능형 과학교실 ON’ 포털 주소(URL)를 입력하세요.\n(한 번 설정하면 저장됩니다. 다시 바꾸려면 Shift+클릭)", url || "https://");
          if (!url) return;
          url = url.trim(); if (!/^https?:\/\//.test(url)) url = "https://" + url;
          localStorage.setItem("scibot_on_url", url);
        }
        window.open(url, "_blank", "noopener");
      });
    });
  });
})();
