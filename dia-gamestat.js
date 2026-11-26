/* 운영 센터 — 미니게임 플레이 카드 (2026-11-26 커비)
   - 커뮤니티 홈(dia.html) 미니게임 3종(짝맞추기·반응속도·로또)을 연 횟수를 analytics/{날짜} 문서의
     game(전체)·g_mem·g_react·g_lotto 에서 읽어 보여 줍니다.
   - 방문자 카드(#ops-visit)와 파이어베이스 읽기 사용량 카드(#ops-fb) 사이에 들어갑니다.
     dia-fbstat.js 가 #ops-fb 를 붙이는 순서와 상관없이 자리를 잡도록, #ops-fb 가 생기면 그 앞에 넣습니다.
   - 읽기는 최근 7일 문서 7개만(1분마다). 무료 한도에 부담을 주지 않으려고 통계 모음 전체를 받지 않습니다.
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
    '.ops-gs-item{text-align:center;border:1px solid #f7eaef;border-radius:12px;background:#fffafc;padding:10px 6px 9px;}' +
    '.ops-gs-item b{display:block;font-size:22px;font-weight:900;color:#c2456a;line-height:1.1;letter-spacing:-.4px;}' +
    '.ops-gs-item span{display:block;margin-top:4px;font-size:11px;color:#9a8a90;font-weight:700;}' +
    '.ops-gs-sub{margin-top:10px;display:flex;gap:10px;flex-wrap:wrap;font-size:11.5px;color:#9a8a90;}' +
    '.ops-gs-sub b{color:#5c4a50;font-weight:800;}' +
    '.ops-gs-note{margin-top:9px;font-size:11px;color:#bfa7b1;line-height:1.55;}' +
    '@media (max-width:480px){.ops-gs-item b{font-size:19px;}.ops-gs-sub{gap:7px;font-size:11px;}}';
  document.head.appendChild(st);

  var box = document.createElement('div');
  box.className = 'ops-gs'; box.id = 'ops-gs';
  box.innerHTML =
    '<div class="ops-gs-hd"><span class="ops-gs-t">미니게임 플레이</span>' +
    '<span class="ops-gs-s">커뮤니티 홈 · 게임을 열 때 1회</span></div>' +
    '<div class="ops-gs-row">' +
      '<div class="ops-gs-item"><b id="gs-today">-</b><span>오늘 플레이</span></div>' +
      '<div class="ops-gs-item"><b id="gs-yday">-</b><span>어제 플레이</span></div>' +
      '<div class="ops-gs-item"><b id="gs-7">-</b><span>최근 7일 합계</span></div>' +
    '</div>' +
    '<div class="ops-gs-sub" id="gs-games"><span>짝맞추기 <b>-</b></span><span>반응속도 <b>-</b></span><span>로또 <b>-</b></span></div>' +
    '<div class="ops-gs-note">게임을 여는 순간 1회를 세고, 같은 판의 반복 클릭은 세지 않습니다. 집계를 시작하기 전 날짜는 - 로 표시합니다.</div>';

  // #ops-fb 가 생기면 그 앞에, 아직 없으면 방문자 카드 바로 뒤에 둔다 (자리가 늦게 잡히면 옮긴다)
  var placed = false;
  function place(){
    if(placed || !box.parentNode) return;
    var fb = document.getElementById('ops-fb');
    if(fb && fb.parentNode){
      if(!(box.nextElementSibling === fb)) fb.parentNode.insertBefore(box, fb);
      placed = true;
    }
  }
  anchor.parentNode.insertBefore(box, anchor.nextSibling);
  var tries = 0;
  var t = setInterval(function(){
    place();
    if(placed || ++tries > 60){ clearInterval(t); }
  }, 250);
  place();

  function fmt(n){ return (n === null || n === undefined) ? '-' : String(n); }
  function dayAgo(n){ return new Date(Date.now() + 9 * 3600 * 1000 - n * 86400000).toISOString().slice(0, 10); }
  function num(n){ return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  function paint(){
    if(document.hidden || box.offsetParent === null) return;
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
  paint();
  setInterval(paint, 60000);
})();
