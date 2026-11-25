/* 뷰티수강 카드 클릭 기록
   - 원장님 카드의 인스타그램·네이버·홈페이지 버튼과 작품 사진을 누르면 창고에 한 줄 남깁니다.
   - 저장하는 값: 원장님 인스타 아이디, 누른 곳, 익명 기기 번호. 이름·연락처는 보내지 않습니다.
   - 링크 이동과 사진 보기는 막지 않고, 저장에 실패해도 조용히 넘어갑니다.
   - 작업용 접속(?notrack=1, dia_no_track, 자동화 브라우저, 내 컴퓨터 미리보기)은 기록하지 않습니다. */
(function(){
  var EXEC = 'https://script.google.com/macros/s/AKfycbxLu7nD0RH1FkCKdmgQkP7AybLKit34KN9ISnuW_pHwYrLW7EaqsWddNWBSGWfJ0S-V5A/exec';

  function isLocal(){ return /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname); }
  function isOff(){
    var off = isLocal() || navigator.webdriver === true;
    try{
      if(/[?&]notrack=1/.test(location.search)){ localStorage.setItem('dia_no_track', '1'); off = true; }
      if(localStorage.getItem('dia_no_track') === '1'){ off = true; }
    }catch(e){}
    return off;
  }
  function deviceId(){
    var v = '';
    try{ v = localStorage.getItem('dia_vid') || ''; }catch(e){}
    if(!v){
      v = 'd' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
      try{ localStorage.setItem('dia_vid', v); }catch(e){}
    }
    return v;
  }
  function targetOf(el){
    if(el.matches('.crs-ph')) return 'photo';
    if(el.matches('.crs-act-map')) return 'naver';
    if(el.matches('.crs-act-home')) return 'homepage';
    if(el.matches('.crs-act-ig, .crs-ig')) return 'instagram';
    return '';
  }
  function instaOf(el){
    var card = el.closest('.crs-card');
    var own = el.getAttribute('data-insta') || (card && card.getAttribute('data-insta')) || '';
    if(!own && card){
      var inner = card.querySelector('[data-insta]');
      if(inner) own = inner.getAttribute('data-insta') || '';
    }
    return String(own).replace(/^@+/, '').trim();
  }
  function save(insta, target){
    // 내 컴퓨터 시험 때만 실제 저장 대신 시험 함수로 받는다
    if(isLocal() && typeof window.__DIA_CLICK_SINK__ === 'function'){
      window.__DIA_CLICK_SINK__({insta: insta, target: target, u: deviceId()});
      return;
    }
    if(isOff() || !window.fetch) return;
    if(window.DiaFB && DiaFB.hitClick){ try{ DiaFB.hitClick(insta); }catch(e){} }
    var url = EXEC + '?mode=click&insta=' + encodeURIComponent(insta) + '&target=' + target + '&u=' + encodeURIComponent(deviceId());
    fetch(url, {mode: 'no-cors', keepalive: true, cache: 'no-store'}).catch(function(){});
  }

  // 기존 인스타 이동 코드보다 먼저 기록만 하고, 이동은 그대로 둔다
  document.addEventListener('click', function(e){
    try{
      if(!e.target || !e.target.closest) return;
      var el = e.target.closest('.crs-card a.crs-ph, .crs-card a.crs-act, .crs-card a.crs-ig');
      if(!el) return;
      var target = targetOf(el), insta = instaOf(el);
      if(target && insta) save(insta, target);
    }catch(err){}
  }, true);
})();
