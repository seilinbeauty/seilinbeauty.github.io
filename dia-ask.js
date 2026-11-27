/* 상단 헤더 문의 버튼 비활성화 (2026-11-28 도현 님 지시: 전 페이지 상단 헤더 문의 제거) */
(function(){
  try {
    document.querySelectorAll('.dia-ask-btn, .ask-btn').forEach(function(el){ el.remove(); });
  } catch (e) {}
})();
