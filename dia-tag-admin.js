/* 운영 센터: '#️⃣ 해시태그' 탭 (품앗이 해시태그 모양 바꾸기)
   - 기존 탭 코드는 건드리지 않고, 이 파일이 탭 버튼과 칸을 스스로 붙입니다.
   - dia-tag.js 가 먼저 불려 있어야 합니다. */
(function(){
  if(!window.DiaTag) return;
  var nav = document.querySelector('.ops-nav');
  var games = document.getElementById('ops-games');
  if(!nav || !games) return;
  var T = window.DiaTag;

  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'ops-nav-item'; btn.setAttribute('data-tagtab', '1');
  btn.textContent = '#️⃣ 해시태그';
  nav.appendChild(btn);

  var sec = document.createElement('div');
  sec.id = 'ops-tag'; sec.style.display = 'none';
  sec.innerHTML =
    '<style>' +
    '#ops-tag .tg{max-width:560px;margin:0 auto;padding:18px;border:1px solid #f2e2e8;border-radius:14px;background:#fff;}' +
    '#ops-tag .tg-h{font-size:16px;font-weight:900;color:#c2456a;}' +
    '#ops-tag .tg-d{margin-top:4px;font-size:12.5px;color:#8a7e83;line-height:1.6;}' +
    '#ops-tag .tg-now{margin-top:14px;padding:14px;border-radius:12px;background:#fff4f7;border:1.5px solid #ffd9e3;text-align:center;}' +
    '#ops-tag .tg-now small{display:block;font-size:12px;font-weight:800;color:#c2476a;}' +
    '#ops-tag .tg-now b{display:block;margin-top:4px;font-size:21px;font-weight:900;color:#33262a;overflow-wrap:anywhere;}' +
    '#ops-tag .tg-l{display:block;margin-top:16px;font-size:13px;font-weight:800;color:#4a3c41;}' +
    '#ops-tag .tg-in{margin-top:6px;width:100%;box-sizing:border-box;height:42px;padding:0 12px;border:1.5px solid #ecdfe4;border-radius:10px;font-size:15px;font-family:inherit;color:#33262a;outline:none;}' +
    '#ops-tag .tg-in:focus{border-color:#e6a6bb;}' +
    '#ops-tag .tg-chips{margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;align-items:center;font-size:12px;color:#8a7e83;}' +
    '#ops-tag .tg-chip{padding:5px 10px;border-radius:999px;border:1px solid #f0c8d5;background:#fff8fa;color:#b3476a;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;}' +
    '#ops-tag .tg-pv{margin-top:12px;font-size:13px;color:#5a4a50;line-height:1.8;}' +
    '#ops-tag .tg-pv b{color:#33262a;}' +
    '#ops-tag .tg-warn{margin-top:8px;font-size:12.5px;font-weight:700;color:#d23b5e;min-height:1em;}' +
    '#ops-tag .tg-btns{margin-top:14px;display:flex;gap:8px;}' +
    '#ops-tag .tg-save{flex:1;height:42px;border:0;border-radius:10px;background:#ff5d8f;color:#fff;font-size:15px;font-weight:900;cursor:pointer;font-family:inherit;}' +
    '#ops-tag .tg-reset{height:42px;padding:0 14px;border:1px solid #ecdfe4;border-radius:10px;background:#fff;color:#7a6a70;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;}' +
    '#ops-tag .tg-msg{margin-top:10px;font-size:13px;font-weight:700;color:#24734a;text-align:center;min-height:1em;}' +
    '#ops-tag .tg-msg.err{color:#d23b5e;}' +
    '#ops-tag .tg-save[disabled],#ops-tag .tg-reset[disabled]{opacity:.55;cursor:default;}' +
    '</style>' +
    '<div class="tg">' +
      '<div class="tg-h">#️⃣ 품앗이 해시태그</div>' +
      '<div class="tg-d">원장님들 “내 품앗이”와 오늘 참여 링크에 나오는 해시태그예요. [날짜]·[연도] 자리는 매일 자동으로 채워져요.</div>' +
      '<div class="tg-now"><small>지금 원장님들께 보이는 오늘 해시태그</small><b id="tgNow"></b></div>' +
      '<label class="tg-l" for="tgIn">해시태그 모양</label>' +
      '<input class="tg-in" id="tgIn" maxlength="60" autocomplete="off">' +
      '<div class="tg-chips">넣기: <button type="button" class="tg-chip" data-ins="[날짜]">[날짜] 1122</button><button type="button" class="tg-chip" data-ins="[연도]">[연도] 2026</button></div>' +
      '<div class="tg-pv">오늘 <b id="tgPv1"></b><br>내일 <b id="tgPv2"></b><br>새해 첫날 <b id="tgPv3"></b></div>' +
      '<div class="tg-warn" id="tgWarn"></div>' +
      '<div class="tg-btns"><button type="button" class="tg-save" id="tgSave">저장</button><button type="button" class="tg-reset" id="tgReset">처음 모양으로</button></div>' +
      '<div class="tg-msg" id="tgMsg"></div>' +
    '</div>';
  games.parentNode.insertBefore(sec, games.nextSibling);

  var $ = function(id){ return document.getElementById(id); };
  function nextNewYear(){ var k = new Date(Date.now() + 9 * 3600 * 1000); return new Date(Date.UTC(k.getUTCFullYear() + 1, 0, 1, 3)); }
  function preview(){
    var raw = $('tgIn').value;
    $('tgWarn').textContent = /\s/.test(raw) ? '해시태그에는 띄어쓰기를 쓸 수 없어서 저장할 때 빼고 저장해요.' : (raw.indexOf('[날짜]') < 0 ? '[날짜]가 없으면 매일 같은 해시태그가 돼요.' : '');
    $('tgPv1').textContent = T.render(raw);
    $('tgPv2').textContent = T.render(raw, new Date(Date.now() + 86400000));
    $('tgPv3').textContent = T.render(raw, nextNewYear());
  }
  function say(t, isErr){ $('tgMsg').textContent = t || ''; $('tgMsg').className = 'tg-msg' + (isErr ? ' err' : ''); }
  function fill(){ $('tgIn').value = T.get(); $('tgNow').textContent = T.today(); preview(); }
  function load(){
    say('');
    fill();
    return T.load().then(function(){ fill(); });
  }
  $('tgIn').addEventListener('input', function(){ $('tgMsg').textContent = ''; preview(); });
  sec.addEventListener('click', function(e){
    var c = e.target.closest('.tg-chip'); if(!c) return;
    var inp = $('tgIn'), s = inp.selectionStart == null ? inp.value.length : inp.selectionStart, ins = c.getAttribute('data-ins');
    inp.value = inp.value.slice(0, s) + ins + inp.value.slice(inp.selectionEnd == null ? s : inp.selectionEnd);
    inp.focus(); inp.setSelectionRange(s + ins.length, s + ins.length); preview();
  });
  $('tgSave').addEventListener('click', function(){
    var btn = this; if(btn.disabled) return;
    btn.disabled = true; say('저장 중…');
    T.save($('tgIn').value).then(function(r){
      btn.disabled = false;
      if(!r.ok){ say(r.error === '연결' ? '서버에 저장하지 못했어요. 잠시 뒤 다시 눌러 주세요.' : '저장하지 못했어요. (' + r.error + ')', true); return; }
      $('tgIn').value = T.get(); $('tgNow').textContent = T.today(); preview();
      say('저장했어요. 오늘 해시태그: ' + T.today());
    });
  });
  $('tgReset').addEventListener('click', function(){
    var btn = this; if(btn.disabled) return;
    if(!confirm('처음 모양(' + T.DEFAULT + ')으로 되돌릴까요?')) return;
    btn.disabled = true; say('되돌리는 중…');
    T.resetServer().then(function(r){
      btn.disabled = false;
      if(!r.ok){ say(r.error === '연결' ? '서버에 저장하지 못했어요. 잠시 뒤 다시 눌러 주세요.' : '되돌리지 못했어요. (' + r.error + ')', true); return; }
      fill(); say('처음 모양으로 되돌렸어요.');
    });
  });

  // 탭 전환: 기존 탭 코드는 그대로 두고, 이 탭만 따로 켜고 끈다
  var others = ['ops-stats', 'ops-members', 'ops-course', 'ops-games'];
  btn.addEventListener('click', function(){
    [].forEach.call(nav.querySelectorAll('.ops-nav-item'), function(b){ b.setAttribute('data-on', b === btn ? '1' : '0'); });
    others.forEach(function(id){ var el = document.getElementById(id); if(el) el.style.display = 'none'; });
    sec.style.display = ''; load();
  });
  [].forEach.call(nav.querySelectorAll('.ops-nav-item[data-nav]'), function(b){
    b.addEventListener('click', function(){ sec.style.display = 'none'; btn.setAttribute('data-on', '0'); });
  });
})();
