/* 운영 센터 '뷰티수강 클릭 통계'
   - 창고의 원장님별 클릭 수를 읽어 많이 눌린 순으로 보여 줍니다. 읽기만 하고 저장하지 않습니다. */
(function(){
  var EXEC = 'https://script.google.com/macros/s/AKfycbxLu7nD0RH1FkCKdmgQkP7AybLKit34KN9ISnuW_pHwYrLW7EaqsWddNWBSGWfJ0S-V5A/exec';
  var TARGETS = [['instagram', '인스타'], ['naver', '네이버'], ['homepage', '홈페이지'], ['photo', '작품 사진']];
  var tabs = document.querySelector('.ops-tabs');
  if(!tabs || !tabs.parentNode) return;

  var css = document.createElement('style');
  css.textContent = [
    '.cc-box{background:#fff;border:1px solid #f0e2e7;border-radius:14px;padding:15px 16px 13px;margin-bottom:16px;width:100%;box-sizing:border-box;}',
    '.cc-box *{box-sizing:border-box;}',
    '.cc-hd{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin-bottom:11px;}',
    '.cc-t{font-size:13px;font-weight:800;color:#8a7b81;}',
    '.cc-s{font-size:11px;color:#c3adb6;}',
    '.cc-re{margin-left:auto;border:0;background:none;color:#c2456a;font-size:11.5px;font-weight:800;cursor:pointer;font-family:inherit;padding:2px 0;}',
    '.cc-sum{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin-bottom:10px;}',
    '.cc-k{border-radius:10px;background:#fff8fa;border:1px solid #f6e4ea;padding:8px 3px;text-align:center;min-width:0;}',
    '.cc-k b{display:block;font-size:17px;font-weight:800;color:#332b2f;line-height:1.1;font-variant-numeric:tabular-nums;}',
    '.cc-k span{display:block;margin-top:3px;font-size:10.5px;color:#9a8b91;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.cc-row{display:grid;grid-template-columns:22px minmax(0,1.3fr) minmax(0,1.5fr) minmax(0,1.9fr);gap:8px;align-items:center;padding:9px 2px;border-top:1px solid #f9f1f4;}',
    '.cc-no{font-size:12px;font-weight:900;color:#c9b3bb;text-align:center;}',
    '.cc-name{font-size:13px;font-weight:800;color:#3c2b31;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    '.cc-nums,.cc-tg{display:flex;gap:9px;flex-wrap:wrap;font-size:11.5px;color:#8a7b81;}',
    '.cc-nums b{color:#c2456a;font-weight:800;margin-left:2px;font-variant-numeric:tabular-nums;}',
    '.cc-tg span{white-space:nowrap;}',
    '.cc-tg b{color:#4a3941;font-weight:800;margin-left:2px;font-variant-numeric:tabular-nums;}',
    '.cc-empty{padding:16px 0 8px;text-align:center;font-size:12.5px;color:#b9a9af;border-top:1px solid #f9f1f4;}',
    '@media (max-width:640px){.cc-sum{grid-template-columns:repeat(3,minmax(0,1fr));}.cc-row{grid-template-columns:22px minmax(0,1fr);gap:4px 6px;}.cc-nums,.cc-tg{grid-column:2;}}'
  ].join('');
  document.head.appendChild(css);

  var box = document.createElement('div');
  box.className = 'cc-box'; box.id = 'ops-course-click';
  box.innerHTML = '<div class="cc-hd"><span class="cc-t">뷰티수강 클릭 통계</span><span class="cc-s">같은 기기가 같은 곳을 30분 안에 다시 누르면 1번</span><button type="button" class="cc-re">새로고침</button></div><div class="cc-body"><div class="cc-empty">불러오는 중이에요</div></div>';
  tabs.parentNode.insertBefore(box, tabs);
  var body = box.querySelector('.cc-body');

  function num(v){ var n = Number(v); return isFinite(n) && n > 0 ? n : 0; }
  function first(o, keys){
    for(var i = 0; i < keys.length; i++){ if(o && o[keys[i]] != null) return o[keys[i]]; }
    return 0;
  }
  function targetCount(it, key){
    var t = it.by_target || it.targets || it.target || null;
    var v = t ? t[key] : it[key];
    if(v && typeof v === 'object') return num(first(v, ['total', 'all', 'count']));
    return num(v);
  }
  function normal(it){
    var row = {
      insta: String(first(it, ['insta', 'instagram_id', 'id', '원장인스타']) || '').replace(/^@+/, ''),
      today: num(first(it, ['today', 'd1', '오늘'])),
      d7: num(first(it, ['days7', 'd7', 'week', '7일'])),
      d30: num(first(it, ['days30', 'd30', 'month', '30일'])),
      total: num(first(it, ['total', 'all', '전체']))
    };
    row.tg = {};
    TARGETS.forEach(function(p){ row.tg[p[0]] = targetCount(it, p[0]); });
    return row;
  }
  function add(parent, tag, cls, text){
    var e = document.createElement(tag);
    if(cls) e.className = cls;
    if(text != null) e.textContent = text;
    parent.appendChild(e);
    return e;
  }
  function pair(parent, label, value){
    var s = add(parent, 'span', '', label);
    add(s, 'b', '', String(value));
  }
  function render(d){
    body.innerHTML = '';
    var list = (d && Array.isArray(d.instructors) ? d.instructors : []).map(normal).filter(function(r){ return r.insta; });
    list.sort(function(a, b){ return (b.total - a.total) || (b.d30 - a.d30) || (b.d7 - a.d7) || (b.today - a.today) || a.insta.localeCompare(b.insta); });
    if(!list.length){ add(body, 'div', 'cc-empty', '아직 기록 없음'); return; }
    var sum = add(body, 'div', 'cc-sum');
    var all = num(d.total_clicks) || list.reduce(function(s, r){ return s + r.total; }, 0);
    var k0 = add(sum, 'div', 'cc-k'); add(k0, 'b', '', String(all)); add(k0, 'span', '', '전체');
    TARGETS.forEach(function(p){
      var from = d.by_target ? num(d.by_target[p[0]]) : list.reduce(function(s, r){ return s + r.tg[p[0]]; }, 0);
      var k = add(sum, 'div', 'cc-k'); add(k, 'b', '', String(from)); add(k, 'span', '', p[1]);
    });
    list.forEach(function(r, i){
      var row = add(body, 'div', 'cc-row');
      add(row, 'div', 'cc-no', String(i + 1));
      add(row, 'div', 'cc-name', r.insta);
      var nums = add(row, 'div', 'cc-nums');
      pair(nums, '오늘', r.today); pair(nums, '7일', r.d7); pair(nums, '30일', r.d30); pair(nums, '전체', r.total);
      var tg = add(row, 'div', 'cc-tg');
      TARGETS.forEach(function(p){ pair(tg, p[1], r.tg[p[0]]); });
    });
  }
  function load(){
    fetch(EXEC + '?mode=clickstats&_=' + Date.now(), {cache: 'no-store'})
      .then(function(r){ return r.json(); })
      .then(function(d){
        if(!d || !d.ok) throw new Error('fail');
        render(d);
      })
      .catch(function(){
        body.innerHTML = '';
        add(body, 'div', 'cc-empty', '통계를 불러오지 못했어요. 새로고침을 눌러 주세요.');
      });
  }
  box.querySelector('.cc-re').addEventListener('click', load);
  window.DiaClickAdmin = {render: render};
  load();
})();
