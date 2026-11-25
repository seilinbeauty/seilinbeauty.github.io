/* 다이아 “내 품앗이”: 오늘 내 링크 남기기
   - “내 품앗이”에서 본인을 고르면(로그인) 닉네임이 자동으로 들어갑니다.
   - 2026-11-24부터 읽기·쓰기를 파이어베이스 파이어스토어로 합니다(dia-fb.js).
     · 목록: links 모음에서 오늘 문서만 받아 온다
     · 남기기·고치기·지우기: 본인 4자리 암호 확인(보안 규칙)을 거친다
     · closed(09:00~21:00 밖) · dup_url(같은 날 같은 주소) · bad_pin(암호 다름)은 그대로 안내한다.
   - 파이어베이스 연결이 안 되면 예전처럼 창고(구글 앱스크립트)로 대신 갑니다.
   - 목록 화면: dia-link.html (같은 창고 서버를 봅니다) */
(function(){
  var EXEC = 'https://script.google.com/macros/s/AKfycbxLu7nD0RH1FkCKdmgQkP7AybLKit34KN9ISnuW_pHwYrLW7EaqsWddNWBSGWfJ0S-V5A/exec';
  var LG_KEY = 'dia_login_member';
  var box = document.getElementById('diaLinkBox');
  if(!box) return;

  function kst(){ return new Date(Date.now() + 9 * 3600 * 1000); }
  function today(){ return kst().toISOString().slice(0, 10); }
  function isOpen(){ return true; }
  function tagText(){
    if(window.DiaTag) return window.DiaTag.today(); // 운영 센터에서 바꾼 모양
    var d = kst(); return '#' + String(d.getUTCMonth() + 1).padStart(2, '0') + String(d.getUTCDate()).padStart(2, '0') + '_행운을부탁해';
  }
  function api(q){
    if(!window.fetch) return Promise.reject(new Error('nosupport'));
    return fetch(EXEC + '?' + q + '&_=' + Date.now(), { cache: 'no-store' }).then(function(r){ return r.json(); });
  }
  function me(){
    try{
      var raw = localStorage.getItem(LG_KEY) || localStorage.getItem(LG_KEY + '_bak') || '';
      if(!raw) return '';
      if(raw.charAt(0) === '{'){ var o = JSON.parse(raw); return (o && o.n) ? String(o.n) : ''; }
      return String(raw);
    }catch(e){ return ''; }
  }
  function pinOf(nick){ return window.DiaPin && nick ? window.DiaPin.remembered(nick) : ''; }
  function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function clean(u){
    var m = String(u || '').trim().match(/https?:\/\/(www\.)?instagram\.com\/(p|reel|reels|tv)\/[A-Za-z0-9_-]+/i);
    return m ? m[0].replace(/^http:/i, 'https:').replace(/\/reels\//i, '/reel/') + '/' : '';
  }
  function qs(o){
    var a = [];
    for(var k in o){ if(o[k] !== undefined && o[k] !== null) a.push(k + '=' + encodeURIComponent(o[k])); }
    return a.join('&');
  }

  // 오늘 내 링크(서버) — 창고에서 받아 둔 목록
  var items = [];
  function load(){ return items; }
  // link_list 는 시트 열 이름으로 돌려주므로 화면용 이름으로 맞춘다
  function norm(it){
    return {
      row: it.row, date: it['날짜'] || it.date || '', no: it['번호'] || it.no || '',
      shop: it['샵이름'] || it.shop || '', kind: it['구분'] || it.kind || '',
      url: it['게시물주소'] || it.url || '', t: (it['등록시각'] ? String(it['등록시각']).slice(11, 16) : (it.t || '')),
      memo: (it['메모'] === undefined ? (it.memo || '') : it['메모'])
    };
  }
  // 어디서 읽었는지 — 'fb'(파이어베이스) / 'wh'(창고). 읽은 곳으로 써야 줄이 맞는다.
  var src = 'fb';
  function whMine(nick, pin){
    src = 'wh';
    if(!pin){ items = []; return Promise.resolve(false); }
    return api(qs({ mode:'link_list', shop:nick, pin:pin, date:today() }))
      .then(function(d){
        if(d && d.ok && d.items && d.items.length !== undefined){
          items = d.items.map(norm).filter(function(it){ return it.shop === nick; });
          return true;
        }
        items = []; return false;
      })
      .catch(function(){ return false; });
  }
  function fetchMine(){
    var nick = me(), pin = pinOf(nick);
    if(!nick){ items = []; return Promise.resolve(false); }
    if(window.DiaFB){
      if(pin) window.DiaFB.ensurePin(nick, pin); // 처음 남기는 회원이면 암호 문서를 만들어 둔다
      return window.DiaFB.day(today()).then(function(list){
        src = 'fb';
        items = (list || []).map(norm).filter(function(it){ return it.shop === nick; });
        return true;
      }, function(){ return whMine(nick, pin); });
    }
    return whMine(nick, pin);
  }
  // 오늘 내 차례 번호(번호) — 화면에는 안 보이고 문서에만 남는다
  function nextNo(nick){
    var mx = 0;
    items.forEach(function(it){ var n = parseInt(it.no, 10); if(it.shop === nick && n > mx) mx = n; });
    return mx + 1;
  }
  // 쓰기 — 파이어베이스가 안 되면 창고로 대신한다
  function whAdd(nick, pin, kind, url){ return api(qs({ mode:'link_add', shop:nick, pin:pin, kind:kind, url:url })); }
  function sendAdd(nick, pin, kind, url){
    if(!window.DiaFB || src === 'wh') return whAdd(nick, pin, kind, url);
    return window.DiaFB.add({ date:today(), shop:nick, pin:pin, kind:kind, url:url, no:nextNo(nick) })
      .then(function(r){
        if(r && r.ok) return r;
        if(r && r.error === 'net') return whAdd(nick, pin, kind, url);
        return r;
      });
  }
  function whEdit(nick, pin, it, kind, url){ return api(qs({ mode:'link_add', shop:nick, pin:pin, row:it.row, kind:kind, url:url })); }
  function sendEdit(nick, pin, it, kind, url){
    if(!window.DiaFB || src === 'wh') return whEdit(nick, pin, it, kind, url);
    return window.DiaFB.edit({ id:it.row, date:it.date || today(), shop:nick, pin:pin, kind:kind, url:url, no:it.no || nextNo(nick) })
      .then(function(r){
        if(r && r.ok) return r;
        if(r && r.error === 'net') return whEdit(nick, pin, it, kind, url);
        return r;
      });
  }
  function whDel(nick, pin, it){ return api(qs({ mode:'link_del', shop:nick, pin:pin, row:it.row })); }
  function sendDel(nick, pin, it){
    if(!window.DiaFB || src === 'wh') return whDel(nick, pin, it);
    return window.DiaFB.del({ id:it.row, shop:nick, pin:pin })
      .then(function(r){
        if(r && r.ok) return r;
        if(r && r.error === 'net') return whDel(nick, pin, it);
        return r;
      });
  }

  var css = document.createElement('style');
  css.textContent = [
    '#diaLinkBox{margin-top:10px;align-self:stretch;width:auto;max-width:100%;min-width:0;box-sizing:border-box;}',
    '#diaLinkBox[hidden]{display:none;}',
    '#diaLinkBox *{box-sizing:border-box;}',
    /* PC 화면: 위쪽 공지사항·내 품앗이·뷰티수강 버튼 크게 (휴대폰은 그대로) */
    '@media (min-width:881px){body.dia-page .quick-links{gap:10px !important;}body.dia-page .quick-links > a,body.dia-page .quick-links > button{height:46px !important;min-height:46px !important;min-width:118px !important;padding:0 22px !important;font-size:15px !important;font-weight:800 !important;border-radius:23px !important;display:inline-flex !important;align-items:center !important;justify-content:center !important;}}',
    /* 활동기록 박스(mcHeroStatus) 안 맨 위에 붙을 때: 한 박스처럼 보이게 테두리 없이 */
    '#mcHeroStatus > #diaLinkBox{margin:0 0 8px;}',
    '#mcHeroStatus > #diaLinkBox .dl{border:0;border-bottom:1px dashed #f0dce3;border-radius:0;padding:8px 2px 12px;background:transparent;}',
    '.dl{width:100%;max-width:100%;min-width:0;padding:12px 13px 13px;border-radius:12px;background:#fff;border:1.5px solid #f6c9d7;text-align:left;overflow-wrap:anywhere;word-break:keep-all;}',
    '.dl-h{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;}',
    '.dl-t{font-size:14px;font-weight:900;color:#c2456a;}',
    '.dl-badge{font-size:10.5px;font-weight:800;border-radius:999px;padding:2px 8px;color:#fff;background:#ff5d8f;}',
    '.dl-badge.off{background:#b9aab0;}',
    '.dl-me{margin-top:6px;font-size:12px;color:#7a6a70;}',
    '.dl-me b{color:#33262a;}',
    '.dl-tag{margin-top:6px;display:flex;align-items:center;gap:6px;font-size:12px;color:#7a6a70;flex-wrap:wrap;}',
    '.dl-tag b{font-size:13.5px;color:#33262a;}',
    '.dl-mini{padding:2px 8px;border-radius:8px;border:1px solid #f0c8d5;background:#fff8fa;color:#b3476a;font-size:11px;font-weight:800;cursor:pointer;font-family:inherit;}',
    '.dl-kinds{margin-top:9px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;}',
    '.dl-kind{height:34px;border-radius:9px;border:1px solid #f0dce3;background:#fff;font-size:12.5px;font-weight:800;color:#6a5a60;cursor:pointer;font-family:inherit;padding:0 2px;}',
    '.dl-kind.on{border-color:#ff5d8f;background:#ff5d8f;color:#fff;}',
    '.dl-f{margin-top:6px;display:flex;gap:6px;}',
    '.dl-f input{flex:1 1 auto;min-width:0;height:38px;padding:0 11px;border:1px solid #f0e2e7;border-radius:9px;font-size:14px;font-family:inherit;color:#4a4a4a;background:#fff;outline:none;}',
    '.dl-f input:focus{border-color:#e6a6bb;}',
    '.dl-f button{flex:0 0 auto;height:38px;padding:0 16px;border:0;border-radius:9px;background:#ff5d8f;color:#fff;font-size:14px;font-weight:900;font-family:inherit;cursor:pointer;}',
    '.dl-f button[disabled]{opacity:.55;cursor:default;}',
    '.dl-msg{margin-top:7px;font-size:12.5px;font-weight:700;line-height:1.55;min-height:0;}',
    '.dl-msg.err{color:#d23b5e;}',
    '.dl-msg.ok{color:#24734a;background:#eefaf2;border:1px solid #bfe6cb;border-radius:9px;padding:7px 10px;}',
    '.dl-mine{margin-top:10px;font-size:12px;color:#7a6a70;}',
    '.dl-mine-t{font-size:12.5px;font-weight:900;color:#4a353c;margin-bottom:4px;}',
    '.dl-mi{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:7px 9px;margin-top:5px;border:1px solid #f4e7ec;border-radius:9px;background:#fffafc;}',
    '.dl-mi-k{flex:0 0 auto;padding:1px 7px;border-radius:7px;background:#fff0f4;color:#b3476a;font-size:11px;font-weight:800;}',
    '.dl-mi-u{flex:1 1 120px;min-width:0;font-size:11.5px;color:#7a6a70;text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    '.dl-mi-t{font-size:11px;color:#a99aa0;}',
    '.dl-mi-q{flex:1 1 auto;font-size:12px;font-weight:800;color:#d23b5e;}',
    '.dl-ma{display:flex;gap:4px;margin-left:auto;}',
    '.dl-mi.edit{display:block;}',
    '.dl-mk{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px;}',
    '.dl-mk-b{height:30px;border-radius:8px;border:1px solid #f0dce3;background:#fff;font-size:11.5px;font-weight:800;color:#6a5a60;cursor:pointer;font-family:inherit;padding:0 2px;}',
    '.dl-mk-b.on{border-color:#ff5d8f;background:#ff5d8f;color:#fff;}',
    '.dl-mu{margin-top:6px;width:100%;height:34px;padding:0 10px;border:1px solid #e6a6bb;border-radius:8px;font-size:13px;font-family:inherit;outline:none;}',
    '.dl-mi.edit .dl-ma{margin-top:6px;justify-content:flex-end;}',
    '.dl-me-err{font-size:11.5px;font-weight:700;color:#d23b5e;}',
    '.dl-foot{margin-top:10px;display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;}',
    '.dl-list{display:inline-block;padding:4px 12px;border-radius:999px;background:rgba(255,93,143,.09);font-size:13px;font-weight:900;color:#ff2e73;text-decoration:none;text-shadow:0 0 8px rgba(255,93,143,.55);box-shadow:0 0 12px rgba(255,93,143,.42),0 0 24px rgba(255,143,179,.32);animation:dlGlow 2.2s ease-in-out infinite;}',
    '@keyframes dlGlow{0%,100%{box-shadow:0 0 10px rgba(255,93,143,.32),0 0 20px rgba(255,143,179,.24);}50%{box-shadow:0 0 16px rgba(255,46,115,.62),0 0 30px rgba(255,93,143,.48);}}',
    '@media (max-width:420px){.dl-kinds,.dl-mk{grid-template-columns:repeat(2,minmax(0,1fr));}}'
  ].join('');
  document.head.appendChild(css);

  // 활동기록 박스 안 맨 위로 옮겨 한 박스로 보이게 (그 박스는 로그인 때마다 다시 그려지므로 계속 지켜본다)
  var hs = document.getElementById('mcHeroStatus');
  function dock(){
    if(!hs || box.hidden || hs.hidden) return;
    if(hs.firstChild !== box) hs.insertBefore(box, hs.firstChild);
  }
  if(hs && window.MutationObserver){
    new MutationObserver(function(){ if(!box.hidden && !hs.hidden && hs.firstChild !== box) dock(); })
      .observe(hs, { childList: true, attributes: true, attributeFilter: ['hidden'] });
  }

  var kind = '', shownFor = null, busy = false;
  function paint(){
    var nick = me();
    if(!nick){ box.hidden = true; box.innerHTML = ''; shownFor = null; items = []; return; }
    box.hidden = false;
    dock();
    if(shownFor === nick){ refresh(); return; }
    shownFor = nick; kind = ''; editKey = null; delKey = null;
    box.innerHTML =
      '<div class="dl">' +
        '<div class="dl-h"><span class="dl-t">📎 오늘 내 링크 남기기</span><span class="dl-badge" id="dlBadge"></span></div>' +
        '<div class="dl-me">닉네임 <b>' + esc(nick) + '</b> (“내 품앗이”에서 고른 이름으로 남아요)</div>' +
        '<div class="dl-tag">오늘 해시태그 <b id="dlTag"></b><button type="button" class="dl-mini" id="dlTagCopy">복사</button></div>' +
        '<div class="dl-kinds" id="dlKinds">' +
          '<button type="button" class="dl-kind" data-k="🤍">🤍 일반</button>' +
          '<button type="button" class="dl-kind" data-k="릴스">릴스</button>' +
        '</div>' +
        '<form class="dl-f" id="dlForm" autocomplete="off"><input id="dlUrl" inputmode="url" placeholder="게시물 주소 붙여 넣기"><button type="submit">남기기</button></form>' +
        '<div class="dl-msg" id="dlMsg"></div>' +
        '<div class="dl-mine" id="dlMine"></div>' +
        '<div class="dl-foot"><a class="dl-list" href="dia-link.html">오늘 참여 링크 보기</a>' + '</div>' +
      '</div>';
    document.getElementById('dlKinds').addEventListener('click', function(e){
      var b = e.target.closest('.dl-kind'); if(!b) return;
      kind = b.getAttribute('data-k');
      [].forEach.call(box.querySelectorAll('.dl-kind'), function(x){ x.classList.toggle('on', x === b); });
    });
    document.getElementById('dlTagCopy').addEventListener('click', function(){
      var btn = this, t = document.getElementById('dlTag').textContent;
      var done = function(){ btn.textContent = '복사됨'; setTimeout(function(){ btn.textContent = '복사'; }, 1200); };
      if(navigator.clipboard){ navigator.clipboard.writeText(t).then(done, function(){}); }
    });
    document.getElementById('dlForm').addEventListener('submit', function(e){
      e.preventDefault();
      if(busy) return;
      var msg = document.getElementById('dlMsg'), btn = this.querySelector('button[type="submit"]');
      var url = clean(document.getElementById('dlUrl').value);
      msg.className = 'dl-msg err';
      if(!kind){ msg.textContent = '구분을 먼저 골라 주세요.'; return; }
      if(!url){ msg.textContent = '인스타그램 게시물 주소를 붙여 넣어 주세요.'; return; }
      if(!isOpen()){ msg.textContent = '지금은 남기는 시간이 아니에요. (낮 09:00 ~ 21:00)'; return; }
      if(load().some(function(it){ return it.url === url; })){ msg.textContent = '이미 올라온 주소예요.'; return; }
      // 암호는 “내 품앗이”에 들어올 때 이미 확인했다 (이 기기에 기억된 암호로 한 번 더 확인)
      var nick = me(), pin = pinOf(nick);
      if(!window.DiaPin || !window.DiaPin.okPin(pin)){ msg.textContent = '암호 확인이 필요해요. 위의 로그아웃을 누르고 “내 품앗이”에서 다시 들어와 주세요.'; return; }
      busy = true; msg.className = 'dl-msg'; msg.textContent = '확인 중…';
      btn.disabled = true;
      sendAdd(nick, pin, kind, url).then(function(d){
        busy = false; btn.disabled = false;
        if(d && d.ok){
          document.getElementById('dlUrl').value = '';
          msg.className = 'dl-msg ok';
          msg.innerHTML = '<b>남겼어요!</b> 단톡방에 <b>' + esc(nick) + ' 참여</b> 한 줄도 남겨 주세요.';
          return fetchMine().then(function(){ paintMine(true); });
        }
        msg.className = 'dl-msg err';
        if(d && d.error === 'bad_pin'){
          if(window.DiaPin) window.DiaPin.forget(nick);
          msg.textContent = '암호가 바뀌었어요. 로그아웃 후 “내 품앗이”에서 다시 들어와 주세요.';
        } else if(d && d.error === 'unauthorized'){
          msg.textContent = '암호 확인이 필요해요. 로그아웃 후 “내 품앗이”에서 다시 들어와 주세요.';
        } else if(d && (d.error === 'nourl')){
          msg.textContent = '인스타그램 게시물 주소를 붙여 넣어 주세요.';
        } else if(d && (d.error === 'closed')){
          msg.textContent = '지금은 남기는 시간이 아니에요. (낮 09:00 ~ 21:00)';
        } else if(d && (d.error === 'dup_url')){
          msg.textContent = '이미 올라온 주소예요.';
        } else {
          msg.textContent = '연결이 잠깐 안 돼요. 다시 눌러 주세요.';
        }
      }).catch(function(){
        busy = false; btn.disabled = false;
        msg.className = 'dl-msg err'; msg.textContent = '연결이 잠깐 안 돼요. 다시 눌러 주세요.';
      });
    });
    fetchMine().then(function(){ refresh(); });
  }
  function refresh(){
    var b = document.getElementById('dlBadge'); if(!b) return;
    var open = isOpen();
    b.textContent = open ? '참여 중' : '참여 마감';
    b.className = 'dl-badge' + (open ? '' : ' off');
    document.getElementById('dlTag').textContent = tagText();
    paintMine(false);
  }

  // 오늘 내가 남긴 링크: 고치기·지우기 (서버 행 번호 row 로 구분)
  var editKey = null, delKey = null, editKind = '', mineSig = '';
  var KINDS = [['🤍', '🤍 일반'], ['릴스', '릴스']];
  function mineList(){
    var nick = me();
    return load().filter(function(it){ return it.shop === nick; });
  }
  function paintMine(force){
    var el = document.getElementById('dlMine'); if(!el) return;
    var mine = mineList();
    var sig = JSON.stringify(mine) + '|' + editKey + '|' + delKey + '|' + editKind;
    if(!force && sig === mineSig) return;
    if(!force && editKey !== null) return; // 고치는 중엔 입력이 지워지지 않게 다시 그리지 않음
    mineSig = sig;
    if(!mine.length){ el.innerHTML = ''; return; }
    el.innerHTML = '<div class="dl-mine-t">오늘 내가 남긴 링크</div>' + mine.map(function(it){
      var row = String(it.row);
      if(row === editKey){
        return '<div class="dl-mi edit" data-row="' + row + '">' +
          '<div class="dl-mk">' + KINDS.map(function(k){ return '<button type="button" class="dl-mk-b' + (editKind === k[0] ? ' on' : '') + '" data-k="' + esc(k[0]) + '">' + esc(k[1]) + '</button>'; }).join('') + '</div>' +
          '<input class="dl-mu" value="' + esc(it.url) + '" inputmode="url">' +
          '<div class="dl-ma"><button type="button" class="dl-mini dl-save">저장</button><button type="button" class="dl-mini dl-cancel">취소</button></div>' +
          '<div class="dl-me-err"></div></div>';
      }
      if(row === delKey){
        return '<div class="dl-mi" data-row="' + row + '"><span class="dl-mi-k">' + esc(it.kind) + '</span><span class="dl-mi-q">이 링크를 지울까요?</span>' +
          '<div class="dl-ma"><button type="button" class="dl-mini dl-del-ok">지우기</button><button type="button" class="dl-mini dl-cancel">취소</button></div></div>';
      }
      return '<div class="dl-mi" data-row="' + row + '"><span class="dl-mi-k">' + esc(it.kind) + '</span>' +
        '<a class="dl-mi-u" href="' + esc(it.url) + '" target="_blank" rel="noopener">' + esc(String(it.url).replace(/^https:\/\/(www\.)?instagram\.com/, '')) + '</a>' +
        '<span class="dl-mi-t">' + esc(it.t) + '</span>' +
        '<div class="dl-ma"><button type="button" class="dl-mini dl-edit">고치기</button><button type="button" class="dl-mini dl-del">지우기</button></div></div>';
    }).join('');
  }
  function rowBusy(el, on){
    if(!el) return;
    [].forEach.call(el.querySelectorAll('button'), function(b){ b.disabled = on; });
  }
  box.addEventListener('click', function(e){
    var row = e.target.closest('.dl-mi'); if(!row) return;
    var key = row.getAttribute('data-row');
    var it = load().filter(function(x){ return String(x.row) === key; })[0]; if(!it) return;
    if(e.target.closest('.dl-edit')){ editKey = key; delKey = null; editKind = it.kind; paintMine(true); var u = box.querySelector('.dl-mu'); if(u) u.focus(); return; }
    if(e.target.closest('.dl-del')){ delKey = key; editKey = null; paintMine(true); return; }
    if(e.target.closest('.dl-cancel')){ editKey = null; delKey = null; paintMine(true); return; }
    var mk = e.target.closest('.dl-mk-b');
    if(mk){ editKind = mk.getAttribute('data-k'); [].forEach.call(row.querySelectorAll('.dl-mk-b'), function(b){ b.classList.toggle('on', b === mk); }); return; }
    var nick = me(), pin = pinOf(nick), msg = document.getElementById('dlMsg');
    function say(t, ok){ if(!msg) return; msg.className = 'dl-msg ' + (ok ? 'ok' : 'err'); msg.innerHTML = t; }
    if(e.target.closest('.dl-del-ok')){
      if(!window.DiaPin || !window.DiaPin.okPin(pin)){ say('암호 확인이 필요해요. 로그아웃 후 다시 들어와 주세요.'); return; }
      sendDel(nick, pin, it).then(function(d){
        if(d && d.ok){ delKey = null; say('<b>지웠어요.</b>', true); return fetchMine().then(function(){ paintMine(true); }); }
        rowBusy(row, false);
        say(d && d.error === 'bad_pin' ? '암호가 바뀌었어요. 로그아웃 후 다시 들어와 주세요.'
          : d && d.error === 'closed' ? '지금은 남기는 시간이 아니에요. (낮 09:00 ~ 21:00)'
          : '지우지 못했어요. 다시 눌러 주세요.');
      }).catch(function(){ rowBusy(row, false); say('연결이 잠깐 안 돼요. 다시 눌러 주세요.'); });
      return;
    }
    if(e.target.closest('.dl-save')){
      var url = clean(row.querySelector('.dl-mu').value), err = row.querySelector('.dl-me-err');
      if(!url){ err.textContent = '인스타그램 게시물 주소를 넣어 주세요.'; return; }
      if(load().some(function(x){ return String(x.row) !== key && x.url === url; })){ err.textContent = '이미 올라온 주소예요.'; return; }
      if(!window.DiaPin || !window.DiaPin.okPin(pin)){ err.textContent = '암호 확인이 필요해요. 로그아웃 후 다시 들어와 주세요.'; return; }
      err.textContent = '저장 중…';
      rowBusy(row, true);
      sendEdit(nick, pin, it, editKind || it.kind, url).then(function(d){
        if(d && d.ok){ editKey = null; say('<b>고쳤어요!</b>', true); return fetchMine().then(function(){ paintMine(true); }); }
        rowBusy(row, false);
        err.textContent = d && d.error === 'bad_pin' ? '암호가 바뀌었어요. 로그아웃 후 다시 들어와 주세요.'
          : d && d.error === 'closed' ? '지금은 남기는 시간이 아니에요. (낮 09:00 ~ 21:00)'
          : d && d.error === 'dup_url' ? '이미 올라온 주소예요.'
          : '고치지 못했어요. 다시 눌러 주세요.';
      }).catch(function(){ rowBusy(row, false); err.textContent = '연결이 잠깐 안 돼요. 다시 눌러 주세요.'; });
      return;
    }
  });

  paint();
  // “내 품앗이” 로그인·로그아웃은 이 파일 밖에서 일어나므로 가볍게 확인한다
  var last = me();
  setInterval(function(){ var n = me(); if(n !== last){ last = n; paint(); } else { refresh(); } }, 1000);
  // 창고에서 오늘 내 링크를 1분에 한 번 조용히 다시 받아온다
  setInterval(function(){ if(me() && !box.hidden){ fetchMine().then(function(){ paintMine(false); }); } }, 60000);
  window.addEventListener('storage', function(){ last = me(); paint(); });
})();
