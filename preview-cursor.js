/* 미리보기 마우스 위치 기록 (커비 · 2026-11-27)
   - 미리보기 화면에서 마우스가 어디를 짚고 있는지 2초마다 파이어스토어 한 문서에 남깁니다.
   - 모으는 것: 화면 안 좌표(px·%), 화면 크기, 스크롤, 짚고 있는 요소 이름, 마지막 클릭 위치.
   - 다른 사람에게는 아무것도 보내지 않고, 스태프 미리보기에서만 돕니다. */
(function(){
  try{
    var KEY = 'AIzaSyDQ1PusFvVlbgWyh0pU-2MoW7PzJZHNDKY';
    var URL_ = 'https://firestore.googleapis.com/v1/projects/seilindia/databases/(default)/documents/preview_cursor/live?key=' + KEY;
    var MASK = 'updateMask.fieldPaths=page&updateMask.fieldPaths=x&updateMask.fieldPaths=y' +
               '&updateMask.fieldPaths=px&updateMask.fieldPaths=py&updateMask.fieldPaths=vw' +
               '&updateMask.fieldPaths=vh&updateMask.fieldPaths=scroll&updateMask.fieldPaths=el' +
               '&updateMask.fieldPaths=clkX&updateMask.fieldPaths=clkY&updateMask.fieldPaths=clkEl' +
               '&updateMask.fieldPaths=ts&updateMask.fieldPaths=at';

    var page = (location.pathname.split('/').pop() || 'index.html');
    var x = -1, y = -1, el = '', scroll = 0;
    var clkX = -1, clkY = -1, clkEl = '';
    var timer = null, lastSent = 0;

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
    }, { passive: true });

    function s(v){ return { stringValue: String(v) }; }
    function i(v){ return { integerValue: String(v) }; }

    function send(){
      if (document.hidden) return;
      var now = Date.now();
      if (now - lastSent < 1900) return;
      lastSent = now;
      var w = window.innerWidth || 1, h = window.innerHeight || 1;
      var body = {
        fields: {
          page: s(page),
          x: i(x), y: i(y),
          px: i(Math.round((x / w) * 100)), py: i(Math.round((y / h) * 100)),
          vw: i(w), vh: i(h), scroll: i(scroll),
          el: s(el),
          clkX: i(clkX), clkY: i(clkY), clkEl: s(clkEl),
          ts: i(now),
          at: s(new Date(now).toISOString())
        }
      };
      fetch(URL_ + '&' + MASK, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        keepalive: true
      }).catch(function(){});
    }

    setTimeout(function(){ send(); timer = setInterval(send, 2000); }, 1200);
    window.addEventListener('pagehide', send);
  }catch(e){}
})();
