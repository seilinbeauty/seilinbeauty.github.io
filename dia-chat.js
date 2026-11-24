/* 뷰티수강 채팅 — 파이어베이스 파이어스토어 연결 (2026-11-24 커비)
   - 수강찾기 카드에서 원장님께 사이트 안에서 문의를 보내고, 원장님은 커뮤니티 홈 로그인 뒤
     마이페이지의 '뷰티수강 채팅' 버튼에서 받은 문의를 보고 답장합니다.
   - 창고(구글 앱스크립트)를 거치지 않고 파이어스토어 REST 로만 주고받습니다(무료 Spark).
   - 방: chats/{방번호}  ·  메시지: chats/{방번호}/msgs/{메시지번호}
   - 방번호 = 원장님 열쇠 + '_' + 고객 기기번호  (dia-fb.js 의 safeId 처럼 '/'는 '|'로)
   - 원장님 열쇠 = 로그인한 회원의 인스타 아이디(없으면 닉네임)를 소문자로 바꾼 값.
     고객은 로그인 없이 이 기기에 저장된 기기번호로만 구분합니다.
   - 새 팝업·알림음 없이 5초마다 조용히 새 메시지를 받아 옵니다.
   - 화면: dia-chat.html (목록·대화) · dia.html 마이페이지 버튼 · dia-course.html 카드 버튼/하단 탭 */
(function(){
  var BASE = 'https://firestore.googleapis.com/v1/projects/seilindia/databases/(default)/';
  var KEY = 'AIzaSyDQ1PusFvVlbgWyh0pU-2MoW7PzJZHNDKY';
  var LIMIT = 12000;                 // 12초 안에 응답이 없으면 연결 실패로 본다
  var TEXT_MAX = 300;                // 메시지 한 줄 최대 글자
  var LAST_MAX = 60;                 // 목록에 보이는 마지막 메시지 길이
  var NAME_MAX = 20;                 // 고객 이름 길이
  var K_CUST = 'dia_chat_cust';      // 이 기기 고객 번호
  var K_NAME = 'dia_chat_name';      // 고객이 적은 이름
  var K_LOGIN = 'dia_login_member';  // dia.html 로그인 값(그대로 재사용)

  // ── 값 만들기
  function str(x){ return { stringValue: String(x) }; }
  function int(x){ return { integerValue: String(x) }; }
  function fields(o){
    var f = {};
    for(var k in o){
      if(o[k] === undefined || o[k] === null) continue;
      f[k] = (typeof o[k] === 'number') ? int(o[k]) : str(o[k]);
    }
    return f;
  }
  function docName(coll, id){
    return 'projects/seilindia/databases/(default)/documents/' + coll + '/' + encodeURIComponent(id);
  }
  function serverTime(path){ return { fieldPath: path, setToServerValue: 'REQUEST_TIME' }; }
  function safeId(x){ return String(x === undefined || x === null ? '' : x).trim().split('/').join('|'); }
  function clip(t, n){ t = String(t || ''); return t.length > n ? t.slice(0, n) + '…' : t; }

  // ── 파이어스토어 호출 (POST 기본, GET·DELETE 는 방식만 바꿈)
  function req(path, body, method){
    var opt = { method: method || 'POST', cache: 'no-store' };
    if(body !== undefined && body !== null){
      opt.headers = { 'Content-Type': 'application/json' };
      opt.body = JSON.stringify(body);
    }
    var ctl = window.AbortController ? new AbortController() : null;
    if(ctl) opt.signal = ctl.signal;
    var timer = setTimeout(function(){ if(ctl){ try{ ctl.abort(); }catch(e){} } }, LIMIT);
    var url = BASE + path + (path.indexOf('?') > -1 ? '&' : '?') + 'key=' + KEY;
    return fetch(url, opt).then(function(r){
      return r.text().then(function(t){
        clearTimeout(timer);
        var d = {};
        try{ d = t ? JSON.parse(t) : {}; }catch(e){ d = {}; }
        if(r.ok) return d;
        var err = new Error('fb');
        err.status = r.status; err.body = d;
        throw err;
      });
    }, function(e){ clearTimeout(timer); throw e; });
  }

  // ── 문서 하나 → 화면에서 쓰는 값
  function decode(doc){
    if(!doc || !doc.fields) return null;
    var f = doc.fields, d = {};
    for(var k in f){
      var v = f[k];
      if(v.stringValue !== undefined) d[k] = v.stringValue;
      else if(v.integerValue !== undefined) d[k] = parseInt(v.integerValue, 10) || 0;
      else if(v.timestampValue !== undefined) d[k] = v.timestampValue;
      else d[k] = '';
    }
    d.id = String(doc.name || '').split('/').pop();
    return d;
  }

  // ── 이 기기 고객 번호 (로그인 없이 고객을 구분하는 열쇠)
  function custId(){
    var v = '';
    try{ v = localStorage.getItem(K_CUST) || ''; }catch(e){}
    if(!/^c[a-z0-9]{12,}$/.test(v)){
      v = 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
      try{ localStorage.setItem(K_CUST, v); }catch(e){}
    }
    return v;
  }

  // ── 로그인한 회원 (dia.html 이 저장한 값 그대로). {nick, insta, key, aliases}
  function member(){
    var raw = '';
    try{ raw = localStorage.getItem(K_LOGIN) || ''; }catch(e){ return null; }
    if(!raw){
      try{ raw = localStorage.getItem(K_LOGIN + '_bak') || ''; }catch(e){}
    }
    if(!raw) return null;
    var o = null;
    if(raw.charAt(0) === '{'){ try{ o = JSON.parse(raw); }catch(e){} }
    var nick = String((o && o.n) || (o ? '' : raw) || '').trim();
    var insta = String((o && o.i) || '').replace(/^@+/, '').trim();
    if(!nick && !insta) return null;
    var bases = [];
    if(insta) bases.push(insta);
    if(nick) bases.push(nick);
    // '서울/haute_ob/속눈썹' 처럼 지역·업종이 붙은 닉네임이면 가운데 아이디 모양(영문·숫자)만 열쇠 후보로 더한다
    if(nick.indexOf('/') > -1){
      nick.split('/').forEach(function(p){
        p = (p || '').trim();
        if(/^[A-Za-z0-9._-]{3,}$/.test(p)) bases.push(p);
      });
    }
    var seen = {}, aliases = [];
    bases.forEach(function(b){
      var k = normId(b);
      if(k && !seen[k] && aliases.length < 10){ seen[k] = 1; aliases.push(k); }
    });
    return { nick: nick, insta: insta, key: aliases[0] || '', aliases: aliases };
  }

  function normId(x){ return String(x === undefined || x === null ? '' : x).replace(/^@+/, '').trim().toLowerCase(); }

  // ── 방 번호
  function roomId(ownerKey, cust){ return safeId(normId(ownerKey)) + '_' + (cust || custId()); }

  // ── 방 하나 읽기 (없으면 null)
  function room(id){
    return req('documents/chats/' + encodeURIComponent(id), null, 'GET')
      .then(function(d){ return decode(d); }, function(e){
        if(e && e.status === 404) return null;
        throw e;
      });
  }

  // ── 목록 읽기 (한 칸 같음 / 여러 칸 중 하나)
  function query(coll, parent, filter){
    var q = { from: [{ collectionId: coll }], limit: 300 };
    if(filter) q.where = { fieldFilter: filter };
    var path = parent ? ('documents/' + parent + ':runQuery') : 'documents:runQuery';
    return req(path, { structuredQuery: q }).then(function(rows){
      var out = [];
      (rows || []).forEach(function(r){
        var d = decode(r && r.document);
        if(d) out.push(d);
      });
      out.sort(function(a, b){ return (Date.parse(b.lastAt || '') || 0) - (Date.parse(a.lastAt || '') || 0); });
      return out;
    });
  }
  function eq(field, value){
    return { field: { fieldPath: field }, op: 'EQUAL', value: str(value) };
  }
  function roomsOfCust(cust){ return query('chats', '', eq('cust', cust || custId())); }
  function roomsOfOwner(aliases){
    aliases = (aliases || []).filter(Boolean);
    if(!aliases.length) return Promise.resolve([]);
    if(aliases.length === 1) return query('chats', '', eq('owner', aliases[0]));
    return query('chats', '', { field: { fieldPath: 'owner' }, op: 'IN',
      value: { arrayValue: { values: aliases.map(function(a){ return str(a); }) } } });
  }

  // ── 메시지 읽기 (최근 200개, 오래된 것부터)
  function msgs(id){
    return req('documents/chats/' + encodeURIComponent(id) + ':runQuery', { structuredQuery: {
      from: [{ collectionId: 'msgs' }],
      orderBy: [{ field: { fieldPath: 'at' }, direction: 'DESCENDING' }],
      limit: 200
    } }).then(function(rows){
      var out = [];
      (rows || []).forEach(function(r){
        var d = decode(r && r.document);
        if(d) out.push(d);
      });
      out.reverse();
      return out;
    });
  }

  // ── 방 만들기 (이미 있으면 그대로)
  function ensureRoom(id, o){
    return req('documents:commit', { writes: [{
      update: { name: docName('chats', id), fields: fields({
        roomId: id, owner: o.owner, nick: o.nick || '', cust: o.cust || custId(),
        custName: o.custName || '', last: '', lastFrom: 'c', unreadC: 0, unreadI: 0
      }) },
      currentDocument: { exists: false },
      updateTransforms: [serverTime('createdAt'), serverTime('lastAt')]
    }] }).then(function(){ return true; }, function(e){
      var m = String((e.body && e.body.error && e.body.error.message) || '').toLowerCase();
      if(e && (e.status === 409 || m.indexOf('already exists') > -1)) return true;
      throw e;
    });
  }

  // ── 메시지 보내기 (메시지 + 방 요약을 한 묶음으로)
  function send(id, from, text){
    text = String(text || '').trim();
    if(!text) return Promise.reject(new Error('empty'));
    if(text.length > TEXT_MAX) text = text.slice(0, TEXT_MAX);
    var mid = 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    var other = (from === 'i') ? 'unreadC' : 'unreadI';
    return req('documents:commit', { writes: [
      {
        update: { name: docName('chats/' + id + '/msgs', mid), fields: fields({ from: from, text: text }) },
        currentDocument: { exists: false },
        updateTransforms: [serverTime('at')]
      },
      {
        update: { name: docName('chats', id), fields: fields({ last: clip(text, LAST_MAX), lastFrom: from }) },
        updateMask: { fieldPaths: ['last', 'lastFrom'] },
        updateTransforms: [serverTime('lastAt'), { fieldPath: other, increment: { integerValue: '1' } }],
        currentDocument: { exists: true }
      }
    ] }).then(function(){ return true; });
  }

  // ── 읽음 표시 (그 방의 내 쪽 안 읽은 수를 0으로)
  function markRead(id, side){
    var f = (side === 'i') ? 'unreadI' : 'unreadC';
    var o = {}; o[f] = 0;
    return req('documents:commit', { writes: [{
      update: { name: docName('chats', id), fields: fields(o) },
      updateMask: { fieldPaths: [f] },
      currentDocument: { exists: true }
    }] }).then(function(){ return true; }, function(){ return false; });
  }

  // ── 고객 이름 남기기
  function setCustName(id, name){
    name = String(name || '').trim().slice(0, NAME_MAX);
    return req('documents:commit', { writes: [{
      update: { name: docName('chats', id), fields: fields({ custName: name }) },
      updateMask: { fieldPaths: ['custName'] },
      currentDocument: { exists: true }
    }] }).then(function(){ return true; }, function(){ return false; });
  }

  function savedName(){ try{ return localStorage.getItem(K_NAME) || ''; }catch(e){ return ''; } }
  function saveName(n){ try{ localStorage.setItem(K_NAME, String(n || '')); }catch(e){} }

  // ── 시간 표기 (한국 시간)
  function kstParts(iso){
    var t = Date.parse(iso || '');
    if(!t) return null;
    var d = new Date(t + 9 * 3600 * 1000);
    return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), h: d.getUTCHours(), mi: d.getUTCMinutes() };
  }
  function kst(iso){
    var p = kstParts(iso);
    if(!p) return '';
    var hm = ('0' + p.h).slice(-2) + ':' + ('0' + p.mi).slice(-2);
    var now = kstParts(new Date().toISOString());
    var sameDay = now && p.y === now.y && p.m === now.m && p.d === now.d;
    return sameDay ? hm : (p.m + 1) + '/' + p.d + ' ' + hm;
  }
  // 날짜 구분선에 쓰는 날 이름 (오늘 / 어제 / 11월 24일)
  function kstDay(iso){
    var p = kstParts(iso);
    if(!p) return '';
    var now = kstParts(new Date().toISOString());
    if(now && p.y === now.y && p.m === now.m && p.d === now.d) return '오늘';
    var yd = new Date(Date.now() + 9 * 3600 * 1000 - 86400000);
    if(p.y === yd.getUTCFullYear() && p.m === yd.getUTCMonth() && p.d === yd.getUTCDate()) return '어제';
    return (p.m + 1) + '월 ' + p.d + '일';
  }

  window.DiaChat = {
    roomId: roomId, room: room, roomsOfCust: roomsOfCust, roomsOfOwner: roomsOfOwner,
    msgs: msgs, ensureRoom: ensureRoom, send: send, markRead: markRead,
    setCustName: setCustName, member: member, custId: custId, normId: normId,
    savedName: savedName, saveName: saveName, kst: kst, kstDay: kstDay, safeId: safeId
  };

  // ══════════════════════════════════════
  //  버튼·배지 — dia.html 마이페이지 · dia-course.html 카드/하단 탭
  // ══════════════════════════════════════
  function pageBadgeStyle(){
    if(document.getElementById('ch-badge-css')) return;
    var st = document.createElement('style');
    st.id = 'ch-badge-css';
    st.textContent =
      /* 마이페이지 버튼 (참여 마감까지 시계 옆 작은 버튼) */
      '.mc-chat{display:inline-flex;align-items:center;gap:4px;margin:0;padding:7px 10px;border-radius:12px;' +
      'border:1px solid #f0d7e0;background:#fff;color:#b3476a;font-size:11.5px;font-weight:800;text-decoration:none;white-space:nowrap;line-height:1.2;box-shadow:0 2px 6px rgba(198,69,106,.08);}' +
      '.mc-chat[hidden]{display:none;}' +
      '.mc-chat:active{background:#fdeef3;}' +
      '.mc-chat .mc-chat-ico{font-size:13px;line-height:1;}' +
      '.mc-chat .mc-chat-n{margin-left:1px;min-width:16px;height:16px;padding:0 4px;border-radius:999px;background:#e1789a;color:#fff;' +
      'font-size:10px;font-weight:900;display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;}' +
      '.mc-chat .mc-chat-n[hidden]{display:none;}' +
      /* 카드의 채팅 버튼 (인스타그램 버튼과 같은 모양, 분홍 채움) */
      '.crs-ig.crs-chat{background:#e1789a;border-color:#e1789a;color:#fff;position:relative;display:inline-flex;align-items:center;gap:3px;cursor:pointer;}' +
      '.crs-ig.crs-chat:active{background:#d55576;}' +
      '.crs-ig.crs-chat .crs-chat-n{min-width:15px;height:15px;padding:0 4px;border-radius:999px;background:#fff;color:#c2456a;' +
      'font-size:9.5px;font-weight:900;display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;}' +
      /* 하단 탭 배지 */
      '.dia-tabbar a .tb-n{position:absolute;top:0;right:50%;transform:translateX(26px);min-width:16px;height:16px;padding:0 4px;' +
      'border-radius:999px;background:#e1789a;color:#fff;font-size:9.5px;font-weight:900;display:inline-flex;align-items:center;' +
      'justify-content:center;box-sizing:border-box;}';
    document.head.appendChild(st);
  }

  // 마이페이지 '뷰티수강 채팅' 버튼 — 로그인했을 때만 보이고, 안 읽은 문의 수를 배지로
  function mountMyCard(){
    var btn = document.getElementById('mcChatBtn');
    if(!btn) return;
    var on = false, timer = null;
    function tally(rows){
      var n = 0;
      (rows || []).forEach(function(r){ n += (r.unreadI || 0); });
      var b = document.getElementById('mcChatBadge');
      if(!b) return;
      if(n > 0){ b.textContent = n > 99 ? '99+' : String(n); b.hidden = false; }
      else b.hidden = true;
    }
    function check(){
      var me = member();
      if(!me){
        if(on){ on = false; btn.hidden = true; }
        return;
      }
      if(!on){ on = true; btn.hidden = false; }
      if(document.hidden) return;
      roomsOfOwner(me.aliases).then(tally, function(){});
    }
    pageBadgeStyle();
    check();
    timer = setInterval(check, 15000);
    document.addEventListener('visibilitychange', function(){ if(!document.hidden) check(); });
    window.addEventListener('pageshow', check);
  }

  // 수강찾기 카드마다 '💬 채팅' 버튼 + 고객이 안 읽은 답장 수 배지
  function mountCards(){
    var grid = document.getElementById('crsGrid');
    if(!grid) return;
    pageBadgeStyle();
    function ownerOf(card){
      var v = card.getAttribute('data-insta');
      if(!v){ var ig = card.querySelector('[data-insta]'); if(ig) v = ig.getAttribute('data-insta'); }
      if(!v) v = card.getAttribute('data-nick');
      return normId(v || '');
    }
    function addTo(card){
      if(card.querySelector('.crs-chat')) return;
      var key = ownerOf(card);
      if(!key) return;
      var nick = String(card.getAttribute('data-nick') || key).trim() || key;
      var a = document.createElement('a');
      a.className = 'crs-ig crs-chat';
      a.href = 'dia-chat.html?to=' + encodeURIComponent(key) + '&n=' + encodeURIComponent(nick);
      a.textContent = '💬 채팅';
      var links = card.querySelector('.crs-links');
      if(!links){
        var head = card.querySelector('.crs-head');
        if(!head) return;
        links = document.createElement('div');
        links.className = 'crs-links';
        head.appendChild(links);
      }
      links.insertBefore(a, links.firstChild);
    }
    function all(){ Array.prototype.forEach.call(grid.querySelectorAll('.crs-card'), addTo); }
    all();
    // 창고에서 새로 붙는 카드에도 버튼이 붙도록 지켜본다
    if(window.MutationObserver){
      new MutationObserver(function(){ all(); }).observe(grid, { childList: true, subtree: false });
    }
    // 고객이 안 읽은 답장 수를 카드 버튼에 표시
    function badges(){
      if(document.hidden) return;
      roomsOfCust(custId()).then(function(rows){
        var map = {};
        (rows || []).forEach(function(r){ if(r.unreadC > 0) map[r.owner] = (map[r.owner] || 0) + r.unreadC; });
        Array.prototype.forEach.call(grid.querySelectorAll('.crs-card'), function(card){
          var a = card.querySelector('.crs-chat');
          if(!a) return;
          var n = map[ownerOf(card)] || 0;
          var b = a.querySelector('.crs-chat-n');
          if(n > 0){
            if(!b){ b = document.createElement('span'); b.className = 'crs-chat-n'; a.appendChild(b); }
            b.textContent = n > 9 ? '9+' : String(n);
          } else if(b){ b.parentNode.removeChild(b); }
        });
      }, function(){});
    }
    badges();
    setInterval(badges, 20000);
    document.addEventListener('visibilitychange', function(){ if(!document.hidden) badges(); });
  }

  // 하단 탭 '채팅' 배지 (고객이 안 읽은 답장 수)
  function mountTab(){
    var tab = document.querySelector('.dia-tabbar a[href*="dia-chat"]');
    if(!tab) return;
    pageBadgeStyle();
    function tally(){
      if(document.hidden) return;
      roomsOfCust(custId()).then(function(rows){
        var n = 0;
        (rows || []).forEach(function(r){ n += (r.unreadC || 0); });
        var b = tab.querySelector('.tb-n');
        if(n > 0){
          if(!b){ b = document.createElement('span'); b.className = 'tb-n'; tab.appendChild(b); }
          b.textContent = n > 99 ? '99+' : String(n);
        } else if(b){ b.parentNode.removeChild(b); }
      }, function(){});
    }
    tally();
    setInterval(tally, 20000);
    document.addEventListener('visibilitychange', function(){ if(!document.hidden) tally(); });
  }

  mountMyCard();
  mountCards();
  mountTab();

  // ════════════════════════════════════════════════════════════════
  //  화면 — dia-chat.html (목록·대화)
  // ════════════════════════════════════════════════════════════════
  var listBox = document.getElementById('chList');
  if(!listBox) return;  // 채팅 화면이 아니면 여기서 끝 (마이페이지·카드 버튼은 아래 따로)

  var S = { me: member(), cust: custId(), side: 'c', id: '', nick: '', owner: '', room: null, timer: null, sig: '', busy: false };
  var roomBox = document.getElementById('chRoom');
  var msgsBox = document.getElementById('chMsgs');
  var form = document.getElementById('chForm');
  var input = document.getElementById('chInput');
  var titleEl = document.getElementById('chTitle');
  var subEl = document.getElementById('chSub');
  var backEl = document.getElementById('chBack');
  var toastEl = document.getElementById('chToast');
  var toastTimer = null;

  function toast(t){
    if(!toastEl) return;
    toastEl.textContent = t; toastEl.hidden = false;
    if(toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toastEl.hidden = true; }, 2600);
  }
  function el(tag, cls, txt){
    var d = document.createElement(tag);
    if(cls) d.className = cls;
    if(txt !== undefined) d.textContent = txt;
    return d;
  }
  function failMsg(){
    return '연결이 잠깐 안 돼요. 잠시 뒤 다시 시도해 주세요.';
  }

  // ── 목록
  function showList(){
    stopPoll();
    S.id = ''; S.room = null;
    roomBox.hidden = true;
    listBox.hidden = false;
    titleEl.textContent = '뷰티수강 채팅';
    subEl.textContent = S.me ? '받은 수강 문의' : '내 채팅';
    backEl.setAttribute('href', S.me ? 'dia.html' : 'dia-course.html');
    listBox.innerHTML = '<div class="ch-load">불러오는 중…</div>';
    var p = S.me ? roomsOfOwner(S.me.aliases) : roomsOfCust(S.cust);
    p.then(function(rows){
      drawList(rows);
      startPoll(15000, function(){ refreshList(); });
    }, function(){
      listBox.innerHTML = '';
      listBox.appendChild(el('div', 'ch-empty', failMsg()));
    });
  }
  function refreshList(){
    var p = S.me ? roomsOfOwner(S.me.aliases) : roomsOfCust(S.cust);
    p.then(drawList, function(){});
  }
  function drawList(rows){
    if(!rows) return;
    listBox.innerHTML = '';
    if(!rows.length){
      var box = el('div', 'ch-empty');
      box.appendChild(el('div', 'ch-empty-t', S.me ? '아직 받은 수강 문의가 없습니다.' : '아직 대화가 없습니다.'));
      box.appendChild(el('div', 'ch-empty-s', S.me ? '수강찾기 카드에서 고객이 채팅을 걸면 여기에 표시됩니다.' : '수강찾기에서 원장님 카드를 열고 채팅을 걸어 보세요.'));
      if(!S.me){
        var a = el('a', 'ch-empty-b', '수강찾기로 가기');
        a.href = 'dia-course.html';
        box.appendChild(a);
      }
      listBox.appendChild(box);
      return;
    }
    rows.forEach(function(r){
      var item = el('button', 'ch-item');
      item.type = 'button';
      var who = S.me ? (r.custName || '고객') : (r.nick || r.owner);
      var av = el('span', 'ch-av', (who || '?').slice(0, 1));
      var body = el('span', 'ch-body');
      body.appendChild(el('span', 'ch-who', who));
      body.appendChild(el('span', 'ch-last', r.last || '대화를 시작해 보세요'));
      var right = el('span', 'ch-right');
      right.appendChild(el('span', 'ch-time', kst(r.lastAt)));
      var un = S.me ? (r.unreadI || 0) : (r.unreadC || 0);
      if(un > 0) right.appendChild(el('span', 'ch-n', un > 99 ? '99+' : String(un)));
      item.appendChild(av); item.appendChild(body); item.appendChild(right);
      item.addEventListener('click', function(){
        S.owner = r.owner; S.nick = r.nick || r.owner;
        location.hash = 'r=' + encodeURIComponent(r.id);
        openRoom(r.id, S.me ? 'i' : 'c');
      });
      listBox.appendChild(item);
    });
  }

  // ── 대화방
  function openRoom(id, sideHint){
    listBox.hidden = true;
    roomBox.hidden = false;
    S.id = id; S.sig = '';
    msgsBox.innerHTML = '<div class="ch-load">불러오는 중…</div>';
    backEl.setAttribute('href', '#');
    backEl.onclick = null;
    room(id).then(function(r){
      S.room = r;
      if(r && r.cust === S.cust) S.side = 'c';
      else if(r) S.side = 'i';
      else S.side = sideHint || (S.me ? 'i' : 'c');
      S.owner = (r && r.owner) || (id.indexOf('_') > -1 ? id.slice(0, id.lastIndexOf('_')) : '');
      S.nick = (r && r.nick) || S.nick || S.owner;
      if(S.side === 'i' && !S.me){
        titleEl.textContent = '뷰티수강 채팅';
        subEl.textContent = '';
        msgsBox.innerHTML = '';
        var box = el('div', 'ch-empty');
        box.appendChild(el('div', 'ch-empty-t', '원장님은 커뮤니티 홈에서 로그인해 주세요.'));
        box.appendChild(el('div', 'ch-empty-s', '회원목록에서 본인 이름을 고르고 암호 4자리를 넣으면 내 문의를 볼 수 있습니다.'));
        var a = el('a', 'ch-empty-b', '커뮤니티 홈에서 로그인');
        a.href = 'dia.html';
        box.appendChild(a);
        msgsBox.appendChild(box);
        form.hidden = true;
        return;
      }
      titleEl.textContent = S.side === 'i' ? ((r && r.custName) || '고객') : (S.nick || '뷰티수강 채팅');
      subEl.textContent = S.side === 'i' ? '수강 문의' : '원장님과의 대화';
      backEl.setAttribute('href', '#');
      backEl.onclick = function(ev){ ev.preventDefault(); backToList(); };
      form.hidden = false;
      loadMsgs(true);
      startPoll(5000, function(){ loadMsgs(false); });
    }, function(){
      msgsBox.innerHTML = '';
      msgsBox.appendChild(el('div', 'ch-empty', failMsg()));
    });
  }
  function backToList(){
    if(location.hash) location.hash = '';
    else showList();
  }
  function loadMsgs(first){
    var id = S.id;
    if(!id) return;
    msgs(id).then(function(rows){
      if(id !== S.id) return;
      var sig = rows.map(function(m){ return m.id; }).join(',');
      if(!first && sig === S.sig) return;
      S.sig = sig;
      drawMsgs(rows, first);
      markRead(id, S.side);
    }, function(){});
  }
  function drawMsgs(rows, first){
    msgsBox.innerHTML = '';
    if(!rows.length){
      var tip = el('div', 'ch-tip', S.side === 'i' ? '고객이 보낸 문의가 아직 없습니다.' : '하고 싶은 수강 문의를 남겨 주세요. 원장님이 답장하면 여기에 표시됩니다.');
      msgsBox.appendChild(tip);
      return;
    }
    var prev = '';
    rows.forEach(function(m){
      var day = kstDay(m.at);
      if(day !== prev){
        prev = day;
        msgsBox.appendChild(el('div', 'ch-day', day));
      }
      var mine = (m.from === S.side);
      var wrap = el('div', 'ch-m' + (mine ? ' my' : ''));
      wrap.appendChild(el('div', 'ch-b', m.text || ''));
      wrap.appendChild(el('div', 'ch-tm', kst(m.at)));
      msgsBox.appendChild(wrap);
    });
    msgsBox.scrollTop = msgsBox.scrollHeight;
  }

  // ── 보내기
  if(form){
    form.addEventListener('submit', function(ev){
      ev.preventDefault();
      if(S.busy) return;
      var text = String(input.value || '').trim();
      if(!text) return;
      if(!S.id || S.side === 'i' && !S.me) return;
      S.busy = true;
      var go = Promise.resolve(true);
      if(S.side === 'c'){
        go = ensureRoom(S.id, { owner: S.owner, nick: S.nick, cust: S.cust, custName: savedName() });
      } else if(!S.room){
        go = Promise.reject(new Error('noroom'));
      }
      go.then(function(){ return send(S.id, S.side, text); })
        .then(function(){
          input.value = '';
          input.style.height = '';
          S.busy = false;
          loadMsgs(false);
        }, function(e){
          S.busy = false;
          toast(e && e.message === 'noroom' ? '대화방을 먼저 열어 주세요.' : failMsg());
        });
    });
    input.addEventListener('keydown', function(ev){
      if(ev.key === 'Enter' && !ev.shiftKey){ ev.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); }
    });
    input.addEventListener('input', function(){
      input.style.height = 'auto';
      input.style.height = Math.min(96, input.scrollHeight) + 'px';
    });
  }

  // ── 5초/15초 조용한 새로고침
  function startPoll(ms, fn){
    stopPoll();
    S.timer = setInterval(function(){
      if(document.hidden) return;
      fn();
    }, ms);
  }
  function stopPoll(){ if(S.timer){ clearInterval(S.timer); S.timer = null; } }

  document.addEventListener('visibilitychange', function(){
    if(document.hidden) return;
    if(S.id) loadMsgs(false);
    else if(!listBox.hidden) refreshList();
  });

  // ── 처음 열 때: ?to=원장님열쇠&n=이름 이면 바로 그 방, #r=방번호 면 그 방, 아니면 목록
  (function boot(){
    var q = location.search || '';
    var m = /[?&]to=([^&]+)/.exec(q);
    var n = /[?&]n=([^&]+)/.exec(q);
    var h = String(location.hash || '').replace(/^#/, '');
    var rm = /^r=(.+)$/.exec(h);
    if(m){
      var owner = normId(decodeURIComponent(m[1]));
      S.owner = owner;
      S.nick = n ? decodeURIComponent(n[1]) : owner;
      var id = roomId(owner, S.cust);
      S.id = id;
      openRoom(id, 'c');
      return;
    }
    if(rm){
      openRoom(decodeURIComponent(rm[1]));
      return;
    }
    S.me = member();
    showList();
  })();

  window.addEventListener('hashchange', function(){
    var h = String(location.hash || '').replace(/^#/, '');
    var rm = /^r=(.+)$/.exec(h);
    if(rm) return;              // already handled by click
    if(!h && !S.id) return;
    showList();
  });
})();
