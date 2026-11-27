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

  /* ── 다이아 월드 배치 편집기 (요소별 X·Y 미세 조정) ── */
  var WKEY = 'dia_world_layout_v1';
  var WITEMS = [
    ['title', '다이아 커뮤니티 제목'],
    ['clock', '날짜·시계'],
    ['login', '내 품앗이 버튼'],
    ['course', '뷰티수강 버튼'],
    ['search', '검색창'],
    ['banner', '상단 소개 배너']
  ];
  function loadW(){
    try { return JSON.parse(localStorage.getItem(WKEY)) || {}; } catch(e){ return {}; }
  }
  var wcur = loadW();
  var wrap = document.createElement('div');
  wrap.className = 'sn'; wrap.style.marginTop = '0';
  var html = '<div class="sn-h"><span>🖼 다이아 월드</span></div>' +
    '<div class="sn-d">상단(다이아 월드) 요소를 좌우·상하로 조금씩 옮겨 자리를 맞출 수 있어요. 저장하면 다이아 커뮤니티 화면에 그대로 적용됩니다.</div>';
  WITEMS.forEach(function(it){
    var k = it[0], label = it[1];
    var v = wcur[k] || { x: 0, y: 0 };
    html += '<div class="sn-box">' +
      '<div class="sn-bt">' + label + '</div>' +
      '<div class="sn-row"><div class="sn-top"><span>좌우</span><span class="sn-val" id="wv_x_' + k + '">' + (v.x || 0) + 'px</span></div>' +
      '<input type="range" id="w_x_' + k + '" min="-200" max="200" step="1" value="' + (v.x || 0) + '"></div>' +
      '<div class="sn-row"><div class="sn-top"><span>상하</span><span class="sn-val" id="wv_y_' + k + '">' + (v.y || 0) + 'px</span></div>' +
      '<input type="range" id="w_y_' + k + '" min="-140" max="140" step="1" value="' + (v.y || 0) + '"></div>' +
      '</div>';
  });
  html += '<div class="sn-acts"><span class="sn-msg" id="w_msg"></span>' +
    '<button type="button" class="sn-reset" id="w_reset">전체 0으로</button>' +
    '<button type="button" class="sn-save" id="w_save">배치 저장</button></div>';
  wrap.innerHTML = html;

  var btn2 = document.createElement('button');
  btn2.type = 'button'; btn2.className = 'ops-nav-item'; btn2.setAttribute('data-bannertab', '1');
  btn2.textContent = '🖼 다이아 월드';
  nav.appendChild(btn2);
  var sec2 = document.createElement('div');
  sec2.id = 'ops-banner'; sec2.style.display = 'none';
  var style2 = document.createElement('style');
  style2.textContent = sec.querySelector('style').textContent;
  sec2.appendChild(style2);
  sec2.appendChild(wrap);
  host.appendChild(sec2);

  WITEMS.forEach(function(it){
    var k = it[0];
    ['x', 'y'].forEach(function(ax){
      var el = document.getElementById('w_' + ax + '_' + k);
      if (!el) return;
      el.addEventListener('input', function(){
        if (!wcur[k]) wcur[k] = { x: 0, y: 0 };
        wcur[k][ax] = parseInt(el.value, 10) || 0;
        var vl = document.getElementById('wv_' + ax + '_' + k);
        if (vl) vl.textContent = wcur[k][ax] + 'px';
      });
    });
  });
  document.getElementById('w_save').addEventListener('click', function(){
    try { localStorage.setItem(WKEY, JSON.stringify(wcur)); } catch(e){}
    document.getElementById('w_msg').textContent = '저장 완료! 다이아 커뮤니티 새로고침 시 적용됩니다.';
  });
  document.getElementById('w_reset').addEventListener('click', function(){
    wcur = {};
    WITEMS.forEach(function(it){
      var k = it[0];
      ['x', 'y'].forEach(function(ax){
        var el = document.getElementById('w_' + ax + '_' + k);
        if (el) el.value = 0;
        var vl = document.getElementById('wv_' + ax + '_' + k);
        if (vl) vl.textContent = '0px';
      });
    });
    try { localStorage.setItem(WKEY, '{}'); } catch(e){}
    document.getElementById('w_msg').textContent = '전체 0으로 되돌렸어요. 화면을 새로고침해 주세요.';
  });

  // 다른 탭과 상호 전환 연결
  nav.addEventListener('click', function(e){
    var t = e.target.closest('.ops-nav-item');
    if (!t) return;
    var mine = (t === btn) ? sec : (t === btn2 ? sec2 : null);
    nav.querySelectorAll('.ops-nav-item').forEach(function(x){ x.setAttribute('data-on', x === t ? '1' : '0'); });
    if (mine) {
      Array.from(host.children).forEach(function(ch){
        if (ch.id === 'ops-santa' || ch.id === 'ops-banner') ch.style.display = (ch === mine ? '' : 'none');
        else if (ch.id && ch.id.indexOf('ops-') === 0) ch.style.display = 'none';
      });
    } else {
      sec.style.display = 'none';
      sec2.style.display = 'none';
      btn.setAttribute('data-on', '0');
      btn2.setAttribute('data-on', '0');
    }
  });
})();
