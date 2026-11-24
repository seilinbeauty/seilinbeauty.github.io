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

  window.DiaFB = {
    day: day, add: add, edit: edit, del: del, staffDel: staffDel,
    ensurePin: ensurePin, setPin: setPin, safeId: safeId, stat: stat, kstDay: kstDay,
    linkId: linkId, keyOf: keyOf, STAFF_PW: STAFF_PW
  };
})();
