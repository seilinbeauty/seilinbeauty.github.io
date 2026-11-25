/* 다이아 4자리 암호 (공용)
   - “내 품앗이” '오늘 내 링크 남기기'에서 본인 확인용.
   - 처음 넣은 숫자 4자리가 그대로 내 암호가 됩니다. 다음부터는 맞아야 남길 수 있어요.
   - 운영 센터 회원 목록에서 스태프가 보고 바꿀 수 있어요.
   - LIVE=false(미리보기): 이 기기에만 저장. LIVE=true: 창고 서버.
     · 확인: mode=auth (기존 로그인과 같은 규칙)
     · 스태프 보기: mode=pin_list&pw=0423 → { "닉네임": "1234" }
     · 스태프 바꾸기·초기화: mode=pin_set&pw=0423&user=...&pin=... (pin 비우면 초기화) */
(function(){
  var LIVE = true;
  var EXEC = 'https://script.google.com/macros/s/AKfycbxLu7nD0RH1FkCKdmgQkP7AybLKit34KN9ISnuW_pHwYrLW7EaqsWddNWBSGWfJ0S-V5A/exec';
  var STAFF_PW = '0423';
  var KEY_MAP = 'dia_pin_preview';
  function okPin(p){ return /^\d{4}$/.test(String(p || '')); }
  function map(){ try{ return JSON.parse(localStorage.getItem(KEY_MAP) || '{}') || {}; }catch(e){ return {}; } }
  function saveMap(m){ try{ localStorage.setItem(KEY_MAP, JSON.stringify(m)); }catch(e){} }
  function devKey(nick){ return 'dia_pin_dev:' + nick; }
  function call(q){
    if(!window.fetch) return Promise.reject(new Error('nosupport'));
    return fetch(EXEC + '?' + q + '&_=' + Date.now(), { cache: 'no-store' }).then(function(r){ return r.json(); });
  }

  // 결과: {ok:true, first:true|false} 또는 {ok:false, reason:'형식'|'틀림'|'연결'}
  function check(nick, pin){
    if(!okPin(pin)) return Promise.resolve({ ok: false, reason: '형식' });
    if(LIVE){
      return call('mode=auth&user=' + encodeURIComponent(nick) + '&pw=' + encodeURIComponent(pin))
        .then(function(d){
          if(d && d.ok){
            // 첫 등록 시 앞자리 0이 시트에서 잘리는 경우 방지
            if((d.first || d.set) && /^0/.test(pin)) staffSet(nick, pin);
            // 파이어베이스로 옮긴 뒤: 암호 문서(pins)도 있게 맞춰 둔다(이미 있으면 그대로)
            if(window.DiaFB && window.DiaFB.ensurePin) window.DiaFB.ensurePin(nick, pin);
            return { ok: true, first: !!(d.first || d.set) };
          }
          if(d && d.error === 'wrong') return { ok: false, reason: '틀림' };
          return { ok: false, reason: '연결' };
        })
        .catch(function(){ return { ok: false, reason: '연결' }; });
    }
    var m = map();
    if(!m[nick]){ m[nick] = pin; saveMap(m); return Promise.resolve({ ok: true, first: true }); }
    return Promise.resolve(m[nick] === pin ? { ok: true, first: false } : { ok: false, reason: '틀림' });
  }
  // 이 기기에 기억(다음부터 자동 입력)
  function remember(nick, pin){ try{ localStorage.setItem(devKey(nick), pin); }catch(e){} }
  function remembered(nick){ try{ return localStorage.getItem(devKey(nick)) || ''; }catch(e){ return ''; } }
  function forget(nick){ try{ localStorage.removeItem(devKey(nick)); }catch(e){} }

  // 스태프용(운영 센터): 보기 → 닉네임:암호 표, 불러오지 못하면 null
  function staffList(){
    if(!LIVE) return Promise.resolve(map());
    return call('mode=pin_list&pw=' + encodeURIComponent(STAFF_PW))
      .then(function(d){ if(d && d.ok && d.pins) return d.pins; return null; })
      .catch(function(){ return null; });
  }
  // 스태프용(운영 센터): 바꾸기(pin='' 이면 초기화)
  function staffSet(nick, pin){
    if(pin !== '' && !okPin(pin)) return Promise.resolve({ ok: false, reason: '형식' });
    if(!LIVE){
      var m = map(); if(pin === '') delete m[nick]; else m[nick] = pin; saveMap(m);
      return Promise.resolve({ ok: true });
    }
    return call('mode=pin_set&pw=' + encodeURIComponent(STAFF_PW) + '&user=' + encodeURIComponent(nick) + '&pin=' + encodeURIComponent(pin))
      .then(function(d){
        if(d && d.ok) return { ok: true };
        if(d && d.error === 'bad_pin') return { ok: false, reason: '형식' };
        return { ok: false, reason: '연결' };
      })
      .catch(function(){ return { ok: false, reason: '연결' }; });
  }
  window.DiaPin = { LIVE: LIVE, okPin: okPin, check: check, remember: remember, remembered: remembered, forget: forget, staffList: staffList, staffSet: staffSet };
})();
