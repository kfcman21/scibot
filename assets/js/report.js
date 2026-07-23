/* ============================================================
   저장된 측정 기록(rec)으로 인쇄용 실험 보고서 HTML 생성.
   teacher.html / student.html 에서 사용. (그래프는 인라인 SVG)
   window.SciBotBuildReport(rec) -> HTML 문자열
   ============================================================ */
(function () {
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  function svgChart(data, unit) {
    if (!data || data.length < 2) return '<div class="box">측정 데이터가 없습니다.</div>';
    var W = 640, H = 220, PL = 44, PB = 26, PT = 12, PR = 12;
    var vs = data.map(function (d) { return d.v; });
    var mn = Math.min.apply(null, vs), mx = Math.max.apply(null, vs);
    if (mn === mx) { mn -= 1; mx += 1; }
    var t0 = data[0].t, t1 = data[data.length - 1].t; if (t1 === t0) t1 = t0 + 1;
    function X(t) { return PL + (t - t0) / (t1 - t0) * (W - PL - PR); }
    function Y(v) { return H - PB - (v - mn) / (mx - mn) * (H - PB - PT); }
    var grid = "", i;
    for (i = 0; i <= 4; i++) {
      var vv = mn + (mx - mn) * i / 4, yy = Y(vv);
      grid += '<line x1="' + PL + '" y1="' + yy + '" x2="' + (W - PR) + '" y2="' + yy + '" stroke="#eee3cf"/>' +
        '<text x="' + (PL - 6) + '" y="' + (yy + 3) + '" font-size="10" fill="#a29a8e" text-anchor="end">' + (Math.round(vv * 10) / 10) + '</text>';
    }
    var pts = data.map(function (d) { return X(d.t).toFixed(1) + "," + Y(d.v).toFixed(1); }).join(" ");
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="border:1px solid #eee;border-radius:8px;background:#fffdf8">' +
      grid +
      '<line x1="' + PL + '" y1="' + PT + '" x2="' + PL + '" y2="' + (H - PB) + '" stroke="#d8cdb5"/>' +
      '<line x1="' + PL + '" y1="' + (H - PB) + '" x2="' + (W - PR) + '" y2="' + (H - PB) + '" stroke="#d8cdb5"/>' +
      '<polyline points="' + pts + '" fill="none" stroke="#f5810a" stroke-width="2.5" stroke-linejoin="round"/>' +
      '</svg>';
  }

  window.SciBotBuildReport = function (r) {
    var unit = r.unit || "";
    var st = r.stats || {};
    var pred = (r.predict != null ? " (예측값 " + r.predict + unit + ")" : "");
    var rows = (r.data || []).slice(0, 300).map(function (d) { return "<tr><td>" + d.t.toFixed(1) + "</td><td>" + d.v.toFixed(1) + "</td></tr>"; }).join("");
    return '<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>' + esc(r.title) + ' — 실험보고서</title>' +
      '<style>body{font-family:"Malgun Gothic","Apple SD Gothic Neo",sans-serif;color:#222;max-width:760px;margin:24px auto;padding:0 20px;line-height:1.6}' +
      'h1{font-size:1.5rem;border-bottom:3px solid #ff9f1c;padding-bottom:8px}h2{font-size:1.05rem;margin:20px 0 6px;color:#b5610a}' +
      'table.meta{border-collapse:collapse;width:100%;margin:12px 0}table.meta td{border:1px solid #e5ddcb;padding:7px 10px;font-size:.92rem}table.meta td.k{background:#fbf5ea;font-weight:800;width:110px}' +
      'table.data{border-collapse:collapse;font-size:.82rem;margin-top:6px}table.data td,table.data th{border:1px solid #e5ddcb;padding:3px 12px;text-align:center}' +
      '.box{background:#fbf7ef;border-left:4px solid #ffb638;border-radius:0 8px 8px 0;padding:10px 14px;min-height:24px;white-space:pre-wrap}' +
      '.stats{display:flex;gap:10px;flex-wrap:wrap}.stats div{background:#fbf5ea;border-radius:8px;padding:8px 14px;font-weight:700}' +
      'footer{margin-top:30px;color:#999;font-size:.8rem;border-top:1px solid #eee;padding-top:10px}@media print{button{display:none}}</style></head><body>' +
      '<h1>🔬 실험 보고서</h1>' +
      '<table class="meta">' +
      '<tr><td class="k">실험 제목</td><td>' + esc(r.title) + '</td><td class="k">날짜</td><td>' + esc(r.date) + '</td></tr>' +
      '<tr><td class="k">이름/모둠</td><td>' + esc(r.name) + '</td><td class="k">로봇</td><td>' + esc(r.robot) + '</td></tr>' +
      '<tr><td class="k">센서</td><td>' + esc(r.sensor) + '</td><td class="k">과학 개념</td><td>' + esc(r.sci) + '</td></tr></table>' +
      (r.exp ? '<h2>🎯 실험 목표</h2><div class="box">' + esc(r.exp.goal) + '</div>' +
        (r.exp.steps && r.exp.steps.length ? '<ol style="margin:6px 0 0;padding-left:20px">' + r.exp.steps.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join("") + '</ol>' : '') : '') +
      '<h2>🔮 예측 · 가설</h2><div class="box">' + esc(r.hypo) + pred + '</div>' +
      '<h2>📈 측정 그래프</h2>' + (r.img ? '<img src="' + r.img + '">' : svgChart(r.data, unit)) +
      '<h2>📋 측정 결과</h2><div class="stats"><div>측정 ' + (st.n || 0) + '회</div><div>최소 ' + (st.min || "–") + unit + '</div><div>최대 ' + (st.max || "–") + unit + '</div><div>평균 ' + (st.avg || "–") + unit + '</div></div>' +
      (rows ? '<table class="data"><tr><th>시간(초)</th><th>' + esc(r.sensor) + '</th></tr>' + rows + '</table>' : '') +
      '<h2>🔬 관찰한 점</h2><div class="box">' + esc(r.obs) + '</div>' +
      '<h2>✅ 알게 된 점 · 결론</h2><div class="box">' + esc(r.conc) + '</div>' +
      '<footer>SciBot · 지능형 과학교실</footer>' +
      '<script>window.onload=function(){setTimeout(function(){window.print();},300);};<\/script></body></html>';
  };
})();
