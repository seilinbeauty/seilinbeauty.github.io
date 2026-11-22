/* 다이아 4자리 암호 (공용)
   - “내 품앗이” '오늘 내 링크 남기기'에서 본인 확인용.
   - 처음 넣은 숫자 4자리가 그대로 내 암호가 됩니다. 다음부터는 맞아야 남길 수 있어요.
   - 운영 센터 회원 목록에서 스태프가 보고 바꿀 수 있어요.
   - LIVE=false(미리보기): 이 기기에만 저장. LIVE=true: 창고 서버의 기존 암호 확인(mode=auth) 사용.
     스태프 보기·바꾸기는 서버에 기능이 생기면 연결합니다(커비 실장님). */
(function(){
  var LIVE = false;
  var EXEC = 'https://script.google.com/macros/s/AKfycbxLu7nD0RH1FkCKdmgQkP7AybLKit34KN9ISnuW_pHwYrLW7EaqsWddNWBSGWfJ0S-V5A/exec';
  var KEY_MAP = 'dia_pin_preview';
  function okPin(p){ return /^\d{4}$/.test(String(p || '')); }
  function map(){ try{ return JSON.parse(localStorage.getItem(KEY_MAP) || '{}') || {}; }catch(e){ return {}; } }
  function saveMap(m){ try{ localStorage.setItem(KEY_MAP, JSON.stringify(m)); }catch(e){} }
  function devKey(nick){ return 'dia_pin_dev:' + nick; }

  // 결과: {ok:true, first:true|false} 또는 {ok:false, reason:'형식'|'틀림'|'연결'}
  function check(nick, pin){
    if(!okPin(pin)) return Promise.resolve({ ok: false, reason: '형식' });
    if(LIVE){
      return fetch(EXEC + '?mode=auth&user=' + encodeURIComponent(nick) + '&pw=' + encodeURIComponent(pin), { cache: 'no-store' })
        .then(function(r){ return r.json(); })
        .then(function(d){ return d && d.ok ? { ok: true, first: !!d.first } : { ok: false, reason: '틀림' }; })
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

  // 스태프용(운영 센터): 미리보기에서는 이 기기 목록, LIVE는 서버 기능 생기면 연결
  function staffList(){ return Promise.resolve(LIVE ? null : map()); }
  function staffSet(nick, pin){
    if(pin !== '' && !okPin(pin)) return Promise.resolve({ ok: false, reason: '형식' });
    if(LIVE) return Promise.resolve({ ok: false, reason: '준비중' });
    var m = map(); if(pin === '') delete m[nick]; else m[nick] = pin; saveMap(m);
    return Promise.resolve({ ok: true });
  }
  window.DiaPin = { LIVE: LIVE, okPin: okPin, check: check, remember: remember, remembered: remembered, forget: forget, staffList: staffList, staffSet: staffSet };
})();
