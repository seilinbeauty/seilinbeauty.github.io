/* 다이아 — 공개 모드 공통 스크립트
   · 2026-11-27 도현 님 지시: '앞으로는 비공개 없다. 다 공개.'
   · 스태프 판별·페이지 공개 스위치 없이 모든 메뉴와 개발 중 페이지를 그대로 보여준다
*/
(function(){
  window.DIA_STAFF = true;
  window.__diaPagesConfirmed = true;
  try { localStorage.removeItem('dia_pages_v1'); } catch(e){}

  function apply(){
    var nodes = document.querySelectorAll('.staff-only-nav, [data-staff-only]');
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.hasAttribute('hidden')) n.removeAttribute('hidden');
      if (n.style.display === 'none') n.style.display = '';
    }
    if (document.body && document.body.getAttribute('data-dev') === '1') {
      var soon = document.getElementById('dev-soon');
      var real = document.getElementById('dev-real');
      if (soon) soon.style.display = 'none';
      if (real) real.style.display = '';
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  else apply();
})();
