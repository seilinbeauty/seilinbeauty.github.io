/* 다이아 “내 품앗이”: 오늘 내 링크 남기기
   - “내 품앗이”에서 본인을 고르면(로그인) 닉네임이 자동으로 들어갑니다.
   - 지금은 미리보기: 저장 연결 전이라 이 기기에만 저장됩니다(PREVIEW).
   - 목록 화면: dia-link.html (같은 저장 키를 씁니다) */
(function(){
  var PREVIEW = true;
  var KEY_LIST = 'dia_link_preview';
  var LG_KEY = 'dia_login_member';
  var box = document.getElementById('diaLinkBox');
  if(!box) return;

  function kst(){ return new Date(Date.now() + 9 * 3600 * 1000); }
  function today(){ return kst().toISOString().slice(0, 10); }
  function isOpen(){ var d = kst(), m = d.getUTCHours() * 60 + d.getUTCMinutes(); return m >= 9 * 60 && m < 21 * 60; }
  function tagText(){
    if(window.DiaTag) return window.DiaTag.today(); // 운영 센터에서 바꾼 모양
    var d = kst(); return '#' + String(d.getUTCMonth() + 1).padStart(2, '0') + String(d.getUTCDate()).padStart(2, '0') + '_행운을부탁해';
  }
  function load(){ try{ var o = JSON.parse(localStorage.getItem(KEY_LIST) || '{}'); return o.d === today() ? (o.items || []) : []; }catch(e){ return []; } }
  function save(items){ try{ localStorage.setItem(KEY_LIST, JSON.stringify({ d: today(), items: items })); }catch(e){} }
  function me(){
    try{
      var raw = localStorage.getItem(LG_KEY) || localStorage.getItem(LG_KEY + '_bak') || '';
      if(!raw) return '';
      if(raw.charAt(0) === '{'){ var o = JSON.parse(raw); return (o && o.n) ? String(o.n) : ''; }
      return String(raw);
    }catch(e){ return ''; }
  }
  function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function clean(u){
    var m = String(u || '').trim().match(/https?:\/\/(www\.)?instagram\.com\/(p|reel|reels|tv)\/[A-Za-z0-9_-]+/i);
    return m ? m[0].replace(/^http:/i, 'https:').replace(/\/reels\//i, '/reel/') + '/' : '';
  }

  var css = document.createElement('style');
  css.textContent = [
    '#diaLinkBox{margin-top:10px;align-self:stretch;width:auto;max-width:100%;min-width:0;box-sizing:border-box;}',
    '#diaLinkBox[hidden]{display:none;}',
    '#diaLinkBox *{box-sizing:border-box;}',
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
    '.dl-kinds{margin-top:9px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;}',
    '.dl-kind{height:34px;border-radius:9px;border:1px solid #f0dce3;background:#fff;font-size:12.5px;font-weight:800;color:#6a5a60;cursor:pointer;font-family:inherit;padding:0 2px;}',
    '.dl-kind.on{border-color:#ff5d8f;background:#ff5d8f;color:#fff;}',
    '.dl-f{margin-top:6px;display:flex;gap:6px;}',
    '.dl-f input{flex:1 1 auto;min-width:0;height:38px;padding:0 11px;border:1px solid #f0e2e7;border-radius:9px;font-size:14px;font-family:inherit;color:#4a4a4a;background:#fff;outline:none;}',
    '.dl-f input:focus{border-color:#e6a6bb;}',
    '.dl-f button{flex:0 0 auto;height:38px;padding:0 16px;border:0;border-radius:9px;background:#ff5d8f;color:#fff;font-size:14px;font-weight:900;font-family:inherit;cursor:pointer;}',
    '.dl-pin{margin-top:8px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}',
    '.dl-pin input{width:150px;height:36px;padding:0 11px;border:1px solid #f0e2e7;border-radius:9px;font-size:16px;letter-spacing:4px;font-family:inherit;color:#4a4a4a;background:#fff;outline:none;-webkit-text-security:disc;}',
    '.dl-pin input:focus{border-color:#e6a6bb;}',
    '.dl-pin-h{font-size:11.5px;color:#9a8a90;line-height:1.4;flex:1 1 160px;}',
    '.dl-pin-ok{margin-top:8px;font-size:12px;color:#5a4a50;}',
    '.dl-pin-ok[hidden],.dl-pin[hidden]{display:none;}',
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
    '.dl-mk{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;}',
    '.dl-mk-b{height:30px;border-radius:8px;border:1px solid #f0dce3;background:#fff;font-size:11.5px;font-weight:800;color:#6a5a60;cursor:pointer;font-family:inherit;padding:0 2px;}',
    '.dl-mk-b.on{border-color:#ff5d8f;background:#ff5d8f;color:#fff;}',
    '.dl-mu{margin-top:6px;width:100%;height:34px;padding:0 10px;border:1px solid #e6a6bb;border-radius:8px;font-size:13px;font-family:inherit;outline:none;}',
    '.dl-mi.edit .dl-ma{margin-top:6px;justify-content:flex-end;}',
    '.dl-me-err{font-size:11.5px;font-weight:700;color:#d23b5e;}',
    '.dl-foot{margin-top:9px;display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap;}',
    '.dl-list{font-size:12.5px;font-weight:800;color:#c2456a;text-decoration:none;}',
    '.dl-pv{font-size:10.5px;color:#b08a2e;}',
    '@media (max-width:420px){.dl-kinds,.dl-mk{grid-template-columns:repeat(2,minmax(0,1fr));}}'
  ].join('');
  document.head.appendChild(css);

  var kind = '', shownFor = null;
  function paint(){
    var nick = me();
    if(!nick){ box.hidden = true; box.innerHTML = ''; shownFor = null; return; }
    box.hidden = false;
    if(shownFor === nick){ refresh(); return; }
    shownFor = nick; kind = '';
    box.innerHTML =
      '<div class="dl">' +
        '<div class="dl-h"><span class="dl-t">📎 오늘 내 링크 남기기</span><span class="dl-badge" id="dlBadge"></span></div>' +
        '<div class="dl-me">닉네임 <b>' + esc(nick) + '</b> (“내 품앗이”에서 고른 이름으로 남아요)</div>' +
        '<div class="dl-tag">오늘 해시태그 <b id="dlTag"></b><button type="button" class="dl-mini" id="dlTagCopy">복사</button></div>' +
        '<div class="dl-kinds" id="dlKinds">' +
          '<button type="button" class="dl-kind" data-k="🤍">🤍 일반</button>' +
          '<button type="button" class="dl-kind" data-k="릴스">릴스</button>' +
          '<button type="button" class="dl-kind" data-k="벤">벤</button>' +
          '<button type="button" class="dl-kind" data-k="릴스 벤">릴스 벤</button>' +
        '</div>' +
        '<form class="dl-f" id="dlForm" autocomplete="off"><input id="dlUrl" inputmode="url" placeholder="게시물 주소 붙여 넣기"><button type="submit">남기기</button></form>' +
        '<div class="dl-msg" id="dlMsg"></div>' +
        '<div class="dl-mine" id="dlMine"></div>' +
        '<div class="dl-foot"><a class="dl-list" href="dia-link.html">오늘 참여 링크 보기 →</a>' + (PREVIEW ? '<span class="dl-pv">미리보기: 이 기기에만 저장돼요</span>' : '') + '</div>' +
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
    var P = window.DiaPin;
    var busy = false;
    document.getElementById('dlForm').addEventListener('submit', function(e){
      e.preventDefault();
      if(busy) return;
      var msg = document.getElementById('dlMsg'), url = clean(document.getElementById('dlUrl').value);
      msg.className = 'dl-msg err';
      if(!kind){ msg.textContent = '구분을 먼저 골라 주세요.'; return; }
      if(!url){ msg.textContent = '인스타그램 게시물 주소를 붙여 넣어 주세요.'; return; }
      if(!isOpen() && !PREVIEW){ msg.textContent = '지금은 남기는 시간이 아니에요. (낮 09:00 ~ 21:00)'; return; }
      if(load().some(function(it){ return it.url === url; })){ msg.textContent = '이미 올라온 주소예요.'; return; }
      // 암호는 “내 품앗이”에 들어올 때 이미 확인했다 (이 기기에 기억된 암호로 한 번 더 확인)
      var pin = P ? P.remembered(nick) : '';
      if(P && !P.okPin(pin)){ msg.textContent = '암호 확인이 필요해요. 위의 로그아웃을 누르고 “내 품앗이”에서 다시 들어와 주세요.'; return; }
      busy = true; msg.className = 'dl-msg'; msg.textContent = '확인 중…';
      (P ? P.check(nick, pin) : Promise.resolve({ ok: true })).then(function(r){
        busy = false;
        if(!r.ok){
          msg.className = 'dl-msg err';
          if(r.reason === '틀림'){
            if(P) P.forget(nick);
            msg.textContent = '암호가 바뀌었어요. 로그아웃 후 “내 품앗이”에서 다시 들어와 주세요.';
          } else { msg.textContent = '연결이 잠깐 안 돼요. 다시 눌러 주세요.'; }
          return;
        }
        var items = load();
        var no = items.length ? items[items.length - 1].no + 1 : 1; // 화면에는 안 보이는 내부 순서
        var d = kst(), t = String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0');
        items.push({ no: no, shop: nick, kind: kind, url: url, t: t });
        save(items);
        document.getElementById('dlUrl').value = '';
        msg.className = 'dl-msg ok';
        msg.innerHTML = '<b>남겼어요!</b> 단톡방에 <b>' + esc(nick) + ' 참여</b> 한 줄도 남겨 주세요.';
        refresh();
      });
    });
    refresh();
  }
  function refresh(){
    var b = document.getElementById('dlBadge'); if(!b) return;
    var open = isOpen();
    b.textContent = open ? '참여 중 (~21:00)' : '참여 마감';
    b.className = 'dl-badge' + (open ? '' : ' off');
    document.getElementById('dlTag').textContent = tagText();
    paintMine(false);
  }

  // 오늘 내가 남긴 링크: 고치기·지우기
  var editNo = null, delNo = null, editKind = '', mineSig = '';
  var KINDS = [['🤍', '🤍 일반'], ['릴스', '릴스'], ['벤', '벤'], ['릴스 벤', '릴스 벤']];
  function paintMine(force){
    var el = document.getElementById('dlMine'); if(!el) return;
    var nick = me(), mine = load().filter(function(it){ return it.shop === nick; });
    var sig = JSON.stringify(mine) + '|' + editNo + '|' + delNo + '|' + editKind;
    if(!force && sig === mineSig) return;
    if(!force && editNo !== null) return; // 고치는 중엔 입력이 지워지지 않게 다시 그리지 않음
    mineSig = sig;
    if(!mine.length){ el.innerHTML = ''; return; }
    el.innerHTML = '<div class="dl-mine-t">오늘 내가 남긴 링크</div>' + mine.map(function(it){
      if(it.no === editNo){
        return '<div class="dl-mi edit" data-no="' + it.no + '">' +
          '<div class="dl-mk">' + KINDS.map(function(k){ return '<button type="button" class="dl-mk-b' + (editKind === k[0] ? ' on' : '') + '" data-k="' + esc(k[0]) + '">' + esc(k[1]) + '</button>'; }).join('') + '</div>' +
          '<input class="dl-mu" value="' + esc(it.url) + '" inputmode="url">' +
          '<div class="dl-ma"><button type="button" class="dl-mini dl-save">저장</button><button type="button" class="dl-mini dl-cancel">취소</button></div>' +
          '<div class="dl-me-err"></div></div>';
      }
      if(it.no === delNo){
        return '<div class="dl-mi" data-no="' + it.no + '"><span class="dl-mi-k">' + esc(it.kind) + '</span><span class="dl-mi-q">이 링크를 지울까요?</span>' +
          '<div class="dl-ma"><button type="button" class="dl-mini dl-del-ok">지우기</button><button type="button" class="dl-mini dl-cancel">취소</button></div></div>';
      }
      return '<div class="dl-mi" data-no="' + it.no + '"><span class="dl-mi-k">' + esc(it.kind) + '</span>' +
        '<a class="dl-mi-u" href="' + esc(it.url) + '" target="_blank" rel="noopener">' + esc(it.url.replace(/^https:\/\/(www\.)?instagram\.com/, '')) + '</a>' +
        '<span class="dl-mi-t">' + esc(it.t) + '</span>' +
        '<div class="dl-ma"><button type="button" class="dl-mini dl-edit">고치기</button><button type="button" class="dl-mini dl-del">지우기</button></div></div>';
    }).join('');
  }
  box.addEventListener('click', function(e){
    var row = e.target.closest('.dl-mi'); if(!row) return;
    var no = +row.getAttribute('data-no');
    var items = load(), it = items.filter(function(x){ return x.no === no; })[0]; if(!it) return;
    if(e.target.closest('.dl-edit')){ editNo = no; delNo = null; editKind = it.kind; paintMine(true); var u = row.parentNode.querySelector('.dl-mu'); if(u) u.focus(); return; }
    if(e.target.closest('.dl-del')){ delNo = no; editNo = null; paintMine(true); return; }
    if(e.target.closest('.dl-cancel')){ editNo = null; delNo = null; paintMine(true); return; }
    var mk = e.target.closest('.dl-mk-b');
    if(mk){ editKind = mk.getAttribute('data-k'); [].forEach.call(row.querySelectorAll('.dl-mk-b'), function(b){ b.classList.toggle('on', b === mk); }); return; }
    if(e.target.closest('.dl-del-ok')){
      save(items.filter(function(x){ return x.no !== no; }));
      delNo = null; paintMine(true); return;
    }
    if(e.target.closest('.dl-save')){
      var url = clean(row.querySelector('.dl-mu').value), err = row.querySelector('.dl-me-err');
      if(!url){ err.textContent = '인스타그램 게시물 주소를 넣어 주세요.'; return; }
      if(items.some(function(x){ return x.no !== no && x.url === url; })){ err.textContent = '이미 올라온 주소예요.'; return; }
      it.url = url; it.kind = editKind || it.kind; save(items);
      editNo = null; paintMine(true);
      var msg = document.getElementById('dlMsg'); if(msg){ msg.className = 'dl-msg ok'; msg.innerHTML = '<b>고쳤어요!</b>'; }
    }
  });

  paint();
  // “내 품앗이” 로그인·로그아웃은 이 파일 밖에서 일어나므로 가볍게 확인한다
  var last = me();
  setInterval(function(){ var n = me(); if(n !== last){ last = n; paint(); } else { refresh(); } }, 1000);
  window.addEventListener('storage', function(){ last = me(); paint(); });
})();
