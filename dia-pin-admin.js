/* 운영 센터 회원 목록: '암호' 칸 (보기·바꾸기·초기화)
   - 기존 회원 목록 코드는 건드리지 않고, 표 끝에 칸을 붙입니다.
   - dia-pin.js 가 먼저 불려 있어야 합니다. */
(function(){
  var P = window.DiaPin;
  var table = document.querySelector('#ops-members table.mem');
  var body = document.getElementById('mem-body');
  if(!P || !table || !body) return;

  var css = document.createElement('style');
  css.textContent =
    'table.mem th.c-pin,table.mem td.c-pin{text-align:center;white-space:nowrap;width:86px;}' +
    'table.mem td.c-pin b{font-weight:800;color:#33262a;letter-spacing:1px;}' +
    'table.mem td.c-pin .no{color:#c9b8bf;}' +
    '.pin-edit{margin-left:5px;padding:2px 7px;border-radius:7px;border:1px solid #ecc6d3;background:#fff8fa;color:#b3476a;font-size:10.5px;font-weight:800;cursor:pointer;font-family:inherit;}' +
    '.pin-note{margin:8px 0 0;font-size:11.5px;color:#9a8a90;}' +
    '@media (max-width:600px){table.mem th.c-pin,table.mem td.c-pin{width:64px;}.pin-edit{display:block;margin:3px auto 0;}}';
  document.head.appendChild(css);

  var headRow = table.querySelector('thead tr');
  if(headRow && !headRow.querySelector('.c-pin')){
    var th = document.createElement('th'); th.className = 'c-pin'; th.textContent = '암호'; headRow.appendChild(th);
  }
  var wrap = table.closest('.mem-wrap');
  if(wrap && !document.getElementById('pinNote')){
    var note = document.createElement('div'); note.className = 'pin-note'; note.id = 'pinNote';
    note.textContent = '🔒 암호: 원장님이 “내 품앗이”에서 게시물을 처음 남길 때 정한 숫자 4자리예요. 잊으면 [바꾸기]에서 새로 정하거나 비워서 초기화해 주세요.' +
      (P.LIVE ? '' : ' (미리보기: 이 기기에 저장된 것만 보여요)');
    wrap.parentNode.insertBefore(note, wrap.nextSibling);
  }

  var pins = {};
  function paint(){
    [].forEach.call(body.querySelectorAll('tr[data-nick]'), function(tr){
      var nick = tr.getAttribute('data-nick');
      var td = tr.querySelector('td.c-pin');
      if(!td){ td = document.createElement('td'); td.className = 'c-pin'; tr.appendChild(td); }
      var v = pins ? pins[nick] : null;
      if(v && /^\d{1,3}$/.test(String(v))) v = String(v).padStart(4, '0');
      var html = pins === null ? '<span class="no">' + (P.LIVE ? '불러오기 실패' : '연결 전') + '</span>' : (v ? '<b>' + v + '</b>' : '<span class="no">없음</span>');
      td.innerHTML = html + '<button type="button" class="pin-edit" data-nick="">바꾸기</button>';
      td.querySelector('.pin-edit').setAttribute('data-nick', nick);
    });
  }
  function reload(){ return P.staffList().then(function(m){ pins = m; paint(); }); }

  // 칸 안에서 바로 바꾸기 (팝업 창은 카톡 안 브라우저 등에서 막히므로 쓰지 않음)
  body.addEventListener('click', function(e){
    var b = e.target.closest('.pin-edit[data-nick]');
    if(b){
      var td = b.closest('td.c-pin'), nick = b.getAttribute('data-nick');
      td.innerHTML = '<input class="pin-in" type="tel" inputmode="numeric" maxlength="4" placeholder="새 4자리" style="width:64px;height:26px;padding:0 6px;border:1px solid #e6a6bb;border-radius:7px;font-size:12px;text-align:center;font-family:inherit;">' +
        '<button type="button" class="pin-edit pin-ok" style="background:#ff5d8f;color:#fff;border-color:#ff5d8f;">저장</button>' +
        '<button type="button" class="pin-edit pin-clear">비우기</button>' +
        '<button type="button" class="pin-edit pin-cancel">취소</button>' +
        '<div class="pin-err" style="font-size:10.5px;color:#d23b5e;min-height:0;"></div>';
      td.setAttribute('data-nick', nick);
      td.querySelector('.pin-in').focus();
      return;
    }
    var td2 = e.target.closest('td.c-pin[data-nick]'); if(!td2) return;
    var n2 = td2.getAttribute('data-nick');
    if(e.target.closest('.pin-cancel')){ td2.removeAttribute('data-nick'); paint(); return; }
    var v = e.target.closest('.pin-clear') ? '' : (e.target.closest('.pin-ok') ? td2.querySelector('.pin-in').value.trim() : null);
    if(v === null) return;
    if(v === '' && !e.target.closest('.pin-clear')){ td2.querySelector('.pin-err').textContent = '숫자 4자리를 넣어 주세요.'; return; }
    td2.querySelector('.pin-err').textContent = '저장 중…';
    [].forEach.call(td2.querySelectorAll('button'), function(b){ b.disabled = true; });
    P.staffSet(n2, v).then(function(r){
      if(!r.ok){
        [].forEach.call(td2.querySelectorAll('button'), function(b){ b.disabled = false; });
        td2.querySelector('.pin-err').textContent = r.reason === '형식' ? '숫자 4자리만 돼요.' : '저장하지 못했어요. 잠시 뒤 다시 해 주세요.';
        return;
      }
      // 파이어베이스로 옮긴 뒤: 암호 문서(pins)도 같이 바꾸거나 지운다
      if(window.DiaFB && window.DiaFB.setPin) window.DiaFB.setPin(n2, v);
      td2.removeAttribute('data-nick'); reload();
    });
  });
  body.addEventListener('keydown', function(e){
    if(e.key === 'Enter' && e.target.classList && e.target.classList.contains('pin-in')){ e.preventDefault(); var ok = e.target.parentNode.querySelector('.pin-ok'); if(ok) ok.click(); }
  });

  reload();
  // 회원 목록이 다시 그려지면 칸을 다시 붙인다
  new MutationObserver(function(list){
    if(list.some(function(m){ return [].some.call(m.addedNodes, function(n){ return n.nodeType === 1 && n.matches && n.matches('tr[data-nick]'); }); })) paint();
  }).observe(body, { childList: true });
})();
