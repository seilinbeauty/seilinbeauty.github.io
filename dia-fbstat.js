/* 운영 센터 — 파이어베이스 읽기 사용량 카드 (2026-11-24 커비)
   - 무료 Spark 한도(하루 문서 읽기 5만 건) 대비 오늘 얼마나 썼는지 보여줍니다.
   - 값을 세는 곳: 참여 링크 화면이 파이어스토어에서 그날 목록을 읽을 때마다 그 문서 수만큼
     stats/{날짜} 문서에 더합니다(사이트 자체 집계). 서버·유료 기능 없이 이 방식만 씁니다.
   - 운영 센터(dia-info.html)의 '방문자' 칸 아래에 붙습니다. dia-fb.js 가 먼저 불려 있어야 합니다. */
(function(){
  var FB = window.DiaFB;
  var anchor = document.querySelector('#ops-stats .ops-kpi') || document.getElementById('ops-visit');
  if(!FB || !anchor || document.getElementById('ops-fb')) return;

  var LIMIT = 50000; // 무료 한도: 하루 문서 읽기 5만 건
  var st = document.createElement('style');
  st.textContent =
    '.ops-fb{margin:0 0 14px;border:1px solid #f0e2e7;border-radius:16px;background:#fff;padding:15px 16px 13px;box-sizing:border-box;}' +
    '.ops-fb-hd{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}' +
    '.ops-fb-t{font-size:13px;font-weight:800;color:#4a353c;}' +
    '.ops-fb-s{font-size:11.5px;font-weight:700;color:#bfa7b1;}' +
    '.ops-fb-row{display:flex;align-items:flex-end;gap:10px;flex-wrap:wrap;margin-top:10px;}' +
    '.ops-fb-n{font-size:26px;font-weight:900;color:#c2456a;line-height:1;letter-spacing:-.5px;}' +
    '.ops-fb-n small{font-size:12px;font-weight:700;color:#b08a97;margin-left:4px;letter-spacing:0;}' +
    '.ops-fb-p{margin-left:auto;font-size:12.5px;font-weight:800;color:#6a5a60;}' +
    '.ops-fb-bar{margin-top:10px;height:8px;border-radius:999px;background:#f7eef1;overflow:hidden;}' +
    '.ops-fb-bar i{display:block;height:100%;width:0;border-radius:999px;background:linear-gradient(90deg,#ffb3c9,#ff5d8f);transition:width .4s;}' +
    '.ops-fb-bar.warn i{background:linear-gradient(90deg,#ffd0a8,#e8890c);}' +
    '.ops-fb-bar.hot i{background:linear-gradient(90deg,#ffb0b0,#d23b5e);}' +
    '.ops-fb-sub{margin-top:9px;display:flex;gap:12px;flex-wrap:wrap;font-size:11.5px;color:#9a8a90;}' +
    '.ops-fb-sub b{color:#5c4a50;font-weight:800;}' +
    '.ops-fb-note{margin-top:9px;font-size:11px;color:#bfa7b1;line-height:1.55;}';
  document.head.appendChild(st);

  var box = document.createElement('div');
  box.className = 'ops-fb'; box.id = 'ops-fb';
  box.setAttribute('data-ops-sec', 'fb');
  box.setAttribute('data-ops-title', '파이어베이스 읽기 사용량');
  box.innerHTML =
    '<div class="ops-fb-hd"><span class="ops-fb-t">파이어베이스 읽기 사용량</span>' +
    '<span class="ops-fb-s">무료 한도 하루 5만 건 (Spark)</span></div>' +
    '<div class="ops-fb-row"><div class="ops-fb-n" id="fb-n">-</div><div class="ops-fb-p" id="fb-p"></div></div>' +
    '<div class="ops-fb-bar" id="fb-bar"><i id="fb-fill"></i></div>' +
    '<div class="ops-fb-sub" id="fb-sub"></div>' +
    '<div class="ops-fb-note">무료 한도는 하루 단위로 매일 0시(한국)에 새로 주어집니다. 오늘 0시부터 지금까지 참여 링크 화면이 파이어스토어에서 읽은 문서 수입니다. 사이트가 직접 세는 값이라 암호 확인용 읽기는 빠져 있어 실제보다 조금 적게 나옵니다.</div>';
  anchor.parentNode.insertBefore(box, anchor);
  if(window.__OPS_LAYOUT_REFRESH__) window.__OPS_LAYOUT_REFRESH__();

  function comma(n){ return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function dayAgo(n){ return new Date(Date.now() + 9 * 3600 * 1000 - n * 86400000).toISOString().slice(0, 10); }

  function paint(){
    var t = FB.kstDay();
    Promise.all([FB.stat(t), FB.stat(dayAgo(1))]).then(function(r){
      var today = r[0] || 0, yday = r[1] || 0;
      var pct = Math.min(100, (today / LIMIT) * 100);
      document.getElementById('fb-n').innerHTML = comma(today) + '<small>건</small>';
      document.getElementById('fb-p').textContent = '한도의 ' + (pct < 0.1 ? '0.1' : pct.toFixed(1)) + '%';
      var bar = document.getElementById('fb-bar');
      bar.className = 'ops-fb-bar' + (pct >= 80 ? ' hot' : (pct >= 50 ? ' warn' : ''));
      document.getElementById('fb-fill').style.width = (pct < 0.5 && today > 0 ? 0.5 : pct) + '%';
      document.getElementById('fb-sub').innerHTML =
        '<span>남은 한도 <b>' + comma(Math.max(0, LIMIT - today)) + '건</b></span>' +
        '<span>어제 <b>' + comma(yday) + '건</b></span>' +
        '<span>한도 <b>매일 0시에 새로</b></span>';
    });
  }
  paint();
  setInterval(function(){ if(!document.hidden) paint(); }, 60000);
})();
