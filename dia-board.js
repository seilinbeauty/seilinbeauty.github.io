/* 공지 / 알림 게시판 목록 — 사이트 공용 (2026-11-26 커비)
   · 새 공지를 올릴 때는 아래 NOTICES 맨 앞에 한 줄을 더하면 홈 PC 패널·공지사항 페이지·게시판 페이지에 함께 반영됩니다.
   · date 가 '—' 인 것은 안내 페이지에 기준일 표기가 없어 비워 둔 것입니다(임의로 날짜를 만들지 않았습니다).
   · 글쓰기·등록 기능은 없습니다(읽기 전용). */
(function(){
  var NOTICES = [
    { no: 3, title: '완료패스 공지', date: '2026-11-23', kind: '완료패스', href: 'dia-pass.html', desc: '완료패스 부여 기준과 사용·인증 방법' },
    { no: 2, title: '휴식 공지', date: '—', kind: '휴식', href: 'dia-rest.html', desc: '휴식(💙) 신청과 유지 규칙' },
    { no: 1, title: '다이아 품앗이 가이드', date: '—', kind: '가이드', href: 'dia-guide.html', desc: '품앗이 참여부터 인증, 봉사까지 전체 규칙' }
  ];
  function esc(s){ return String(s === undefined || s === null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function rows(list){
    return list.map(function(n){
      return '<a class="bd-row" href="' + esc(n.href) + '">'
        + '<span class="bd-no">' + n.no + '</span>'
        + '<span class="bd-tt">' + esc(n.title) + '</span>'
        + '<span class="bd-dt">' + esc(n.date) + '</span>'
        + '</a>';
    }).join('');
  }
  // 홈 PC 패널에서는 안내 페이지(완료패스 공지·휴식 공지·다이아 품앗이 가이드)를 빼고 알림만 보여 준다.
  var HIDE_IN_PANEL = { '완료패스': 1, '휴식': 1, '가이드': 1 };
  function panelList(){
    return NOTICES.filter(function(n){ return !HIDE_IN_PANEL[n.kind]; });
  }
  // 여러 줄 목록 (홈 패널·공지사항 페이지 섹션)
  function renderList(el, max){
    if(!el) return;
    var src = panelList();
    var list = src.slice(0, max || src.length);
    el.innerHTML = list.length ? rows(list) : '<div class="bd-empty">새 소식이 없습니다</div>';
  }
  // 게시판 페이지 (10줄씩 페이지 넘김)
  function renderBoard(el, pager, page){
    if(!el) return;
    var size = 10, total = NOTICES.length;
    var pages = Math.max(1, Math.ceil(total / size));
    page = Math.min(Math.max(1, page || 1), pages);
    var start = (page - 1) * size;
    var list = NOTICES.slice(start, start + size);
    el.innerHTML = list.length ? rows(list) : '<div class="bd-empty">아직 올라온 공지가 없습니다.</div>';
    if(pager){
      var h = '';
      for(var p = 1; p <= pages; p++){
        h += '<button type="button" class="bd-pg' + (p === page ? ' is-on' : '') + '" data-pg="' + p + '">' + p + '</button>';
      }
      pager.innerHTML = pages > 1 ? h : '';
      var btns = pager.querySelectorAll('.bd-pg');
      for(var i = 0; i < btns.length; i++){
        btns[i].addEventListener('click', function(){
          var map = { list: el, pager: pager };
          renderBoard(map.list, map.pager, Number(this.getAttribute('data-pg')));
        });
      }
    }
  }
  window.DiaBoard = { list: NOTICES, renderList: renderList, renderBoard: renderBoard, esc: esc };
})();
