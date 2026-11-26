/* 사이드바 '공지사항' 접이식 — 품앗이 가이드 / 완료패스 공지 / 휴식 공지 / 공지 · 알림 */
(function () {
  var CSS = [
    '.nav-fold{width:100%;display:flex;align-items:center;gap:6px;background:none;border:0;font:inherit;text-align:left;cursor:pointer;}',
    '.nav-fold .nav-caret{margin-left:auto;font-size:10px;color:#b9a3ad;transition:transform .22s ease;}',
    '.nav-fold.is-open{color:#d55576;}',
    '.nav-fold.is-open .nav-caret{transform:rotate(180deg);color:#d55576;}',
    '.nav-sub{max-height:0;overflow:hidden;transition:max-height .26s ease;background:#fcfbfc;}',
    '.nav-sub.is-open{max-height:260px;}',
    '.nav-sub-link{display:block;position:relative;padding:9px 18px 9px 30px;font-size:12.5px;font-weight:600;color:#7d8a91;text-decoration:none;line-height:1.3;word-break:keep-all;}',
    '.nav-sub-link:before{content:"";position:absolute;left:19px;top:50%;width:5px;height:5px;margin-top:-2.5px;border-radius:50%;background:#e6ccd6;}',
    '.nav-sub-link:hover{color:#d55576;background:#fdf1f4;}',
    '.nav-sub-link.is-here{color:#d55576;font-weight:800;}',
    '@media (max-width:880px){.nav-sub{display:none !important;}.nav-fold .nav-caret{display:none;}}'
  ].join('');
  var ITEMS = [
    ['dia-guide.html', '품앗이 가이드'],
    ['dia-pass.html', '완료패스 공지'],
    ['dia-rest.html', '휴식 공지'],
    ['dia-board-notice.html', '공지 · 알림']
  ];
  function start() {
    if (!document.getElementById('diaNavFoldCss')) {
      var st = document.createElement('style');
      st.id = 'diaNavFoldCss';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    var links = document.querySelectorAll('a.board-nav-link[href="dia-notice.html"]');
    if (!links.length) return;
    var here = location.pathname.split('/').pop() || 'dia.html';
    Array.prototype.forEach.call(links, function (a) {
      if (a.parentNode.querySelector('.nav-fold')) return;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'board-nav-link nav-fold';
      btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML = a.innerHTML.replace(/\s+/g, ' ').trim() + '<span class="nav-caret">▼</span>';
      var box = document.createElement('div');
      box.className = 'nav-sub';
      box.id = 'diaNavSub';
      box.innerHTML = ITEMS.map(function (it) {
        return '<a class="nav-sub-link' + (it[0] === here ? ' is-here' : '') + '" href="' + it[0] + '">' + it[1] + '</a>';
      }).join('');
      var open = ITEMS.some(function (it) { return it[0] === here; });
      if (open) { btn.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); box.classList.add('is-open'); }
      btn.addEventListener('click', function () {
        var on = btn.classList.toggle('is-open');
        box.classList.toggle('is-open', on);
        btn.setAttribute('aria-expanded', on ? 'true' : 'false');
      });
      a.parentNode.insertBefore(btn, a);
      a.parentNode.insertBefore(box, a.nextSibling);
      a.parentNode.removeChild(a);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
