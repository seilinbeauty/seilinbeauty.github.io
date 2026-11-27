/* 다이아 — 스태프 전용 처리 공통 스크립트
   스태프 판별: 운영센터(dia-info.html)를 한 번이라도 연 브라우저(dia_no_track) 또는 관리자 인증(dia_shop_admin)
   · 메뉴 숨김: <a class="staff-only-nav"> 또는 data-staff-only
   · 개발 중 페이지: <body data-dev="1"> 이면 스태프가 아닐 때 개발 중 화면(#dev-soon)만 보여준다
*/
(function(){
  var staff = false;
  try {
    staff = localStorage.getItem('dia_no_track') === '1' || localStorage.getItem('dia_shop_admin') === '1';
  } catch(e){}
  window.DIA_STAFF = staff;

  function run(){
    if (!staff) {
      var nodes = document.querySelectorAll('.staff-only-nav, [data-staff-only]');
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        if (n.parentNode) n.parentNode.removeChild(n);
      }
      if (document.body && document.body.getAttribute('data-dev') === '1') {
        var soon = document.getElementById('dev-soon');
        var real = document.getElementById('dev-real');
        if (soon) soon.style.display = '';
        if (real) real.style.display = 'none';
      }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
