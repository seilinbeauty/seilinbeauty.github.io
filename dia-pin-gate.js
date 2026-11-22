/* “내 품앗이” 로그인 암호 창
   - 검색 목록에서 내 닉네임을 누르면 바로 들어가지 않고 4자리 암호를 먼저 묻습니다.
   - 처음이면 넣은 숫자가 그대로 내 암호가 됩니다. 맞으면 원래 로그인 동작을 그대로 이어서 실행합니다.
   - 기존 로그인 코드(dia.html)는 고치지 않습니다. dia-pin.js 가 먼저 불려 있어야 합니다. */
(function(){
  var P = window.DiaPin;
  var pick = document.getElementById('mcLoginPick');
  var msg = document.getElementById('mcLoginMsg');
  if(!P || !pick) return;
  var pass = false;

  var css = document.createElement('style');
  css.textContent =
    '.pg{padding:10px;border-radius:10px;background:#fff;border:1px solid #f0d7e0;text-align:center;}' +
    '.pg-who{font-size:12.5px;font-weight:800;color:#4a353c;word-break:break-all;}' +
    '.pg-f{margin-top:8px;display:flex;gap:6px;justify-content:center;}' +
    '.pg-f input{width:130px;height:36px;border:1px solid #ecdce2;border-radius:9px;text-align:center;font-size:18px;letter-spacing:6px;font-family:inherit;-webkit-text-security:disc;outline:none;}' +
    '.pg-f input:focus{border-color:#e6a6bb;}' +
    '.pg-f button{height:36px;padding:0 14px;border:0;border-radius:9px;background:#e1789a;color:#fff;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;}' +
    '.pg-h{margin-top:6px;font-size:11px;color:#9a8a90;line-height:1.5;}' +
    '.pg-e{margin-top:4px;font-size:11.5px;font-weight:800;color:#d55576;min-height:0;}' +
    '.pg-back{margin-top:6px;border:0;background:none;color:#b9a9af;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;}';
  document.head.appendChild(css);

  function nickOf(btn){ return String(btn.textContent || '').replace(/\s*\(@[^)]*\)\s*$/, '').trim(); }

  // 닉네임 버튼 클릭을 먼저 가로채 암호를 묻는다
  pick.addEventListener('click', function(e){
    if(pass) return;
    var btn = e.target.closest('button');
    if(!btn || !pick.contains(btn) || btn.closest('.pg')) return;
    e.stopPropagation(); e.preventDefault();
    var nick = nickOf(btn);
    var saved = P.remembered(nick);
    var box = document.createElement('div');
    box.className = 'pg';
    box.innerHTML =
      '<div class="pg-who">' + nick.replace(/[&<>"']/g, '') + '</div>' +
      '<form class="pg-f" autocomplete="off"><input type="tel" inputmode="numeric" maxlength="4" placeholder="····"><button type="submit">들어가기</button></form>' +
      '<div class="pg-h">내 암호 숫자 4자리를 넣어 주세요.<br>처음이면 원하는 숫자 4자리가 그대로 내 암호가 돼요.</div>' +
      '<div class="pg-e"></div>' +
      '<button type="button" class="pg-back">다른 이름 고르기</button>';
    pick.innerHTML = ''; pick.appendChild(box);
    var inp = box.querySelector('input'), err = box.querySelector('.pg-e');
    if(saved) inp.value = saved;
    inp.focus();
    box.querySelector('.pg-back').addEventListener('click', function(){
      pick.innerHTML = '';
      var q = document.getElementById('mcLoginIn');
      if(q){ q.dispatchEvent(new Event('input', { bubbles: true })); q.focus(); }
    });
    box.querySelector('form').addEventListener('submit', function(ev){
      ev.preventDefault();
      var pin = inp.value.trim();
      if(!P.okPin(pin)){ err.textContent = '숫자 4자리를 넣어 주세요.'; return; }
      err.textContent = '확인 중…';
      P.check(nick, pin).then(function(r){
        if(!r.ok){
          err.textContent = r.reason === '틀림' ? '암호가 맞지 않아요. 잊으셨으면 스태프에게 말해 주세요.' : '연결이 잠깐 안 돼요. 다시 눌러 주세요.';
          inp.value = ''; inp.focus(); P.forget(nick); return;
        }
        P.remember(nick, pin);
        if(msg && r.first){ msg.textContent = '🔒 이 숫자가 내 암호로 정해졌어요.'; }
        // 원래 로그인 버튼 동작을 그대로 실행
        pick.innerHTML = ''; pick.appendChild(btn);
        pass = true; try{ btn.click(); } finally { pass = false; }
      });
    });
  }, true);
})();
