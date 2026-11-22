/* 다이아 머리글 '문의하기' 버튼 + 안내 창
   - 머리글 오른쪽 '입장하기' 왼쪽에 '문의하기'를 붙이고, 누르면 오픈채팅 입장 안내 창이 열립니다.
   - 왼쪽 메뉴 아래 있던 같은 안내 네모칸(side-set)은 숨깁니다.
   - 기존 머리글 코드는 고치지 않고 이 파일이 스스로 붙입니다. */
(function(){
  var DM = 'https://ig.me/m/seilin_beauty.pr';
  var KAKAO = 'https://open.kakao.com/o/gQOf8yAf';
  var header = document.querySelector('header.dia-header');
  if(!header) return;

  var css = document.createElement('style');
  css.textContent = [
    '.side-set{display:none !important;}',
    '.ask-btn{cursor:pointer;font-family:inherit;}',
    '.ask-btn .ask-ic{margin-right:4px;font-size:13px;line-height:1;}',
    '.ask-pop{position:fixed;z-index:1000;top:72px;right:16px;width:300px;max-width:calc(100vw - 24px);box-sizing:border-box;padding:18px 18px 16px;border-radius:18px;background:#fff;border:1px solid #f2dbe3;box-shadow:0 14px 40px rgba(156,52,86,.18);text-align:center;opacity:0;transform:translateY(-6px);pointer-events:none;transition:opacity .16s,transform .16s;}',
    '.ask-pop.show{opacity:1;transform:none;pointer-events:auto;}',
    '.ask-pop *{box-sizing:border-box;}',
    '.ask-x{position:absolute;top:8px;right:10px;width:28px;height:28px;border:0;background:none;color:#b9a9af;font-size:18px;cursor:pointer;line-height:1;}',
    '.ask-av{width:56px;height:56px;border-radius:50%;object-fit:cover;border:2px solid #fde3ec;}',
    '.ask-h{margin-top:8px;font-size:16px;font-weight:900;color:#33262a;}',
    '.ask-d{margin-top:6px;font-size:13.5px;line-height:1.65;color:#6a5a60;word-break:keep-all;}',
    '.ask-d b{color:#c2456a;}',
    '.ask-go{margin-top:14px;display:flex;align-items:center;justify-content:center;gap:6px;height:46px;border-radius:14px;background:#ff5d8f;color:#fff !important;font-size:15px;font-weight:900;text-decoration:none;box-shadow:0 6px 16px rgba(255,93,143,.28);}',
    '.ask-sub{margin-top:8px;display:flex;align-items:center;justify-content:center;height:40px;border-radius:12px;border:1px solid #f0d7e0;background:#fff8fa;color:#b3476a !important;font-size:13.5px;font-weight:800;text-decoration:none;}',
    '.ask-dim{position:fixed;inset:0;z-index:999;background:rgba(40,20,28,.18);opacity:0;pointer-events:none;transition:opacity .16s;}',
    '.ask-dim.show{opacity:1;pointer-events:auto;}',
    /* 휴대폰 머리글: 버튼 3개가 로고를 덮지 않게 작게 */
    '@media (max-width:880px){header.dia-header .nav-mobile-links{gap:5px !important;}header.dia-header .nav-mobile-link{height:32px !important;padding:0 10px !important;font-size:12px !important;border-radius:16px !important;}header.dia-header .nav-mobile-link svg{width:12px;height:12px;margin-right:3px !important;}.ask-btn .ask-long{display:none;}header.dia-header .brand{min-width:0;}header.dia-header .brand-sub{display:block;max-width:calc(100vw - 255px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}}',
    '@media (min-width:881px){.ask-btn .ask-short{display:none;}}',
    '@media (max-width:880px){.ask-pop{top:auto;bottom:16px;left:12px;right:12px;width:auto;max-width:none;margin:0 auto;}.ask-pop.show{transform:none;}}'
  ].join('');
  document.head.appendChild(css);

  var dim = document.createElement('div'); dim.className = 'ask-dim';
  var pop = document.createElement('div'); pop.className = 'ask-pop'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', '참여 문의');
  pop.innerHTML =
    '<button type="button" class="ask-x" aria-label="닫기">×</button>' +
    '<img class="ask-av" src="images/ig-profile.png?v=2" alt="" onerror="this.style.display=\'none\'">' +
    '<div class="ask-h">다이아 커뮤니티 참여 문의</div>' +
    '<div class="ask-d">오픈채팅방 입장은 <b>문의</b> 주세요.<br>참여 코드와 참여 방법을<br>차례로 안내해 드립니다.</div>' +
    '<a class="ask-go" href="' + DM + '" target="_blank" rel="noopener">💌 인스타 DM으로 문의하기</a>' +
    '<a class="ask-sub" href="' + KAKAO + '" target="_blank" rel="noopener">오픈채팅 바로 가기</a>';
  document.body.appendChild(dim); document.body.appendChild(pop);

  function open(){ dim.classList.add('show'); pop.classList.add('show'); }
  function close(){ dim.classList.remove('show'); pop.classList.remove('show'); }
  dim.addEventListener('click', close);
  pop.querySelector('.ask-x').addEventListener('click', close);
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') close(); });

  // '입장하기'(오픈채팅 링크) 왼쪽에 붙이기 — PC 메뉴와 휴대폰 메뉴 둘 다
  [['.nav-links', 'nav-dia'], ['.nav-mobile-links', 'nav-mobile-link']].forEach(function(p){
    var wrap = header.querySelector(p[0]); if(!wrap || wrap.querySelector('.ask-btn')) return;
    var b = document.createElement('a');
    b.href = DM; b.className = p[1] + ' ask-btn'; b.setAttribute('role', 'button');
    b.innerHTML = '<span class="ask-ic">💌</span><span class="ask-long">문의하기</span><span class="ask-short">문의</span>';
    b.addEventListener('click', function(e){ e.preventDefault(); open(); });
    var kakao = wrap.querySelector('a[href*="open.kakao"]');
    wrap.insertBefore(b, kakao || wrap.firstChild);
  });
})();
