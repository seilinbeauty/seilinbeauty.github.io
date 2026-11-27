/* 다이아 — 스태프 전용 처리 공통 스크립트
   · 스태프 판별: 운영센터(dia-info.html)를 한 번이라도 연 브라우저 또는 관리자 인증
   · 운영센터 '🔧 페이지 공개' 설정(analytics/dia_pages_v1)을 읽어, 공개된 페이지는 누구나 볼 수 있다
   · 페이지 쪽 사용법: <body data-dev="1"> + 개발 중 화면 #dev-soon / 실제 화면 #dev-real
*/
(function(){
  var PAGES_DOC = 'https://firestore.googleapis.com/v1/projects/seilindia/databases/(default)/documents/analytics/dia_pages_v1';
  var LS_PAGES = 'dia_pages_v1';

  var staff = false;
  try {
    staff = localStorage.getItem('dia_no_track') === '1' || localStorage.getItem('dia_shop_admin') === '1';
  } catch(e){}
  window.DIA_STAFF = staff;

  function cachedPublic(){
    try { var o = JSON.parse(localStorage.getItem(LS_PAGES) || '{}'); return (o && typeof o === 'object') ? o : {}; }
    catch(e){ return {}; }
  }
  // 파일명 → 공개 여부 키
  function keyOfFile(file){
    if (file === 'dia-shop.html') return 'shop';
    if (file === 'dia-jobs.html') return 'jobs';
    return null;
  }

  function apply(pub){
    var staffNow = staff;
    var here = (location.pathname.split('/').pop() || '').toLowerCase();
    var hereKey = keyOfFile(here);
    if (!staffNow && hereKey && pub[hereKey] && pub[hereKey].public) staffNow = true; // 이 페이지는 공개됨

    // 메뉴: 스태프 전용 메뉴는 스태프이거나 그 페이지가 공개일 때만 남긴다
    var nodes = document.querySelectorAll('.staff-only-nav, [data-staff-only]');
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var href = (n.getAttribute('href') || '').toLowerCase();
      var k = keyOfFile(href);
      var open = !!(k && pub[k] && pub[k].public);
      if (!staffNow && !open && n.parentNode) n.parentNode.removeChild(n);
    }

    // 개발 중 페이지: 공개로 바뀌면 일반 방문자도 내용을 본다
    if (document.body && document.body.getAttribute('data-dev') === '1') {
      var soon = document.getElementById('dev-soon');
      var real = document.getElementById('dev-real');
      var pubNow = !!(hereKey && pub[hereKey] && pub[hereKey].public);
      if (soon && real) {
        if (staffNow || pubNow) { soon.style.display = 'none'; real.style.display = ''; }
        else { soon.style.display = ''; real.style.display = 'none'; }
      }
    }
  }

  function run(){
    apply(cachedPublic());
    fetch(PAGES_DOC).then(function(r){ return r.ok ? r.json() : null; }).then(function(d){
      if (d && d.fields && d.fields.json && d.fields.json.stringValue) {
        var o = JSON.parse(d.fields.json.stringValue);
        if (o && typeof o === 'object') {
          try { localStorage.setItem(LS_PAGES, JSON.stringify(o)); } catch(e){}
          apply(o);
        }
      }
    }).catch(function(){});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
