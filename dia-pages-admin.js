/* 다이아 — 운영센터 '🔧 페이지 공개' 탭
   개발 중 페이지를 스태프 전용 ↔ 전체 공개로 켜고 끈다.
   저장: 파이어스토어 analytics/dia_pages_v1 (json) + localStorage 캐시
   실제 사이트: dia-staff.js 가 이 값을 읽어 메뉴 노출·개발 중 화면을 결정한다
*/
(function(){
  var LS_KEY = 'dia_pages_v1';
  var FB_DOC = 'https://firestore.googleapis.com/v1/projects/seilindia/databases/(default)/documents/analytics/dia_pages_v1';

  // 공개 설정을 관리하는 페이지 목록 (여기에 추가하면 운영센터에 자동으로 칸이 생긴다)
  var PAGES = [
    { key: 'shop',   name: '🏪 뷰티샵 직거래',    file: 'dia-shop.html',  desc: '샵인샵 · 샵매매 부동산 매물' },
    { key: 'jobs',   name: '👥 구인',       file: 'dia-jobs.html',  desc: '직원 구해요 · 구직 (준비 중)' }
  ];

  function loadLocal(){
    try { var o = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); return (o && typeof o === 'object') ? o : {}; }
    catch(e){ return {}; }
  }
  function saveAll(obj, cb){
    try { localStorage.setItem(LS_KEY, JSON.stringify(obj)); } catch(e){}
    fetch(FB_DOC, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { json: { stringValue: JSON.stringify(obj) }, updatedAt: { stringValue: new Date().toISOString() } } })
    }).then(function(){ if (cb) cb(true); }).catch(function(){ if (cb) cb(false); });
  }
  function syncRemote(done){
    fetch(FB_DOC).then(function(r){ return r.ok ? r.json() : null; }).then(function(d){
      if (d && d.fields && d.fields.json && d.fields.json.stringValue) {
        var o = JSON.parse(d.fields.json.stringValue);
        if (o && typeof o === 'object') { localStorage.setItem(LS_KEY, JSON.stringify(o)); done(o); return; }
      }
      done(loadLocal());
    }).catch(function(){ done(loadLocal()); });
  }

  function init(){
    var nav = document.querySelector('.ops-nav');
    var stats = document.getElementById('ops-stats');
    if (!nav || !stats || document.getElementById('ops-pages')) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ops-nav-item';
    btn.setAttribute('data-pagetab', '1');
    btn.textContent = '🔧 페이지 공개';
    nav.appendChild(btn);

    var panel = document.createElement('div');
    panel.id = 'ops-pages';
    panel.style.display = 'none';
    panel.innerHTML =
      '<div class="ops-card" style="padding:20px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:14px;">' +
          '<div><h3 style="margin:0;font-size:16px;font-weight:800;color:#0f172a;">🔧 페이지 공개 설정</h3>' +
          '<p style="margin:4px 0 0;font-size:12.5px;color:#64748b;">개발 중 페이지를 스태프 전용으로 두거나 전체에 공개합니다. 공개하면 다이아 왼쪽 메뉴에도 나타납니다.</p></div>' +
          '<span id="pg_msg" style="font-size:12.5px;font-weight:800;color:#16a34a;"></span>' +
        '</div>' +
        '<table style="width:100%;border-collapse:collapse;font-size:13px;">' +
          '<thead><tr>' +
            '<th style="text-align:left;padding:9px 8px;">페이지</th>' +
            '<th style="text-align:left;padding:9px 8px;">파일</th>' +
            '<th style="text-align:left;padding:9px 8px;">상태</th>' +
            '<th style="text-align:right;padding:9px 8px;">공개 설정</th>' +
          '</tr></thead>' +
          '<tbody id="pg_tbody"></tbody>' +
        '</table>' +
      '</div>';

    stats.parentNode.insertBefore(panel, stats.nextSibling);

    var data = loadLocal();
    function msg(t){ var m = document.getElementById('pg_msg'); if(m){ m.textContent = t; setTimeout(function(){ m.textContent = ''; }, 2500); } }

    function render(){
      var tb = document.getElementById('pg_tbody');
      if (!tb) return;
      tb.innerHTML = PAGES.map(function(p){
        var on = !!(data[p.key] && data[p.key].public);
        return '<tr>' +
          '<td style="padding:9px 8px;"><b>' + p.name + '</b><div style="font-size:11.5px;color:#94a3b8;margin-top:2px;">' + p.desc + '</div></td>' +
          '<td style="padding:9px 8px;color:#475569;">' + p.file + '</td>' +
          '<td style="padding:9px 8px;"><span style="font-size:11.5px;font-weight:800;padding:3px 9px;border-radius:99px;background:' + (on ? '#eff6ff' : '#f1f5f9') + ';color:' + (on ? '#2563eb' : '#64748b') + ';">' + (on ? '전체 공개' : '스태프 전용') + '</span></td>' +
          '<td style="padding:9px 8px;text-align:right;"><button type="button" data-pg="' + p.key + '" style="border:1px solid ' + (on ? '#cbd5e1' : '#2563eb') + ';background:' + (on ? '#fff' : '#2563eb') + ';color:' + (on ? '#475569' : '#fff') + ';border-radius:6px;padding:5px 12px;font-size:12px;font-weight:800;cursor:pointer;">' + (on ? '스태프 전용으로' : '전체 공개로') + '</button></td>' +
        '</tr>';
      }).join('');
      tb.querySelectorAll('[data-pg]').forEach(function(b){
        b.addEventListener('click', function(){
          var k = b.getAttribute('data-pg');
          var cur = !!(data[k] && data[k].public);
          data[k] = data[k] || {};
          data[k].public = !cur;
          saveAll(data, function(ok){ msg(ok ? '저장 및 반영 완료' : '화면에는 반영, 서버 저장 실패'); });
          render();
        });
      });
    }

    nav.addEventListener('click', function(e){
      var t = e.target.closest('.ops-nav-item');
      if (!t) return;
      if (t.getAttribute('data-pagetab')) {
        nav.querySelectorAll('.ops-nav-item').forEach(function(x){ x.setAttribute('data-on', x === t ? '1' : '0'); });
        ['ops-stats','ops-members','ops-course','ops-notice','ops-banner','ops-diaworld','ops-tag','ops-santa','ops-cats'].forEach(function(id){
          var el = document.getElementById(id); if (el) el.style.display = 'none';
        });
        panel.style.display = '';
        syncRemote(function(o){ data = o; render(); });
      } else {
        panel.style.display = 'none';
      }
    });

    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
