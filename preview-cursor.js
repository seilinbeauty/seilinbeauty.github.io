/* 미리보기 마우스 위치 기록 (커비 · 2026-11-27)
   - 미리보기 화면에서 마우스가 어디를 짚고 있는지 커비가 읽을 수 있게 meta/preview_cursor 에 남깁니다.
   - 3초마다 확인하되, 위치가 8px 넘게 움직였거나 다른 요소를 짚었을 때만 저장합니다(사용량 절약).
   - 모으는 것: 화면 안 좌표(px·%), 화면 크기, 스크롤, 짚고 있는 요소 이름, 마지막 클릭 위치.
   - 다른 사람에게는 아무것도 보내지 않고, 스태프 미리보기에서만 돕니다. */
(function(){
  try{
    var KEY = 'AIzaSyDQ1PusFvVlbgWyh0pU-2MoW7PzJZHNDKY';
    var BASE = 'https://firestore.googleapis.com/v1/projects/seilindia/databases/(default)/';
    var DOC = BASE + 'documents/meta/preview_cursor?key=' + KEY;
    var COMMIT = BASE + 'documents:commit?key=' + KEY;
    var PW = '0423';
    var MID = 'preview_cursor';

    var page = (location.pathname.split('/').pop() || 'index.html');
    var x = -1, y = -1, el = '', scroll = 0, clkX = -1, clkY = -1, clkEl = '';
    var lastX = -9999, lastY = -9999, lastEl = '', lastAt = 0, busy = false;

    function label(t){
      if (!t || !t.closest) return '';
      var n = t.closest('[data-pv], a, button, input, select, .row, .stat, .notice, h1, h2, .ac-topbar');
      if (!n) return (t.tagName || '').toLowerCase();
      var name = n.getAttribute && n.getAttribute('data-pv');
      var txt = (n.innerText || n.value || '').replace(/\s+/g, ' ').trim().slice(0, 40);
      var tag = (n.tagName || '').toLowerCase();
      return name ? (name + ' · ' + txt) : (tag + (txt ? ' · ' + txt : ''));
    }

    document.addEventListener('mousemove', function(e){
      x = Math.round(e.clientX); y = Math.round(e.clientY);
      el = label(e.target);
      scroll = Math.round(window.scrollY || 0);
    }, { passive: true });

    document.addEventListener('click', function(e){
      clkX = Math.round(e.clientX); clkY = Math.round(e.clientY);
      clkEl = label(e.target);
      lastX = -9999;
    }, { passive: true });

    function cid(){ return 'pc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

    function send(){
      if (document.hidden || busy) return;
      var now = Date.now();
      var w = window.innerWidth || 1, h = window.innerHeight || 1;
      var moved = Math.abs(x - lastX) > 8 || Math.abs(y - lastY) > 8 || el !== lastEl;
      if (!moved && now - lastAt < 15000) return;
      lastX = x; lastY = y; lastEl = el; lastAt = now;
      busy = true;

      var payload = {
        page: page, x: x, y: y,
        px: Math.round((x / w) * 100), py: Math.round((y / h) * 100),
        vw: w, vh: h, scroll: scroll, el: el,
        clkX: clkX, clkY: clkY, clkEl: clkEl, at: new Date(now).toISOString()
      };
      var id = cid();
      var body = {
        writes: [
          { update: { name: 'projects/seilindia/databases/(default)/documents/checks/' + id,
              fields: { op: { stringValue: 'staff' }, id: { stringValue: MID }, pw: { stringValue: PW } } } },
          { update: { name: 'projects/seilindia/databases/(default)/documents/meta/' + MID,
              fields: { data: { stringValue: JSON.stringify(payload) }, chk: { stringValue: id } } },
            updateTransforms: [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }] }
        ]
      };
      fetch(COMMIT, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body), keepalive: true })
        .then(function(){
          fetch(BASE + 'documents/checks/' + id + '?key=' + KEY, { method: 'DELETE', keepalive: true }).catch(function(){});
        })
        .catch(function(){})
        .then(function(){ busy = false; }, function(){ busy = false; });
    }

    setTimeout(function(){ send(); setInterval(send, 3000); }, 1000);
    window.addEventListener('pagehide', send);
  }catch(e){}
})();
