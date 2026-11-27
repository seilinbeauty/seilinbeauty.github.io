/* 미리보기 자동 반영 (커비 · 2026-11-27)
   - 커비가 미리보기 화면을 고쳐서 올리면, 열어 둔 화면이 5초 안에 새로고침 없이 바뀝니다.
   - 파일 지문(ETag)만 확인하므로 사용량이 거의 들지 않습니다.
   - 바뀌면 보던 위치를 기억해 그 자리에서 다시 그리고, 오른쪽 아래에 '새로 반영됨'을 잠깐 띄웁니다. */
(function(){
  try{
    var here = location.pathname + (location.search || '');
    var base = null, timer = null;

    function badge(txt){
      var d = document.createElement('div');
      d.textContent = txt;
      d.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:9999;font:400 10px/1 Roboto,sans-serif;' +
        'letter-spacing:1.2px;text-transform:uppercase;color:#fff;background:#c9707f;padding:8px 12px;' +
        'border-radius:999px;opacity:0;transition:opacity .3s;';
      document.body.appendChild(d);
      requestAnimationFrame(function(){ d.style.opacity = '1'; });
      setTimeout(function(){ d.style.opacity = '0'; setTimeout(function(){ d.remove(); }, 400); }, 2200);
    }

    function stamp(){
      return fetch(here, { method: 'HEAD', cache: 'no-store' })
        .then(function(r){ return r.headers.get('etag') || r.headers.get('last-modified') || ''; })
        .catch(function(){ return ''; });
    }

    function restore(){
      var y = 0;
      try{ y = parseInt(sessionStorage.getItem('pv_scroll') || '0', 10) || 0; }catch(e){}
      if (y > 0) { window.scrollTo(0, y); badge('새로 반영됨'); }
      try{ sessionStorage.removeItem('pv_scroll'); }catch(e){}
    }

    function tick(){
      stamp().then(function(s){
        if (!s) return;
        if (base === null) { base = s; return; }
        if (s !== base) {
          try{ sessionStorage.setItem('pv_scroll', String(Math.round(window.scrollY || 0))); }catch(e){}
          location.reload();
        }
      });
    }

    restore();
    setTimeout(function(){ tick(); timer = setInterval(function(){ if (!document.hidden) tick(); }, 5000); }, 1500);
  }catch(e){}
})();
