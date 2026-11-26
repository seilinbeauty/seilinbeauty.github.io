/* 다이아 공지·배너 — 운영 센터에서 저장한 문구를 페이지 위에 그대로 보여 준다 (2026-11-26 커비)
   저장 위치: meta/notices  { data: "{\"on\":true,\"title\":\"…\",\"body\":\"…\",\"targets\":[\"dia\",\"notice\",\"academy\"]}" }
   대상 이름: dia = 다이아 커뮤니티 홈(dia.html) · notice = 공지사항(dia-notice.html) · academy = 아카데미 홈(index.html)
   운영자가 켜지 않았거나 비어 있으면 아무것도 그리지 않는다. 문구는 저장된 글자 그대로 넣는다(의역 없음). */
(function(){
  function pageKey(){
    var p = location.pathname.split('/').pop();
    if(!p || p === 'index.html') return 'academy';
    if(p === 'dia.html') return 'dia';
    if(p === 'dia-notice.html') return 'notice';
    return '';
  }
  var key = pageKey();
  if(!key) return;

  function esc(s){
    return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, function(c){
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function render(title, body){
    if(document.getElementById('diaNoticeBar')) return;
    var bar = document.createElement('div');
    bar.id = 'diaNoticeBar';
    bar.style.cssText = 'background:#fdf1f5;border-bottom:1px solid #f3d9e3;padding:9px 14px;font-family:inherit;';
    var parts = [];
    parts.push('<div style="max-width:960px;margin:0 auto;display:flex;gap:8px;align-items:baseline;flex-wrap:wrap;word-break:keep-all;">');
    if(title) parts.push('<b style="font-size:13px;color:#33262a;flex:0 0 auto;">' + esc(title) + '</b>');
    if(body) parts.push('<span style="font-size:12.5px;color:#5b4a51;line-height:1.65;white-space:pre-wrap;">' + esc(body) + '</span>');
    parts.push('</div>');
    bar.innerHTML = parts.join('');
    if(document.body && document.body.firstChild){
      document.body.insertBefore(bar, document.body.firstChild);
    } else if(document.body){
      document.body.appendChild(bar);
    }
  }
  var 대기 = 0;
  function boot(){
    if(!(window.DiaFB && DiaFB.getMeta)){
      if(대기++ < 20) setTimeout(boot, 300);   // dia-fb.js(defer)가 붙기를 기다린다
      return;
    }
    DiaFB.getMeta('notices').then(function(m){
      if(!m || !m.on) return;
      var targets = m.targets || [];
      if(targets.indexOf(key) < 0) return;
      var title = String(m.title || '').trim();
      var body = String(m.body || '').trim();
      if(!title && !body) return;
      render(title, body);
    }, function(){});
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
