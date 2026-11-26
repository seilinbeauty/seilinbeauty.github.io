/* 운영 센터 — 미니게임 플레이 · 강의별 조회수 카드 (2026-11-26 커비)
   - 커뮤니티 홈(dia.html) 미니게임 3종(짝맞추기·반응속도·로또)을 연 횟수를 analytics/{날짜} 문서의
     game(전체)·g_mem·g_react·g_lotto 에서 읽어 보여 줍니다.
   - 뷰티수강 카드(dia-course.html)를 연 횟수를 course_views/{날짜} 의 views 맵에서 읽어 강의별로 보여 줍니다.
   - 두 카드 모두 방문자 카드(#ops-visit)와 파이어베이스 읽기 사용량 카드(#ops-fb) 사이에 들어갑니다.
     dia-fbstat.js 가 #ops-fb 를 붙이는 순서와 상관없이 자리를 잡도록, #ops-fb 가 생기면 그 앞에 넣습니다.
   - 읽기는 하루 문서만(1분마다). 무료 한도에 부담을 주지 않으려고 모음 전체를 받지 않습니다.
   - 값이 없는 날(집계 시작 전)은 0이 아니라 - 로 보여 줍니다. */
(function(){
  var FB = window.DiaFB;
  var anchor = document.getElementById('ops-visit');
  if(!FB || !anchor || !FB.dayAnalytics || document.getElementById('ops-gs')) return;

  var st = document.createElement('style');
  st.textContent =
    '.ops-gs{margin-top:14px;border:1px solid #f0e2e7;border-radius:16px;background:#fff;padding:15px 16px 13px;}' +
    '.ops-gs-hd{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}' +
    '.ops-gs-t{font-size:13px;font-weight:800;color:#4a353c;}' +
    '.ops-gs-s{font-size:11.5px;font-weight:700;color:#bfa7b1;}' +
    '.ops-gs-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px;}' +
    '.ops-gs-row.two{grid-template-columns:repeat(2,1fr);}' +
    '.ops-gs-item{text-align:center;border:1px solid #f7eaef;border-radius:12px;background:#fffafc;padding:10px 6px 9px;}' +
    '.ops-gs-item b{display:block;font-size:22px;font-weight:900;color:#c2456a;line-height:1.1;letter-spacing:-.4px;}' +
    '.ops-gs-item span{display:block;margin-top:4px;font-size:11px;color:#9a8a90;font-weight:700;}' +
    '.ops-gs-sub{margin-top:10px;display:flex;gap:10px;flex-wrap:wrap;font-size:11.5px;color:#9a8a90;}' +
    '.ops-gs-sub b{color:#5c4a50;font-weight:800;}' +
    '.ops-gs-note{margin-top:9px;font-size:11px;color:#bfa7b1;line-height:1.55;}' +
    '.ops-cv-cols{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:11px;}' +
    '@media (max-width:560px){ .ops-cv-cols{grid-template-columns:1fr;gap:10px;} }' +
    '.ops-cv-col{min-width:0;}' +
    '.ops-cv-h{font-size:11px;font-weight:800;color:#b35172;background:#fdf1f5;display:inline-block;padding:2px 8px;border-radius:999px;margin-bottom:5px;}' +
    '.ops-cv-row{display:flex;align-items:center;gap:6px;padding:3px 0;font-size:11.5px;color:#5c4a50;}' +
    '.ops-cv-i{flex:0 0 16px;text-align:center;font-weight:900;color:#c9b3bb;}' +
    '.ops-cv-i.g{color:#c9a227;} .ops-cv-i.s{color:#9aa0a8;} .ops-cv-i.b{color:#b06b3c;}' +
    '.ops-cv-n{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
    '.ops-cv-c{flex:0 0 auto;font-weight:800;color:#c2456a;}' +
    '.ops-cv-empty{font-size:11.5px;color:#bfa7b1;padding:3px 0;}' +
    '.ops-gs-item b{font-variant-numeric:tabular-nums;}';
  document.head.appendChild(st);

  function cardHtml(id, title, sub, body){
    return '<div class="ops-gs-hd"><span class="ops-gs-t">' + title + '</span><span class="ops-gs-s">' + sub + '</span></div>' + body;
  }

  var gameBox = document.createElement('div');
  gameBox.className = 'ops-gs'; gameBox.id = 'ops-gs';
  gameBox.innerHTML = cardHtml('ops-gs', '미니게임 플레이', '커뮤니티 홈 · 게임을 열 때 1회',
    '<div class="ops-gs-row">' +
      '<div class="ops-gs-item"><b id="gs-today">-</b><span>오늘 플레이</span></div>' +
      '<div class="ops-gs-item"><b id="gs-yday">-</b><span>어제 플레이</span></div>' +
      '<div class="ops-gs-item"><b id="gs-7">-</b><span>최근 7일 합계</span></div>' +
    '</div>' +
    '<div class="ops-gs-sub" id="gs-games"><span>짝맞추기 <b>-</b></span><span>반응속도 <b>-</b></span><span>로또 <b>-</b></span></div>' +
    '<div class="ops-gs-note">게임을 여는 순간 1회를 세고, 같은 판의 반복 클릭은 세지 않습니다. 집계를 시작하기 전 날짜는 - 로 표시합니다.</div>');

  var crsBox = document.createElement('div');
  crsBox.className = 'ops-gs'; crsBox.id = 'ops-cv';
  crsBox.innerHTML = cardHtml('ops-cv', '🎓 강의별 조회수', '뷰티수강 · 카드를 열 때 1회(30분 중복 제외)',
    '<div class="ops-gs-row two">' +
      '<div class="ops-gs-item"><b id="cv-today">-</b><span>오늘 조회 합계</span></div>' +
      '<div class="ops-gs-item"><b id="cv-7">-</b><span>최근 7일 합계</span></div>' +
    '</div>' +
    '<div class="ops-cv-cols">' +
      '<div class="ops-cv-col"><div class="ops-cv-h">오늘 TOP 5</div><div id="cv-top-today"><div class="ops-cv-empty">-</div></div></div>' +
      '<div class="ops-cv-col"><div class="ops-cv-h">7일 TOP 5</div><div id="cv-top-7"><div class="ops-cv-empty">-</div></div></div>' +
    '</div>' +
    '<div class="ops-gs-note">뷰티수강 페이지에는 표시하지 않고, 이 화면과 커뮤니티 홈 인기 수강 카드에만 보입니다. 집계 시작 전 날짜는 - 입니다.</div>');

  // #ops-fb 가 생기면 그 앞에 [미니게임][강의] 순서로 넣는다
  var placed = false;
  function place(){
    if(placed) return;
    var fb = document.getElementById('ops-fb');
    if(!fb || !fb.parentNode) return;
    var host = fb.parentNode;
    if(gameBox.parentNode !== host) host.insertBefore(gameBox, fb);
    if(crsBox.parentNode !== host) host.insertBefore(crsBox, fb);
    placed = true;
  }
  anchor.parentNode.insertBefore(gameBox, anchor.nextSibling);
  anchor.parentNode.insertBefore(crsBox, gameBox.nextSibling);
  var tries = 0;
  var t = setInterval(function(){ place(); if(placed || ++tries > 60) clearInterval(t); }, 250);
  place();

  function fmt(v){ return (v === null || v === undefined) ? '-' : String(v); }
  function num(n){ return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function dayAgo(n){ return new Date(Date.now() + 9 * 3600 * 1000 - n * 86400000).toISOString().slice(0, 10); }
  function visible(el){ return !document.hidden && el && el.offsetParent !== null; }
  function esc(s){ return String(s === undefined || s === null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function paintGames(){
    if(!visible(gameBox)) return;
    var days = [], i;
    for(i = 0; i < 7; i++) days.push(dayAgo(i));
    Promise.all(days.map(function(d){ return FB.dayAnalytics(d); })).then(function(rows){
      var map = {};
      rows.forEach(function(r){ map[r.day] = r; });
      var today = map[days[0]], yday = map[days[1]];
      var sum = 0, has = 0;
      rows.forEach(function(r){ if(r.game !== null){ sum += r.game; has++; } });
      var val = function(v){ return (v === null || v === undefined) ? '-' : num(v); };
      var set = function(id, v){ var e = document.getElementById(id); if(e) e.textContent = v; };
      set('gs-today', val(today && today.game));
      set('gs-yday', val(yday && yday.game));
      set('gs-7', has ? num(sum) : '-');
      var gs = document.getElementById('gs-games');
      if(gs){
        gs.innerHTML = '<span>짝맞추기 <b>' + val(today && today.g_mem) + '</b></span>' +
                       '<span>반응속도 <b>' + val(today && today.g_react) + '</b></span>' +
                       '<span>로또 <b>' + val(today && today.g_lotto) + '</b></span>';
      }
    }, function(){});
  }

  function listHtml(map, empty){
    var keys = Object.keys(map || {}).filter(function(k){ return map[k] > 0; });
    if(!keys.length) return '<div class="ops-cv-empty">' + empty + '</div>';
    keys.sort(function(a, b){ return (map[b] - map[a]) || String(a).localeCompare(String(b), 'ko'); });
    return keys.slice(0, 5).map(function(k, i){
      var cls = i === 0 ? 'g' : (i === 1 ? 's' : (i === 2 ? 'b' : ''));
      return '<div class="ops-cv-row"><span class="ops-cv-i ' + cls + '">' + (i + 1) + '</span>'
        + '<span class="ops-cv-n">' + esc(k) + '</span>'
        + '<span class="ops-cv-c">' + map[k] + '회</span></div>';
    }).join('');
  }

  function paintCourses(){
    if(!visible(crsBox) || !FB.getCourseViews) return;
    FB.getCourseViews(7).then(function(r){
      var days = (r && r.days) || {}, total = (r && r.total) || {};
      var today = days[dayAgo(0)];
      var todaySum = null;
      if(today){
        todaySum = 0;
        for(var k in today){ todaySum += today[k]; }
      }
      var totalSum = 0, hasDay = false;
      for(var d in days){ if(days[d]) hasDay = true; }
      for(var k2 in total){ totalSum += total[k2]; }
      var set = function(id, v){ var e = document.getElementById(id); if(e) e.textContent = v; };
      set('cv-today', (todaySum === null) ? '-' : num(todaySum));
      set('cv-7', hasDay ? num(totalSum) : '-');
      var a = document.getElementById('cv-top-today');
      if(a) a.innerHTML = listHtml(today, '-');
      var b = document.getElementById('cv-top-7');
      if(b) b.innerHTML = listHtml(total, '-');
    }, function(){});
  }

  function paint(){ paintGames(); paintCourses(); }
  paint();
  setInterval(paint, 60000);
})();
