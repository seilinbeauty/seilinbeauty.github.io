/* 운영 센터: '🎅 산타 설정' 탭 (PC 상단 산타 일:휴식 비율 및 세부 모션 확률 조절) */
(function(){
  var nav = document.querySelector('.ops-nav');
  if (!nav) return;
  var KEY = 'dia_santa_cfg_v1';
  var DEF = {
    workRatio: 70,
    topBroom: 72,
    blower: 60,
    callWork: 25,
    toyW: 42,
    backstageW: 16,
    friendW: 8,
    angelW: 7,
    propW: 8,
    rideW: 9,
    otherW: 10,
    housePct: 0.5
  };
  function loadCfg(){
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return Object.assign({}, DEF);
      return Object.assign({}, DEF, JSON.parse(raw));
    } catch(e){ return Object.assign({}, DEF); }
  }
  function saveCfg(c){
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch(e){}
  }

  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'ops-nav-item'; btn.setAttribute('data-santatab', '1');
  btn.textContent = '🎅 산타 설정';
  nav.appendChild(btn);

  var sec = document.createElement('div');
  sec.id = 'ops-santa'; sec.style.display = 'none';
  sec.innerHTML =
    '<style>' +
    '#ops-santa .sn{max-width:620px;margin:0 auto;padding:20px;border:1px solid #f2e2e8;border-radius:16px;background:#fff;}' +
    '#ops-santa .sn-h{font-size:17px;font-weight:900;color:#c2456a;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;}' +
    '#ops-santa .sn-d{margin-top:5px;font-size:12.5px;color:#8a7e83;line-height:1.55;}' +
    '#ops-santa .sn-presets{margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;}' +
    '#ops-santa .sn-pre{padding:6px 12px;border-radius:999px;border:1px solid #f0c8d5;background:#fff8fa;color:#b3476a;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;}' +
    '#ops-santa .sn-pre:hover{background:#ffe9f0;}' +
    '#ops-santa .sn-box{margin-top:16px;padding:14px 16px;border-radius:12px;background:#fff9fb;border:1px solid #f5dce4;}' +
    '#ops-santa .sn-bt{font-size:13.5px;font-weight:900;color:#4a3c41;margin-bottom:10px;}' +
    '#ops-santa .sn-row{margin-top:10px;}' +
    '#ops-santa .sn-top{display:flex;justify-content:space-between;align-items:center;font-size:12.5px;font-weight:700;color:#4a3c41;margin-bottom:4px;}' +
    '#ops-santa .sn-val{font-weight:900;color:#c2456a;}' +
    '#ops-santa input[type=range]{width:100%;accent-color:#d55576;cursor:pointer;}' +
    '#ops-santa .sn-acts{margin-top:16px;display:flex;gap:8px;justify-content:flex-end;align-items:center;}' +
    '#ops-santa .sn-save{padding:10px 22px;border-radius:10px;border:0;background:linear-gradient(90deg,#ef9ab4,#d55576);color:#fff;font-size:13.5px;font-weight:800;cursor:pointer;font-family:inherit;}' +
    '#ops-santa .sn-reset{padding:10px 14px;border-radius:10px;border:1px solid #e6d7dc;background:#fff;color:#7a6d72;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}' +
    '#ops-santa .sn-msg{font-size:12.5px;font-weight:800;color:#16a34a;margin-right:auto;}' +
    '</style>' +
    '<div class="sn">' +
      '<div class="sn-h"><span>🎅 PC 산타 행동·확률 상세 설정</span></div>' +
      '<div class="sn-d">다이아 커뮤니티 PC 상단 산타의 일(청소)과 휴식·놀이 비율, 세부 모션 등장 확률을 조절하고 저장할 수 있어요.</div>' +
      '<div class="sn-presets">' +
        '<button type="button" class="sn-pre" data-pre="70">기본 (일 7 : 휴식 3)</button>' +
        '<button type="button" class="sn-pre" data-pre="90">워커홀릭 (일 9 : 휴식 1)</button>' +
        '<button type="button" class="sn-pre" data-pre="50">반반 (일 5 : 휴식 5)</button>' +
        '<button type="button" class="sn-pre" data-pre="20">놀자판 (일 2 : 휴식 8)</button>' +
      '</div>' +
      '<div class="sn-box">' +
        '<div class="sn-bt">⚖️ 전체 일 vs 휴식·놀이 비율</div>' +
        '<div class="sn-row"><div class="sn-top"><span>일(청소) 비율</span><span class="sn-val" id="sn_v_workRatio"></span></div><input type="range" id="sn_workRatio" min="0" max="100" step="5"></div>' +
      '</div>' +
      '<div class="sn-box">' +
        '<div class="sn-bt">🧹 청소(일) 세부 비중</div>' +
        '<div class="sn-row"><div class="sn-top"><span>제목 빗자루 탁탁 치기</span><span class="sn-val" id="sn_v_topBroom"></span></div><input type="range" id="sn_topBroom" min="0" max="100" step="5"></div>' +
        '<div class="sn-row"><div class="sn-top"><span>송풍기 사용 (나머지는 제설 삽)</span><span class="sn-val" id="sn_v_blower"></span></div><input type="range" id="sn_blower" min="0" max="100" step="5"></div>' +
        '<div class="sn-row"><div class="sn-top"><span>친구 산타 전화로 일 시키기</span><span class="sn-val" id="sn_v_callWork"></span></div><input type="range" id="sn_callWork" min="0" max="100" step="5"></div>' +
        '<div class="sn-row"><div class="sn-top"><span>백스테이지 문 열고 유지보수</span><span class="sn-val" id="sn_v_backstageW"></span></div><input type="range" id="sn_backstageW" min="0" max="100" step="2"></div>' +
        '<div class="sn-row"><div class="sn-top"><span>페인트 롤러로 글자·시계 칠하기</span><span class="sn-val" id="sn_v_paintW"></span></div><input type="range" id="sn_paintW" min="0" max="100" step="2"></div>' +
      '</div>' +
      '<div class="sn-box">' +
        '<div class="sn-bt">🎮 놀이·자유의지 세부 가중치</div>' +
        '<div class="sn-row"><div class="sn-top"><span>주머니 아이템 10종 (드론·초코·보드 등)</span><span class="sn-val" id="sn_v_toyW"></span></div><input type="range" id="sn_toyW" min="0" max="100" step="2"></div>' +
        '<div class="sn-row"><div class="sn-top"><span>친구 산타 부르기 (놀기·눈싸움)</span><span class="sn-val" id="sn_v_friendW"></span></div><input type="range" id="sn_friendW" min="0" max="100" step="2"></div>' +
        '<div class="sn-row"><div class="sn-top"><span>스노우 엔젤 (눈 천사)</span><span class="sn-val" id="sn_v_angelW"></span></div><input type="range" id="sn_angelW" min="0" max="100" step="2"></div>' +
        '<div class="sn-row"><div class="sn-top"><span>눈사람 · 가로등 설치</span><span class="sn-val" id="sn_v_propW"></span></div><input type="range" id="sn_propW" min="0" max="100" step="2"></div>' +
        '<div class="sn-row"><div class="sn-top"><span>오픈카 · 루돌프 쓰다듬기 · 눈덩이</span><span class="sn-val" id="sn_v_rideW"></span></div><input type="range" id="sn_rideW" min="0" max="100" step="2"></div>' +
        '<div class="sn-row"><div class="sn-top"><span>산타집 꺼내 들어가기 (%)</span><span class="sn-val" id="sn_v_housePct"></span></div><input type="range" id="sn_housePct" min="0" max="10" step="0.5"></div>' +
      '</div>' +
      '<div class="sn-acts">' +
        '<span class="sn-msg" id="sn_msg"></span>' +
        '<button type="button" class="sn-reset" id="sn_reset">기본값 복원</button>' +
        '<button type="button" class="sn-save" id="sn_save">설정 저장</button>' +
      '</div>' +
    '</div>';

  var host = document.querySelector('#ops-stats') && document.querySelector('#ops-stats').parentElement;
  if (!host) return;
  host.appendChild(sec);

  var keys = ['workRatio', 'topBroom', 'blower', 'callWork', 'backstageW', 'paintW', 'toyW', 'friendW', 'angelW', 'propW', 'rideW', 'housePct'];
  function render(c){
    var playKeys = ['toyW', 'friendW', 'angelW', 'propW', 'rideW'];
    /* 놀이 안에서만 합이 100%가 되게 */
    var playSum = playKeys.reduce(function(acc, pk){ return acc + (Number(c[pk]) || 0); }, 0);
    if (playSum <= 0) playSum = 1;
    var cleanKeys = ['topBroom', 'blower', 'callWork', 'backstageW', 'paintW'];
    var cleanSum = cleanKeys.reduce(function(acc, ck){ return acc + (Number(c[ck]) || 0); }, 0);
    if (cleanSum <= 0) cleanSum = 1;
    keys.forEach(function(k){
      var el = document.getElementById('sn_' + k);
      var vl = document.getElementById('sn_v_' + k);
      if (!el || !vl) return;
      el.value = c[k];
      if (k === 'workRatio') vl.textContent = '일 ' + c[k] + '% : 휴식 ' + (100 - c[k]) + '%';
      else if (k === 'blower') vl.textContent = '청소 중 ' + (Math.round(((Number(c[k]) || 0) / cleanSum) * 1000) / 10) + '% (송풍기 ' + c[k] + ' / 삽 ' + (100 - c[k]) + ')' ;
      else if (k === 'housePct') vl.textContent = c[k] + '%';
      else if (k === 'paintW' || k === 'backstageW') vl.textContent = (Math.round(((Number(c[k]) || 0) / cleanSum) * 1000) / 10) + '%';
      else if (k === 'topBroom' || k === 'callWork') vl.textContent = (Math.round(((Number(c[k]) || 0) / cleanSum) * 1000) / 10) + '%';
      else {
        var pct = Math.round(((Number(c[k]) || 0) / playSum) * 1000) / 10;
        vl.textContent = pct + '%';
      }
    });
  }

  var cur = loadCfg();
  render(cur);

  keys.forEach(function(k){
    var el = document.getElementById('sn_' + k);
    if (!el) return;
    el.addEventListener('input', function(){
      cur[k] = parseFloat(el.value);
      render(cur);
    });
  });

  sec.querySelectorAll('.sn-pre').forEach(function(b){
    b.addEventListener('click', function(){
      cur.workRatio = parseInt(b.getAttribute('data-pre'), 10);
      render(cur);
    });
  });

  document.getElementById('sn_reset').addEventListener('click', function(){
    cur = Object.assign({}, DEF);
    render(cur);
    saveCfg(cur);
    document.getElementById('sn_msg').textContent = '기본값(7:3)으로 복원·저장되었어요!';
  });

  document.getElementById('sn_save').addEventListener('click', function(){
    saveCfg(cur);
    document.getElementById('sn_msg').textContent = '저장 완료! 다이아 커뮤니티 새로고침 시 바로 적용됩니다.';
  });

  /* ── 다이아 섹션 편집기 (PC·태블릿·모바일 분리 미리보기 + 드래그·크기·글씨·색깔) ── */
  var WKEY = 'dia_world_layout_v1';
  var wrap = document.createElement('div');
  wrap.className = 'sn';
  wrap.style.marginTop = '0';
  wrap.innerHTML = '<div class="sn-h"><span>🖼 다이아 섹션</span></div>' +
    '<div class="sn-d">PC·태블릿·모바일 실제 화면을 각각 띄웁니다. 요소를 끌어 옮기고, 아래 막대에서 크기·글씨 크기·색깔을 바로 바꾸세요.</div>' +
    '<div style="margin-top:10px;display:flex;gap:6px;align-items:center;flex-wrap:wrap;">' +
      '<button type="button" class="sn-save" id="w_pc">PC</button>' +
      '<button type="button" class="sn-save" id="w_tb" style="background:#fff;color:#c2456a;border:1px solid #e6b8c8;">태블릿</button>' +
      '<button type="button" class="sn-save" id="w_mo" style="background:#fff;color:#c2456a;border:1px solid #e6b8c8;">모바일</button>' +
      '<button type="button" class="sn-save" id="w_grid" style="margin-left:auto;background:#fff;color:#4a3f44;border:1px solid #d9cfd4;">📐 그리드</button><button type="button" class="sn-save" id="w_full" style="background:#fff;color:#4a3f44;border:1px solid #d9cfd4;">⛶ 크게 보기</button><button type="button" class="sn-save" id="w_save">💾 저장하기</button><button type="button" class="sn-reset" id="w_reset">이 기기 원래대로</button>' +
    '</div>' +
    '<div id="w_props" style="margin-top:10px;padding:10px 12px;border:1px solid #f0dde4;border-radius:10px;background:#fff9fb;display:none;flex-wrap:wrap;gap:10px 14px;align-items:center;font-size:12px;color:#4a3f44;">' +
      '<strong id="wp_name" style="color:#b62d47;min-width:110px;">선택됨</strong>' +
      '<label style="display:inline-flex;align-items:center;gap:5px;">크기 <input id="wp_scale" type="range" min="50" max="200" value="100" style="width:78px;accent-color:#d55576;"> <span id="wp_scale_v" style="min-width:34px;font-weight:800;">100%</span></label>' +
      '<label style="display:inline-flex;align-items:center;gap:5px;">글씨 <input id="wp_fs" type="range" min="9" max="44" value="14" style="width:78px;accent-color:#d55576;"> <span id="wp_fs_v" style="min-width:34px;font-weight:800;">기본</span></label>' +
      '<label style="display:inline-flex;align-items:center;gap:4px;">글자색 <input id="wp_color" type="color" value="#212529" style="width:28px;height:24px;border:1px solid #e6d7dc;border-radius:5px;padding:0;background:#fff;cursor:pointer;"></label>' +
      '<label style="display:inline-flex;align-items:center;gap:4px;">배경색 <input id="wp_bg" type="color" value="#ffffff" style="width:28px;height:24px;border:1px solid #e6d7dc;border-radius:5px;padding:0;background:#fff;cursor:pointer;"></label>' +
      '<button type="button" class="sn-reset" id="wp_one_reset" style="margin-left:auto;padding:5px 10px;font-size:11px;">이 요소 초기화</button>' +
    '</div>' +
    '<div style="margin-top:8px;font-size:11.5px;color:#8a7b81;font-weight:800;" id="w_msg">편집할 요소를 화면에서 눌러 선택하거나 끌어 옮기세요.</div>' +
    '<div id="w_stage" style="margin-top:8px;border:1px solid #eee3e8;border-radius:12px;overflow:hidden;background:#faf6f8;display:flex;justify-content:center;align-items:flex-start;position:relative;min-height:460px;">' +
      '<iframe id="w_frame" src="dia.html?edit=1&dev=pc" style="display:block;flex:0 0 auto;width:1200px;height:680px;border:0;background:#fff;transform-origin:top center;"></iframe>' +
    '</div>';

  var btn2 = nav.querySelector('.ops-nav-item[data-bannertab]');
  if (!btn2) return;
  var sec2 = document.createElement('div');
  sec2.id = 'ops-diaworld'; sec2.style.display = 'none';
  var style2 = document.createElement('style');
  style2.textContent = sec.querySelector('style').textContent.split('#ops-santa').join('#ops-diaworld');
  sec2.appendChild(style2);
  sec2.appendChild(wrap);
  host.appendChild(sec2);

  var stage = document.getElementById('w_stage');
  var frame = document.getElementById('w_frame');
  var msgEl = document.getElementById('w_msg');
  var propsEl = document.getElementById('w_props');
  var wpName = document.getElementById('wp_name');
  var wpScale = document.getElementById('wp_scale');
  var wpScaleV = document.getElementById('wp_scale_v');
  var wpFs = document.getElementById('wp_fs');
  var wpFsV = document.getElementById('wp_fs_v');
  var wpColor = document.getElementById('wp_color');
  var wpBg = document.getElementById('wp_bg');
  var wpOneReset = document.getElementById('wp_one_reset');

  var DEV = { pc: [920, 'PC'], tb: [890, '태블릿'], mo: [390, '모바일'] };
  var curDev = 'pc';
  var selKey = '';
  var selKeys = [];

  function fitFrame(){
    var targetW = DEV[curDev][0];
    var avail = stage.clientWidth || 1000;
    var ratio = avail < targetW ? (avail / targetW) : 1;
    frame.style.width = targetW + 'px';
    frame.style.height = '680px';
    if (ratio < 1) {
      frame.style.transform = 'scale(' + ratio.toFixed(4) + ')';
      frame.style.transformOrigin = 'top left';
      frame.style.marginLeft = '0';
      stage.style.justifyContent = 'flex-start';
      stage.style.height = Math.round(680 * ratio) + 'px';
    } else {
      frame.style.transform = '';
      frame.style.transformOrigin = 'top center';
      stage.style.justifyContent = 'center';
      stage.style.height = '680px';
    }
  }
  window.addEventListener('resize', fitFrame);

  function setDev(k){
    curDev = k;
    selKey = '';
    propsEl.style.display = 'none';
    msgEl.textContent = DEV[k][1] + ' 화면입니다. 요소를 눌러 선택하거나 끌어 옮기세요.';
    ['pc','tb','mo'].forEach(function(x){
      var b = document.getElementById('w_' + x);
      if (!b) return;
      var on = (x === k);
      b.style.background = on ? 'linear-gradient(90deg,#ef9ab4,#d55576)' : '#fff';
      b.style.color = on ? '#fff' : '#c2456a';
    });
    fitFrame();
    frame.src = 'dia.html?edit=1&dev=' + k + '&r=' + Date.now();
  }
  ['pc','tb','mo'].forEach(function(k){
    var b = document.getElementById('w_' + k);
    if (b) b.addEventListener('click', function(){ setDev(k); });
  });

  window.addEventListener('message', function(e){
    var d = e.data || {};
    if (d.type !== 'dia-edit-select' || !d.key) return;
    selKey = d.key;
    selKeys = d.keys || [d.key];
    propsEl.style.display = 'flex';
    wpName.textContent = d.label + ' (' + d.data.x + ', ' + d.data.y + ')';
    var sc = Number(d.data.scale) || 100;
    wpScale.value = sc; wpScaleV.textContent = sc + '%';
    var fs = Number(d.data.fs) || 0;
    wpFs.value = fs > 0 ? fs : (d.computed && d.computed.fs ? d.computed.fs : 14);
    wpFsV.textContent = fs > 0 ? (fs + 'px') : '기본';
    wpColor.value = d.data.color || (d.computed && d.computed.color) || '#212529';
    wpBg.value = d.data.bg || (d.computed && d.computed.bg) || '#ffffff';
  });

  function sendPatch(patch){
    if (!selKey || !frame.contentWindow) return;
    frame.contentWindow.postMessage({ type: 'dia-edit-update', key: selKey, keys: selKeys, data: patch }, '*');
  }
  wpScale.addEventListener('input', function(){
    var v = parseInt(wpScale.value, 10) || 100;
    wpScaleV.textContent = v + '%';
    sendPatch({ scale: v });
  });
  wpFs.addEventListener('input', function(){
    var v = parseInt(wpFs.value, 10) || 14;
    wpFsV.textContent = v + 'px';
    sendPatch({ fs: v });
  });
  wpColor.addEventListener('input', function(){ sendPatch({ color: wpColor.value }); });
  wpBg.addEventListener('input', function(){ sendPatch({ bg: wpBg.value }); });
  wpOneReset.addEventListener('click', function(){
    if (!selKey || !frame.contentWindow) return;
    frame.contentWindow.postMessage({ type: 'dia-edit-reset-one', key: selKey, keys: selKeys }, '*');
  });

  document.getElementById('w_reset').addEventListener('click', function(){
    if (frame.contentWindow) frame.contentWindow.postMessage({ type: 'dia-edit-reset-all' }, '*');
    msgEl.textContent = DEV[curDev][1] + ' 화면을 원래대로 되돌렸습니다.';
  });

  // 다른 탭과 상호 전환 연결
  nav.addEventListener('click', function(e){
    var t = e.target.closest('.ops-nav-item');
    if (!t) return;
    var mine = (t === btn) ? sec : (t === btn2 ? sec2 : null);
    nav.querySelectorAll('.ops-nav-item').forEach(function(x){ x.setAttribute('data-on', x === t ? '1' : '0'); });
    if (mine) {
      Array.from(host.children).forEach(function(ch){
        if (ch.id === 'ops-santa' || ch.id === 'ops-diaworld') ch.style.display = (ch === mine ? '' : 'none');
        else if (ch.id && ch.id.indexOf('ops-') === 0) ch.style.display = 'none';
      });
      if (t === btn2) setTimeout(fitFrame, 40);
    } else {
      sec.style.display = 'none';
      sec2.style.display = 'none';
      btn.setAttribute('data-on', '0');
      btn2.setAttribute('data-on', '0');
    }
  });
  var isFull = false;
  var fullBtn = document.getElementById('w_full');
  function applyFull(){
    if (isFull) {
      wrap.style.position = 'fixed';
      wrap.style.inset = '12px';
      wrap.style.zIndex = '9999';
      wrap.style.margin = '0';
      wrap.style.overflow = 'auto';
      wrap.style.boxShadow = '0 20px 60px rgba(0,0,0,.28)';
      fullBtn.textContent = '✕ 축소하기';
    } else {
      wrap.style.position = '';
      wrap.style.inset = '';
      wrap.style.zIndex = '';
      wrap.style.margin = '';
      wrap.style.overflow = '';
      wrap.style.boxShadow = '';
      fullBtn.textContent = '⛶ 크게 보기';
    }
    setTimeout(fitFrame, 20);
  }
  if (fullBtn) fullBtn.addEventListener('click', function(){ isFull = !isFull; applyFull(); });
  var gridOn = false;
  var gridBtn = document.getElementById('w_grid');
  if (gridBtn) gridBtn.addEventListener('click', function(){
    gridOn = !gridOn;
    gridBtn.style.background = gridOn ? '#2563eb' : '#fff';
    gridBtn.style.color = gridOn ? '#fff' : '#4a3f44';
    if (frame.contentWindow) frame.contentWindow.postMessage({ type: 'dia-edit-grid', on: gridOn }, '*');
  });
  var saveBtn = document.getElementById('w_save');
  if (saveBtn) saveBtn.addEventListener('click', function(){
    if (frame.contentWindow) frame.contentWindow.postMessage({ type: 'dia-edit-save' }, '*');
  });
  window.addEventListener('message', function(e){
    var d = e.data || {};
    if (d.type === 'dia-edit-saved') {
      msgEl.textContent = DEV[curDev][1] + ' 저장 완료! 실제 다이아 커뮤니티에 반영되었습니다.';
    }
  });
  frame.addEventListener('load', function(){
    if (gridOn && frame.contentWindow) frame.contentWindow.postMessage({ type: 'dia-edit-grid', on: true }, '*');
  });
  setDev('pc');
})();
