/* 다이아 “참여 링크” — 파이어베이스 파이어스토어 연결 (공용, 2026-11-24 커비)
   - 창고(구글 앱스크립트)를 거치지 않고 파이어스토어에서 바로 읽고 씁니다. (dia-link.html · dia-link.js 가 함께 씀)
   - 읽기: links 모음에서 그날 문서만 받아 옵니다(누구나 읽기). 문서 1개 = 읽기 1건.
   - 쓰기(남기기·고치기·지우기): 본인 4자리 암호 확인을 거칩니다.
     확인용 문서(checks)를 링크 문서와 같은 묶음(원자적 쓰기)으로 만들고, 끝나면 바로 지웁니다.
     암호는 화면에 보이는 링크 문서에 남기지 않습니다(규칙이 확인용 문서로만 봅니다).
   - 문서 번호: links/{날짜}_{주소해시} — 같은 날 같은 주소는 문서 번호가 같아서 저절로 막힙니다(중복).
   - 돌려주는 오류: bad_pin(암호 다름) · closed(남기는 시간 아님) · dup_url(중복) · notfound(이미 지움) · net(연결 실패)
     net 이면 부르는 쪽에서 창고(구글 앱스크립트)로 대신 갑니다.
   - 무료 Spark 요금제: 함수·유료 기능 없이 보안 규칙만 씁니다. */
(function(){
  var BASE = 'https://firestore.googleapis.com/v1/projects/seilindia/databases/(default)/';
  var KEY = 'AIzaSyDQ1PusFvVlbgWyh0pU-2MoW7PzJZHNDKY';
  var STAFF_PW = '0423';
  var LIMIT = 12000; // 12초 안에 응답이 없으면 연결 실패로 본다

  function str(x){ return { stringValue: String(x) }; }
  function num(x){ return { integerValue: String(x) }; }
  function fields(o){
    var f = {};
    for(var k in o){
      if(o[k] === undefined || o[k] === null) continue;
      f[k] = (typeof o[k] === 'number') ? num(o[k]) : str(o[k]);
    }
    return f;
  }
  // 닉네임에 든 '/'는 문서 번호에 쓸 수 없어 '|'로 바꾼다 (firestore.rules 의 safeId 와 같은 규칙)
  function safeId(shop){ return String(shop || '').split('/').join('|'); }
  function name(coll, id){ return 'projects/seilindia/databases/(default)/documents/' + coll + '/' + String(id); }

  // 파이어스토어 호출 (POST 기본, GET·DELETE 는 방식만 바꿈)
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
        err.status = r.status;
        err.body = d;
        throw err;
      });
    }, function(e){ clearTimeout(timer); throw e; });
  }

  // 오류 → 화면에 쓰는 이름
  function errOf(e){
    if(!e) return 'net';
    var m = String((e.body && e.body.error && e.body.error.message) || e.message || '').toLowerCase();
    if(m.indexOf('already exists') > -1 || e.status === 409) return 'dup_url';
    if(m.indexOf('not found') > -1) return 'notfound';
    if(e.status === 403 || m.indexOf('permission') > -1) return 'bad_pin';
    return 'net';
  }

  // 주소 비교 열쇠 — 창고와 같게 앞의 http(s)://·www.와 뒤의 ?#…·끝 슬래시를 뺀다
  function keyOf(u){
    return String(u === undefined || u === null ? '' : u).trim()
      .replace(/[?#].*$/, '').replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/+$/, '');
  }
  // 32비트 해시 두 개를 이어 붙여 문서 번호를 만든다 (같은 날 같은 주소 = 같은 번호)
  function fnv(s, seed){
    var h = seed >>> 0;
    for(var i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return ('0000000' + h.toString(16)).slice(-8);
  }
  function linkId(date, url){
    var k = String(date) + '\n' + keyOf(url);
    return date + '_' + fnv(k, 2166136261) + fnv(k + '#2', 2445677089);
  }
  function rid(p){
    return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }
  function hhmm(iso){
    var t = Date.parse(iso || '');
    if(!t) return '';
    var d = new Date(t + 9 * 3600 * 1000);
    return ('0' + d.getUTCHours()).slice(-2) + ':' + ('0' + d.getUTCMinutes()).slice(-2);
  }

  // 쓰기 한 건 만들기
  function createDoc(coll, id, o, stamp){
    var w = { update: { name: name(coll, id), fields: fields(o) }, currentDocument: { exists: false } };
    if(stamp) w.updateTransforms = [{ fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' }];
    return w;
  }
  function patchDoc(coll, id, o, mask){
    return { update: { name: name(coll, id), fields: fields(o) }, updateMask: { fieldPaths: mask }, currentDocument: { exists: true } };
  }
  function delDoc(coll, id){ return { delete: name(coll, id) }; }
  function commit(writes){ return req('documents:commit', { writes: writes }); }
  // 확인용 문서 정리(지우기) — 실패해도 그냥 넘어간다
  function tidy(coll, id){
    return req('documents/' + coll + '/' + encodeURIComponent(id), null, 'DELETE').then(function(){ return true; }, function(){ return false; });
  }

  // ── 읽기 사용량 집계 (운영 센터 카드) — 그날 문서 수만큼 더한다
  function kstDay(){ return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10); }
  function bump(n){
    n = Math.round(Number(n) || 0);
    if(n <= 0) return Promise.resolve(false);
    return commit([{ update: { name: name('stats', kstDay()), fields: {} },
                     updateMask: { fieldPaths: [] },
                     updateTransforms: [{ fieldPath: 'reads', increment: { integerValue: String(n) } }] }])
      .then(function(){ return true; }, function(){ return false; });
  }
  function stat(day){
    return req('documents/stats/' + encodeURIComponent(day), null, 'GET').then(function(doc){
      var v = doc && doc.fields && doc.fields.reads && doc.fields.reads.integerValue;
      return parseInt(v || 0, 10) || 0;
    }, function(){ return 0; });
  }

  // 그날 목록 읽기
  function day(date){
    return req('documents:runQuery', { structuredQuery: {
      from: [{ collectionId: 'links' }],
      where: { fieldFilter: { field: { fieldPath: 'date' }, op: 'EQUAL', value: str(date) } }
    } }).then(function(rows){
      var out = [];
      (rows || []).forEach(function(r){
        var doc = r && r.document;
        if(!doc) return;
        var f = doc.fields || {}, d = {};
        for(var k in f){
          var v = f[k];
          d[k] = (v.stringValue !== undefined) ? v.stringValue
            : (v.integerValue !== undefined) ? parseInt(v.integerValue, 10)
            : (v.timestampValue !== undefined) ? v.timestampValue : '';
        }
        var id = String(doc.name || '').split('/').pop();
        remember(id, d);
        out.push({
          row: id, id: id, date: d.date || '', no: (d.no === undefined ? '' : d.no),
          shop: d.shop || '', kind: d.kind || '', url: d.url || '',
          t: hhmm(d.createdAt), at: Date.parse(d.createdAt || '') || 0, memo: d.memo || ''
        });
      });
      out.sort(function(a, b){ return (a.at - b.at) || (a.id < b.id ? -1 : 1); });
      bump(out.length); // 운영 센터 사용량 카드에 오늘 읽은 문서 수를 더한다
      return out;
    });
  }

  // 고치기·지우기에 필요한 문서 속(지우기 확인용 번호)을 기억해 둔다
  var mem = {};
  function remember(id, d){ if(id && d){ mem[id] = { chkDel: d.chkDel || '', shop: d.shop || '', date: d.date || '', no: (d.no === undefined ? '' : d.no) }; } }
  function meta(id){
    if(mem[id] && mem[id].chkDel) return Promise.resolve(mem[id]);
    if(mem[id] && !mem[id].chkDel) return Promise.reject(new Error('net'));
    return req('documents/links/' + encodeURIComponent(id), null, 'GET').then(function(doc){
      var f = (doc && doc.fields) || {}, d = {};
      for(var k in f){
        var v = f[k];
        d[k] = (v.stringValue !== undefined) ? v.stringValue
          : (v.integerValue !== undefined) ? parseInt(v.integerValue, 10) : '';
      }
      remember(id, d);
      return d;
    });
  }

  // 남기기
  function add(o){
    return pinRetry(o.shop, o.pin, function(){ return add1(o); });
  }
  function add1(o){
    var id = linkId(o.date, o.url), chk = rid('c');
    return commit([
      createDoc('checks', chk, { op: 'write', id: id, shop: o.shop, pin: String(o.pin) }),
      createDoc('links', id, {
        id: id, date: String(o.date), shop: String(o.shop), kind: String(o.kind), url: String(o.url),
        no: (o.no === undefined || o.no === null || o.no === '') ? 0 : o.no, memo: '',
        chk: chk, chkDel: rid('d')
      }, true)
    ]).then(function(){
      tidy('checks', chk);
      return { ok: true, id: id };
    }, function(e){ return { ok: false, error: errOf(e) }; });
  }

  // 고치기 — 주소가 그대로면 구분만 바꾸고, 주소가 바뀌면 번호가 바뀌므로 새로 만들고 옛것을 지운다
  function edit(o){
    return pinRetry(o.shop, o.pin, function(){ return edit1(o); });
  }
  function edit1(o){
    var nid = linkId(o.date, o.url);
    if(nid === o.id){
      var chk = rid('c');
      return commit([
        createDoc('checks', chk, { op: 'write', id: o.id, shop: o.shop, pin: String(o.pin) }),
        patchDoc('links', o.id, { kind: String(o.kind), chk: chk }, ['kind', 'chk'])
      ]).then(function(){
        tidy('checks', chk);
        return { ok: true, id: o.id };
      }, function(e){ return { ok: false, error: errOf(e) }; });
    }
    return meta(o.id).then(function(m){
      var chk = rid('c');
      return tidy('checks', m.chkDel).then(function(){
        return commit([
          createDoc('checks', chk, { op: 'write', id: nid, shop: o.shop, pin: String(o.pin) }),
          createDoc('links', nid, {
            id: nid, date: String(o.date), shop: String(o.shop), kind: String(o.kind), url: String(o.url),
            no: (o.no === undefined || o.no === null || o.no === '') ? 0 : o.no, memo: '',
            chk: chk, chkDel: rid('d')
          }, true),
          createDoc('checks', m.chkDel, { op: 'del', id: o.id, shop: String(o.shop), pin: String(o.pin) }),
          delDoc('links', o.id)
        ]);
      }).then(function(){
        tidy('checks', chk); tidy('checks', m.chkDel);
        return { ok: true, id: nid };
      }, function(e){ return { ok: false, error: errOf(e) }; });
    }, function(){ return { ok: false, error: 'net' }; });
  }

  // 지우기 (본인)
  function del(o){
    return pinRetry(o.shop, o.pin, function(){ return del1(o); });
  }
  function del1(o){
    return meta(o.id).then(function(m){
      return tidy('checks', m.chkDel).then(function(){
        return commit([
          createDoc('checks', m.chkDel, { op: 'del', id: o.id, shop: String(o.shop || m.shop), pin: String(o.pin) }),
          delDoc('links', o.id)
        ]);
      });
    }).then(function(){ tidy('checks', (mem[o.id] || {}).chkDel); return { ok: true }; }, function(e){ return { ok: false, error: errOf(e) }; });
  }

  // 지우기 (스태프 — 운영 센터 비밀번호)
  function staffDel(o){
    return meta(o.id).then(function(m){
      return tidy('checks', m.chkDel).then(function(){
        return commit([
          createDoc('checks', m.chkDel, { op: 'staff', id: o.id, pw: STAFF_PW }),
          delDoc('links', o.id)
        ]);
      });
    }).then(function(){ tidy('checks', (mem[o.id] || {}).chkDel); return { ok: true }; }, function(e){ return { ok: false, error: errOf(e) }; });
  }

  // 처음 들어온 회원이면 암호 문서를 만들어 둔다 (이미 있으면 그대로 둔다) — 같은 화면에서 한 번만 시도
  var pinDone = {};
  function ensurePin(shop, pin){
    if(!shop || !/^[0-9]{4}$/.test(String(pin || ''))) return Promise.resolve(false);
    var k = safeId(shop) + '|' + pin;
    if(pinDone[k]) return Promise.resolve(true);
    return commit([createDoc('pins', safeId(shop), { pin: String(pin) })]).then(function(){ pinDone[k] = 1; return true; }, function(e){
      var m = String((e.body && e.body.error && e.body.error.message) || '').toLowerCase();
      if(e && (e.status === 409 || m.indexOf('already exists') > -1)){ pinDone[k] = 1; return true; }
      return false;
    });
  }
  // 암호 문서가 아직 없어서 막힌 경우 한 번 더: 암호 문서를 만들고 다시 시도한다
  function pinRetry(shop, pin, again){
    return again().then(function(r){
      if(!r || r.ok || r.error !== 'bad_pin') return r;
      return ensurePin(shop, pin).then(function(){ return again(); });
    });
  }

  // 스태프가 암호를 바꾸거나 비울 때 (운영 센터) — 파이어스토어 암호 문서도 같이 맞춘다
  function setPin(shop, pin){
    if(!shop) return Promise.resolve(false);
    var v = String(pin === undefined || pin === null ? '' : pin);
    var chk = { op: 'pinset', pin: v, pw: STAFF_PW }, sid = safeId(shop);
    if(!v){
      return req('documents/pinchk/' + encodeURIComponent(sid), null, 'DELETE').then(function(){
        return commit([ createDoc('pinchk', sid, chk), delDoc('pins', sid) ]);
      }).then(function(){ tidy('pinchk', sid); return true; }, function(){ return false; });
    }
    if(!/^[0-9]{4}$/.test(v)) return Promise.resolve(false);
    return req('documents/pinchk/' + encodeURIComponent(sid), null, 'DELETE').then(function(){
      return commit([ createDoc('pinchk', sid, chk), patchDoc('pins', sid, { pin: v }, ['pin']) ]);
    }).then(function(){ tidy('pinchk', sid); return true; }, function(){
      // 아직 암호 문서가 없는 회원이면 새로 만든다
      return commit([ createDoc('pinchk', sid, chk), createDoc('pins', sid, { pin: v }) ]).then(function(){ tidy('pinchk', sid); return true; }, function(){ return false; });
    });
  }

  // ── 운영 데이터 묶음 (meta/members, meta/invites)
  function getMeta(mid){
    return req('documents/meta/' + encodeURIComponent(mid), null, 'GET').then(function(doc){
      var s = doc && doc.fields && doc.fields.data && doc.fields.data.stringValue;
      if(!s) return null;
      try{ return JSON.parse(s); }catch(e){ return null; }
    }, function(){ return null; });
  }
  function saveMeta(mid, obj){
    var cid = rid('m_');
    var chk = createDoc('checks', cid, { op: 'staff', id: mid, pw: STAFF_PW });
    var w = {
      update: { name: name('meta', mid), fields: fields({ data: JSON.stringify(obj), chk: cid }) },
      updateTransforms: [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }]
    };
    return commit([chk, w]).then(function(){
      tidy('checks', cid);
      return { ok: true };
    }, function(e){
      tidy('checks', cid);
      return { ok: false, error: errOf(e) };
    });
  }

  // ── 뷰티수강 클릭 통계 (clicks/{insta})
  function getClicks(){
    return req('documents/clicks?pageSize=200', null, 'GET').then(function(d){
      var map = {};
      ((d && d.documents) || []).forEach(function(doc){
        var id = String(doc.name || '').split('/').pop();
        var v = doc.fields && doc.fields.count && doc.fields.count.integerValue;
        if(id) map[id] = parseInt(v || 0, 10) || 0;
      });
      return map;
    }, function(){ return {}; });
  }
  function hitClick(insta){
    var id = safeId(String(insta || '').replace(/^@+/, '').trim());
    if(!id) return Promise.resolve(false);
    return commit([{
      update: { name: name('clicks', id), fields: {} },
      updateMask: { fieldPaths: [] },
      updateTransforms: [{ fieldPath: 'count', increment: { integerValue: '1' } }]
    }]).then(function(){ return true; }, function(){ return false; });
  }

  // ── 기능 제안 / 건의함 (suggestions/{sid})
  function addSuggestion(from, text){
    var sid = rid('sg_');
    var w = createDoc('suggestions', sid, {
      id: sid,
      text: String(text || '').slice(0, 500),
      from: String(from || '익명').slice(0, 60),
      status: 'open'
    }, true);
    return commit([w]).then(function(){ return { ok: true, id: sid }; }, function(e){ return { ok: false, error: errOf(e) }; });
  }
  function listSuggestions(){
    return req('documents/suggestions?pageSize=100', null, 'GET').then(function(d){
      var out = [];
      ((d && d.documents) || []).forEach(function(doc){
        var f = doc.fields || {};
        var st = f.status && f.status.stringValue || 'open';
        if(st === 'done') return;
        out.push({
          id: (f.id && f.id.stringValue) || String(doc.name || '').split('/').pop(),
          from: (f.from && f.from.stringValue) || '익명',
          text: (f.text && f.text.stringValue) || '',
          createdAt: (f.createdAt && f.createdAt.timestampValue) || '',
          ts: Date.parse((f.createdAt && f.createdAt.timestampValue) || '') || 0
        });
      });
      out.sort(function(a, b){ return b.ts - a.ts; });
      return out;
    }, function(){ return []; });
  }
  function doneSuggestion(item){
    if(!item || !item.id) return Promise.resolve({ ok: false });
    var cid = rid('sg_');
    var chk = createDoc('checks', cid, { op: 'staff', id: item.id, pw: STAFF_PW });
    var w = {
      update: {
        name: name('suggestions', item.id),
        fields: {
          id: str(item.id),
          text: str(item.text || ''),
          from: str(item.from || '익명'),
          status: str('done'),
          chk: str(cid),
          createdAt: { timestampValue: item.createdAt || new Date().toISOString() }
        }
      },
      updateTransforms: [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }],
      currentDocument: { exists: true }
    };
    return commit([chk, w]).then(function(){
      tidy('checks', cid);
      return { ok: true };
    }, function(e){
      tidy('checks', cid);
      return { ok: false, error: errOf(e) };
    });
  }

  // ── 아카데미 수강 상담 신청함 (consults/{cid})
  function addConsult(o){
    var cid = rid('cs_');
    var w = createDoc('consults', cid, {
      id: cid,
      name: String((o && o.name) || '').slice(0, 40),
      phone: String((o && o.phone) || '').slice(0, 40),
      course: String((o && o.course) || '').slice(0, 60),
      memo: String((o && o.memo) || '').slice(0, 400),
      status: 'open'
    }, true);
    return commit([w]).then(function(){ return { ok: true, id: cid }; }, function(e){ return { ok: false, error: errOf(e) }; });
  }
  function listConsults(){
    return req('documents/consults?pageSize=100', null, 'GET').then(function(d){
      var out = [];
      ((d && d.documents) || []).forEach(function(doc){
        var f = doc.fields || {};
        out.push({
          id: (f.id && f.id.stringValue) || String(doc.name || '').split('/').pop(),
          name: (f.name && f.name.stringValue) || '',
          phone: (f.phone && f.phone.stringValue) || '',
          course: (f.course && f.course.stringValue) || '',
          memo: (f.memo && f.memo.stringValue) || '',
          status: (f.status && f.status.stringValue) || 'open',
          createdAt: (f.createdAt && f.createdAt.timestampValue) || '',
          ts: Date.parse((f.createdAt && f.createdAt.timestampValue) || '') || 0
        });
      });
      out.sort(function(a, b){ return b.ts - a.ts; });
      return out;
    }, function(){ return []; });
  }
  function doneConsult(item){
    if(!item || !item.id) return Promise.resolve({ ok: false });
    var cid = rid('cs_');
    var chk = createDoc('checks', cid, { op: 'staff', id: item.id, pw: STAFF_PW });
    var w = {
      update: {
        name: name('consults', item.id),
        fields: {
          id: str(item.id),
          name: str(item.name || ''),
          phone: str(item.phone || ''),
          course: str(item.course || ''),
          memo: str(item.memo || ''),
          status: str(item.status === 'done' ? 'open' : 'done'),
          chk: str(cid),
          createdAt: { timestampValue: item.createdAt || new Date().toISOString() }
        }
      },
      updateTransforms: [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }],
      currentDocument: { exists: true }
    };
    return commit([chk, w]).then(function(){
      tidy('checks', cid);
      return { ok: true };
    }, function(e){
      tidy('checks', cid);
      return { ok: false, error: errOf(e) };
    });
  }

  // ── 일일 방문 통계 (analytics/{YYYY-MM-DD})
  function hitVisit(site){
    var fld = (site === 'aca' || site === 'dia' || site === 'crs') ? site : 'dia';
    if(/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || navigator.webdriver === true) return Promise.resolve(false);
    try{ if(localStorage.getItem('dia_no_track') === '1') return Promise.resolve(false); }catch(e){}
    return commit([{
      update: { name: name('analytics', kstDay()), fields: {} },
      updateMask: { fieldPaths: [] },
      updateTransforms: [{ fieldPath: fld, increment: { integerValue: '1' } }]
    }]).then(function(){ return true; }, function(){ return false; });
  }
  function getAnalytics(){
    return req('documents/analytics?pageSize=30', null, 'GET').then(function(d){
      var out = {};
      ((d && d.documents) || []).forEach(function(doc){
        var id = String(doc.name || '').split('/').pop();
        var f = doc.fields || {};
        var iv = function(k){ return (f[k] && f[k].integerValue !== undefined) ? (parseInt(f[k].integerValue, 10) || 0) : null; };
        out[id] = {
          dia: parseInt((f.dia && f.dia.integerValue) || 0, 10) || 0,
          aca: parseInt((f.aca && f.aca.integerValue) || 0, 10) || 0,
          crs: parseInt((f.crs && f.crs.integerValue) || 0, 10) || 0,
          // 미니게임 플레이 수 — 집계 전 날짜는 0이 아니라 null(모름)로 돌려준다
          game: iv('game'), g_mem: iv('g_mem'), g_react: iv('g_react'), g_lotto: iv('g_lotto')
        };
      });
      return out;
    }, function(){ return {}; });
  }

  // ── 하루치 분석 문서(analytics/{YYYY-MM-DD}) 하나만 읽기 — 미니게임 카드가 7일치만 읽도록
  //    값이 없는 항목은 0이 아니라 null 로 돌려준다(집계 시작 전 날짜를 0으로 단정하지 않게).
  function dayAnalytics(day){
    return req('documents/analytics/' + encodeURIComponent(day), null, 'GET').then(function(doc){
      var f = (doc && doc.fields) || {};
      function iv(k){ return (f[k] && f[k].integerValue !== undefined) ? (parseInt(f[k].integerValue, 10) || 0) : null; }
      return { day: day, game: iv('game'), g_mem: iv('g_mem'), g_react: iv('g_react'), g_lotto: iv('g_lotto') };
    }, function(){
      return { day: day, game: null, g_mem: null, g_react: null, g_lotto: null };
    });
  }

  // ── 커뮤니티 홈 미니게임 플레이 수 (analytics/{YYYY-MM-DD} 의 game·g_*)
  //    게임을 여는 순간 1회만 부른다. 같은 판의 반복 클릭은 세지 않는다.
  //    hitVisit 과 같은 제외 조건(로컬·자동화·dia_no_track)을 쓰되, 검증용으로만
  //    sessionStorage 'dia_game_track'='1' 또는 주소에 ?gametrack=1 이 있으면 센다.
  function gameTrackOn(){
    try{
      if(sessionStorage.getItem('dia_game_track') === '1') return true;
      if(/[?&]gametrack=1/.test(location.search)){ sessionStorage.setItem('dia_game_track', '1'); return true; }
    }catch(e){}
    return false;
  }
  function hitGame(kind){
    if(!gameTrackOn()){
      if(/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || navigator.webdriver === true) return Promise.resolve(false);
      try{ if(localStorage.getItem('dia_no_track') === '1') return Promise.resolve(false); }catch(e){}
    }
    var k = String(kind || '');
    var fld = (k === 'mem' || k === 'react' || k === 'lotto') ? ('g_' + k) : '';
    var tr = [{ fieldPath: 'game', increment: { integerValue: '1' } }];
    if(fld) tr.push({ fieldPath: fld, increment: { integerValue: '1' } });
    return commit([{
      update: { name: name('analytics', kstDay()), fields: {} },
      updateMask: { fieldPaths: [] },
      updateTransforms: tr
    }]).then(function(){ return true; }, function(){ return false; });
  }

  // ── 강의별 조회수 (course_views/{YYYY-MM-DD} 의 views 맵)
  //    dia-course.html 카드의 고유 값(data-nick)을 그대로 강의 구분으로 쓴다.
  //    이름에 든 점(.)은 필드 경로에서 백틱으로 감싼다. 같은 기기가 30분 안에 같은 강의를 다시 열면 세지 않는다.
  function cviewKey(cid){ return String(cid === undefined || cid === null ? '' : cid).trim().replace(/`/g, ''); }
  function courseTrackOn(){
    try{
      if(sessionStorage.getItem('dia_course_track') === '1') return true;
      if(/[?&]coursetrack=1/.test(location.search)){ sessionStorage.setItem('dia_course_track', '1'); return true; }
    }catch(e){}
    return false;
  }
  function hitCourse(cid){
    var k = cviewKey(cid);
    if(!k) return Promise.resolve(false);
    if(!courseTrackOn()){
      if(/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || navigator.webdriver === true) return Promise.resolve(false);
      try{ if(localStorage.getItem('dia_no_track') === '1') return Promise.resolve(false); }catch(e){}
    }
    var ck = 'dia_cv_' + k;
    try{
      var last = Number(sessionStorage.getItem(ck) || 0);
      if(last && (Date.now() - last) < 1800000) return Promise.resolve(false);   // 30분 안 중복
      sessionStorage.setItem(ck, String(Date.now()));
    }catch(e){}
    return commit([{
      update: { name: name('course_views', kstDay()), fields: {} },
      updateMask: { fieldPaths: [] },
      updateTransforms: [{ fieldPath: 'views.`' + k + '`', increment: { integerValue: '1' } }]
    }]).then(function(){ return true; }, function(){ return false; });
  }
  // 최근 n일 course_views 합계 — { days: {날짜: {강의: 횟수} | null}, total: {강의: 합계} }
  function getCourseViews(n){
    n = Math.max(1, Math.min(14, Number(n) || 7));
    var list = [], i;
    for(i = 0; i < n; i++){ list.push(new Date(Date.now() + 9 * 3600 * 1000 - i * 86400000).toISOString().slice(0, 10)); }
    return Promise.all(list.map(function(d){
      return req('documents/course_views/' + encodeURIComponent(d), null, 'GET').then(function(doc){
        var v = doc && doc.fields && doc.fields.views && doc.fields.views.mapValue;
        var out = {};
        if(v && v.fields){
          for(var k in v.fields){ out[k] = parseInt((v.fields[k] && v.fields[k].integerValue) || 0, 10) || 0; }
        }
        return { day: d, views: (v ? out : null) };
      }, function(){ return { day: d, views: null }; });
    })).then(function(rows){
      var byDay = {}, total = {};
      rows.forEach(function(r){
        byDay[r.day] = r.views;
        if(r.views){ for(var k in r.views){ total[k] = (total[k] || 0) + r.views[k]; } }
      });
      return { days: byDay, total: total };
    });
  }

  // ── 품앗이 일일 이력 (pumasi_logs/{YYYY-MM-DD})
  function savePumasiLog(o){
    var d = String((o && o.day) || kstDay()).slice(0, 10);
    var cid = rid('pl_');
    var chk = createDoc('checks', cid, { op: 'staff', id: d, pw: STAFF_PW });
    var w = {
      update: {
        name: name('pumasi_logs', d),
        fields: fields({
          day: d,
          done: String((o && o.done) || '').slice(0, 1000),
          miss: String((o && o.miss) || '').slice(0, 500),
          bongsa: String((o && o.bongsa) || '').slice(0, 500),
          memo: String((o && o.memo) || '').slice(0, 400),
          chk: cid
        })
      },
      updateTransforms: [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }]
    };
    return commit([chk, w]).then(function(){ tidy('checks', cid); return { ok: true, day: d }; },
      function(e){ tidy('checks', cid); return { ok: false, error: errOf(e) }; });
  }
  function listPumasiLogs(){
    return req('documents/pumasi_logs?pageSize=30', null, 'GET').then(function(d){
      var out = [];
      ((d && d.documents) || []).forEach(function(doc){
        var f = doc.fields || {};
        out.push({
          day: (f.day && f.day.stringValue) || String(doc.name || '').split('/').pop(),
          done: (f.done && f.done.stringValue) || '',
          miss: (f.miss && f.miss.stringValue) || '',
          bongsa: (f.bongsa && f.bongsa.stringValue) || '',
          memo: (f.memo && f.memo.stringValue) || ''
        });
      });
      out.sort(function(a, b){ return a.day < b.day ? 1 : (a.day > b.day ? -1 : 0); });
      return out;
    }, function(){ return []; });
  }

  // ── 인스타 DM 현황판 (dm_leads/{lid})
  function saveDmLead(o){
    var id = String((o && o.id) || rid('dm_'));
    var cid = rid('dc_');
    var chk = createDoc('checks', cid, { op: 'staff', id: id, pw: STAFF_PW });
    var w = {
      update: {
        name: name('dm_leads', id),
        fields: fields({
          id: id,
          handle: String((o && o.handle) || '').slice(0, 60),
          acct: String((o && o.acct) || '@seilin_beauty.pr').slice(0, 40),
          status: String((o && o.status) || 'sent'),
          memo: String((o && o.memo) || '').slice(0, 200),
          chk: cid
        })
      },
      updateTransforms: [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }]
    };
    return commit([chk, w]).then(function(){ tidy('checks', cid); return { ok: true, id: id }; },
      function(e){ tidy('checks', cid); return { ok: false, error: errOf(e) }; });
  }
  function listDmLeads(){
    return req('documents/dm_leads?pageSize=100', null, 'GET').then(function(d){
      var out = [];
      ((d && d.documents) || []).forEach(function(doc){
        var f = doc.fields || {};
        out.push({
          id: (f.id && f.id.stringValue) || String(doc.name || '').split('/').pop(),
          handle: (f.handle && f.handle.stringValue) || '',
          acct: (f.acct && f.acct.stringValue) || '@seilin_beauty.pr',
          status: (f.status && f.status.stringValue) || 'sent',
          memo: (f.memo && f.memo.stringValue) || '',
          ts: Date.parse((f.updatedAt && f.updatedAt.timestampValue) || '') || 0
        });
      });
      out.sort(function(a, b){ return b.ts - a.ts; });
      return out;
    }, function(){ return []; });
  }


  // ── 지인 초대 2주(14일) 연속 참여 완료 — 완료패스 1장 자동 지급 + 채팅 알림 (2026-11-26 커비)
  //    · 지급 대상은 추천인(초대한 사람). 피추천인 1명이 14일을 채울 때마다 추천인에게 1장, 인원 제한 없음.
  //      피추천인에게는 지급하지 않는다. (도현 님 확정 2026-11-26: "내가 3명 데리고 왔으면 나는 3장,
  //      내 친구들은 못 받는다" — 3명은 예시이고 규칙은 '피추천인 1명당 1장'.)
  //    · 지급: 운영 데이터 묶음(meta/members)의 patch[추천인 닉네임].b(완료패스 보유)를 1 올린다.
  //      dia.html 이 patch 값을 명부에 그대로 덮어쓰므로 원장님 '마이페이지 → 완료패스'에 바로 반영된다.
  //    · 알림 1 — 추천인 본인 채팅: chats/{추천인열쇠}_passnotice 방에 '완료패스 안내' 이름으로 1건.
  //      원장님이 커뮤니티 홈에서 로그인해 💬 채팅을 열면 자기 목록에 '완료패스 안내' 방으로 뜬다(안 읽은 수 1).
  //      ※ 채팅 화면에서 'i'는 원장님 본인 쪽이라, 원장님에게 '받은 메시지'로 보이려면 'c' 쪽으로 넣는다.
  //    · 알림 2 — STAFF 방: chats/{추천인열쇠}_staffnotice 방에 STAFF 명의 기록 1건(기존 방식 그대로).
  //    · 한 초대 건당 1회: 메시지 문서 번호를 초대 건으로 고정(pg_… / pn_…)하고 '없을 때만 만들기'로 잠근다.
  //      지급(meta 갱신)과 두 알림 만들기를 한 번의 쓰기로 묶어, 한쪽만 되는 일이 없게 한다.
  var STAFF_CUST = 'staffnotice';
  var STAFF_ROOM_NAME = 'STAFF';
  var PASS_CUST = 'passnotice';           // 완료패스 안내 — 회원 본인 채팅 목록에 뜨는 방 (보안규칙 cust 8자 이상)
  var PASS_ROOM_NAME = '완료패스 안내';
  function normId(x){ return String(x === undefined || x === null ? '' : x).replace(/^@+/, '').trim().toLowerCase(); }
  function inviteMsgId(a, b){ var k = String(a) + '\n' + String(b); return 'pg_' + fnv(k, 2166136261) + fnv(k + '#2', 2445677089); }
  function inviteNoticeId(a, b){ var k = String(a) + '\n' + String(b); return 'pn_' + fnv(k, 2166136261) + fnv(k + '#3', 2445677089); }

  // 알림방이 없으면 만든다 (있으면 그대로)
  function ensureRoom(rid, owner, nick, cust, custName){
    return req('documents/chats/' + encodeURIComponent(rid), null, 'GET').then(function(){ return true; }, function(e){
      if(e && e.status !== 404) return false;
      var w = {
        update: { name: name('chats', rid), fields: fields({
          roomId: rid, owner: owner, nick: String(nick || '').slice(0, 80), cust: cust,
          custName: custName, last: '', lastFrom: 'c', unreadC: 0, unreadI: 0
        }) },
        currentDocument: { exists: false },
        updateTransforms: [{ fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' },
                           { fieldPath: 'lastAt', setToServerValue: 'REQUEST_TIME' }]
      };
      return commit([w]).then(function(){ return true; }, function(e2){
        var m = String((e2.body && e2.body.error && e2.body.error.message) || '').toLowerCase();
        if(e2 && (e2.status === 409 || m.indexOf('already exists') > -1)) return true;
        return false;
      });
    });
  }
  function ensureStaffRoom(rid, owner, nick){ return ensureRoom(rid, owner, nick, STAFF_CUST, STAFF_ROOM_NAME); }
  function ensurePassRoom(rid, owner, nick){ return ensureRoom(rid, owner, nick, PASS_CUST, PASS_ROOM_NAME); }

  // 완료패스 1장 지급 + 본인 채팅 안내 1건 + STAFF 방 기록 1건 (한 초대 건당 1회)
  function grantInvitePass(o){
    o = o || {};
    var inviter = String(o.inviter || '').trim();      // 추천인 — 완료패스를 받는 사람
    var invitee = String(o.invitee || '').trim();      // 피추천인 — 14일을 채운 사람, 지급 없음
    var owner = normId(o.ownerKey || inviter);
    var text = String(o.text || '').slice(0, 300);            // STAFF 방 기록 문구
    var notice = String(o.notice || o.text || '').slice(0, 300);  // 추천인 본인 채팅에 뜨는 지급 안내
    if(!inviter || !invitee || !owner || !text) return Promise.resolve({ ok: false, error: 'bad' });
    var roomId = safeId(owner) + '_' + STAFF_CUST;
    var noticeRoomId = safeId(owner) + '_' + PASS_CUST;
    var mid = inviteMsgId(inviter, invitee);
    var nmid = inviteNoticeId(inviter, invitee);
    // 이미 보낸 초대 건이면 그때 시각을 돌려준다 (재조회해도 두 번 지급되지 않게)
    return req('documents/chats/' + encodeURIComponent(roomId) + '/msgs/' + encodeURIComponent(mid), null, 'GET').then(function(doc){
      var at = doc && doc.fields && doc.fields.at && doc.fields.at.timestampValue;
      return { ok: false, already: true, at: at || '' };
    }, function(e){
      if(!e || e.status !== 404) return { ok: false, error: errOf(e) };
      return ensureStaffRoom(roomId, owner, o.nick || inviter).then(function(roomOk){
        if(!roomOk) return { ok: false, error: 'room' };
        return ensurePassRoom(noticeRoomId, owner, o.nick || inviter).then(function(noticeOk){
          if(!noticeOk) return { ok: false, error: 'room2' };
          return getMeta('members').then(function(meta){
          var m = (meta && typeof meta === 'object') ? meta : {};
          var patch = (m.patch && typeof m.patch === 'object') ? m.patch : {};
          var cur = (patch[inviter] && typeof patch[inviter] === 'object') ? patch[inviter] : {};
          var base = (typeof cur.b === 'number' && isFinite(cur.b)) ? cur.b : Math.max(0, Math.round(Number(o.basePass) || 0));
          var next = {}, k, k2;
          for(k in patch){ next[k] = patch[k]; }
          next[inviter] = {};
          for(k2 in cur){ next[inviter][k2] = cur[k2]; }
          next[inviter].b = base + 1;
          var data = JSON.stringify({ add: (m.add || []), patch: next });
          var cid = rid('g_');
          var writes = [
            createDoc('checks', cid, { op: 'staff', id: 'members', pw: STAFF_PW }),
            { update: { name: name('meta', 'members'), fields: fields({ data: data, chk: cid }) },
              updateTransforms: [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }] },
            { update: { name: name('chats/' + roomId + '/msgs', mid), fields: fields({ from: 'c', text: text }) },
              currentDocument: { exists: false },
              updateTransforms: [{ fieldPath: 'at', setToServerValue: 'REQUEST_TIME' }] },
            { update: { name: name('chats', roomId), fields: fields({ last: text.slice(0, 60), lastFrom: 'c' }) },
              updateMask: { fieldPaths: ['last', 'lastFrom'] },
              updateTransforms: [{ fieldPath: 'lastAt', setToServerValue: 'REQUEST_TIME' },
                                 { fieldPath: 'unreadI', increment: { integerValue: '1' } }],
              currentDocument: { exists: true } },
            // 추천인 본인 채팅 — 지급 안내
            { update: { name: name('chats/' + noticeRoomId + '/msgs', nmid), fields: fields({ from: 'c', text: notice }) },
              currentDocument: { exists: false },
              updateTransforms: [{ fieldPath: 'at', setToServerValue: 'REQUEST_TIME' }] },
            { update: { name: name('chats', noticeRoomId), fields: fields({ last: notice.slice(0, 60), lastFrom: 'c' }) },
              updateMask: { fieldPaths: ['last', 'lastFrom'] },
              updateTransforms: [{ fieldPath: 'lastAt', setToServerValue: 'REQUEST_TIME' },
                                 { fieldPath: 'unreadI', increment: { integerValue: '1' } }],
              currentDocument: { exists: true } }
          ];
          return commit(writes).then(function(){
            tidy('checks', cid);
            return { ok: true, at: new Date().toISOString(), roomId: roomId, noticeRoomId: noticeRoomId, pass: base + 1 };
          }, function(e2){
            tidy('checks', cid);
            var m2 = String((e2.body && e2.body.error && e2.body.error.message) || '').toLowerCase();
            if(e2 && (e2.status === 409 || m2.indexOf('already exists') > -1)) return { ok: false, already: true, at: '' };
            return { ok: false, error: errOf(e2) };
          });
        });
        });
      });
    });
  }

  window.DiaFB = {
    day: day, add: add, edit: edit, del: del, staffDel: staffDel,
    ensurePin: ensurePin, setPin: setPin, safeId: safeId, stat: stat, kstDay: kstDay,
    linkId: linkId, keyOf: keyOf, STAFF_PW: STAFF_PW,
    getMeta: getMeta, saveMeta: saveMeta,
    getClicks: getClicks, hitClick: hitClick,
    addSuggestion: addSuggestion, listSuggestions: listSuggestions, doneSuggestion: doneSuggestion,
    addConsult: addConsult, listConsults: listConsults, doneConsult: doneConsult,
    hitVisit: hitVisit, hitGame: hitGame, getAnalytics: getAnalytics, dayAnalytics: dayAnalytics,
    hitCourse: hitCourse, getCourseViews: getCourseViews,
    savePumasiLog: savePumasiLog, listPumasiLogs: listPumasiLogs,
    saveDmLead: saveDmLead, listDmLeads: listDmLeads,
    grantInvitePass: grantInvitePass
  };
})();
