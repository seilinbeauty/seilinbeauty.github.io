(function(){
  var LS_KEY = 'dia_custom_cats_v1';
  var FB_DOC = 'https://firestore.googleapis.com/v1/projects/seilindia/databases/(default)/documents/analytics/dia_categories_v1';

  function loadLocal(){
    try { var a = JSON.parse(localStorage.getItem(LS_KEY) || '[]'); return Array.isArray(a) ? a : []; }
    catch(e){ return []; }
  }
  function saveAll(list, cb){
    try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch(e){}
    fetch(FB_DOC, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { json: { stringValue: JSON.stringify(list) }, updatedAt: { stringValue: new Date().toISOString() } } })
    }).then(function(){ if(cb) cb(true); }).catch(function(){ if(cb) cb(false); });
  }
  function syncRemote(onDone){
    fetch(FB_DOC).then(function(r){ return r.ok ? r.json() : null; }).then(function(d){
      if (d && d.fields && d.fields.json && d.fields.json.stringValue) {
        try {
          var arr = JSON.parse(d.fields.json.stringValue);
          if (Array.isArray(arr)) {
            localStorage.setItem(LS_KEY, JSON.stringify(arr));
            onDone(arr);
            return;
          }
        } catch(e){}
      }
      onDone(loadLocal());
    }).catch(function(){ onDone(loadLocal()); });
  }

  function init(){
    var nav = document.querySelector('.ops-nav');
    var stats = document.getElementById('ops-stats');
    if (!nav || !stats || document.getElementById('ops-cats')) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ops-nav-item';
    btn.setAttribute('data-cattab', '1');
    btn.textContent = '📂 카테고리 관리';
    nav.appendChild(btn);

    var panel = document.createElement('div');
    panel.id = 'ops-cats';
    panel.style.display = 'none';
    panel.innerHTML =
      '<div class="ops-card" style="padding:20px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:14px;">' +
          '<div><h3 style="margin:0;font-size:16px;font-weight:800;color:#0f172a;">📂 커뮤니티 카테고리 관리</h3>' +
          '<p style="margin:4px 0 0;font-size:12.5px;color:#64748b;">여기서 추가한 카테고리는 다이아 커뮤니티 왼쪽 메뉴에 바로 반영됩니다.</p></div>' +
          '<span id="cat_msg" style="font-size:12.5px;font-weight:800;color:#16a34a;"></span>' +
        '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;background:#f8fafc;padding:12px;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:16px;">' +
          '<input id="cat_ico" type="text" placeholder="이모지 (예: 🎁)" value="📌" style="width:90px;height:36px;padding:0 10px;font-size:13px;">' +
          '<input id="cat_name" type="text" placeholder="카테고리 이름 (예: 이벤트 공지)" style="flex:1;min-width:160px;height:36px;padding:0 10px;font-size:13px;">' +
          '<input id="cat_url" type="text" placeholder="연결 주소 (예: dia-course.html 또는 https://...)" style="flex:1.4;min-width:200px;height:36px;padding:0 10px;font-size:13px;">' +
          '<button type="button" id="cat_add" class="sn-save" style="height:36px;padding:0 16px;font-size:13px;font-weight:800;cursor:pointer;">+ 카테고리 추가</button>' +
        '</div>' +
        '<table style="width:100%;border-collapse:collapse;font-size:13px;">' +
          '<thead><tr>' +
            '<th style="text-align:left;padding:9px 8px;">순서</th>' +
            '<th style="text-align:left;padding:9px 8px;">카테고리</th>' +
            '<th style="text-align:left;padding:9px 8px;">연결 주소</th>' +
            '<th style="text-align:center;padding:9px 8px;">노출</th>' +
            '<th style="text-align:right;padding:9px 8px;">관리</th>' +
          '</tr></thead>' +
          '<tbody id="cat_tbody"></tbody>' +
        '</table>' +
      '</div>';

    stats.parentNode.insertBefore(panel, stats.nextSibling);

    var list = loadLocal();
    function msg(t){ var m = document.getElementById('cat_msg'); if(m){ m.textContent = t; setTimeout(function(){ m.textContent = ''; }, 2500); } }
    function render(){
      var tb = document.getElementById('cat_tbody');
      if (!tb) return;
      if (!list.length) {
        tb.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:#94a3b8;">추가된 커스텀 카테고리가 없습니다. 위에서 새 카테고리를 추가해 보세요.</td></tr>';
        return;
      }
      tb.innerHTML = list.map(function(c, i){
        return '<tr>' +
          '<td style="padding:8px;"><button type="button" data-up="'+i+'" style="border:1px solid #cbd5e1;background:#fff;border-radius:4px;cursor:pointer;padding:2px 6px;">▲</button> <button type="button" data-dn="'+i+'" style="border:1px solid #cbd5e1;background:#fff;border-radius:4px;cursor:pointer;padding:2px 6px;">▼</button></td>' +
          '<td style="padding:8px;font-weight:700;">' + (c.icon || '📌') + ' ' + String(c.name || '').replace(/</g,'&lt;') + '</td>' +
          '<td style="padding:8px;color:#475569;word-break:break-all;">' + String(c.url || '#').replace(/</g,'&lt;') + '</td>' +
          '<td style="padding:8px;text-align:center;"><button type="button" data-tog="'+i+'" style="border:1px solid #cbd5e1;background:'+(c.hide?'#f1f5f9':'#eff6ff')+';color:'+(c.hide?'#64748b':'#2563eb')+';border-radius:5px;padding:3px 9px;font-weight:700;cursor:pointer;">'+(c.hide?'숨김':'노출 중')+'</button></td>' +
          '<td style="padding:8px;text-align:right;"><button type="button" data-del="'+i+'" style="border:1px solid #fecaca;background:#fff5f5;color:#dc2626;border-radius:5px;padding:3px 9px;font-weight:700;cursor:pointer;">삭제</button></td>' +
        '</tr>';
      }).join('');
      tb.querySelectorAll('[data-up]').forEach(function(b){ b.addEventListener('click', function(){ var i=+b.getAttribute('data-up'); if(i>0){ var t=list[i-1]; list[i-1]=list[i]; list[i]=t; saveAll(list, function(){ msg('저장됨'); }); render(); } }); });
      tb.querySelectorAll('[data-dn]').forEach(function(b){ b.addEventListener('click', function(){ var i=+b.getAttribute('data-dn'); if(i<list.length-1){ var t=list[i+1]; list[i+1]=list[i]; list[i]=t; saveAll(list, function(){ msg('저장됨'); }); render(); } }); });
      tb.querySelectorAll('[data-tog]').forEach(function(b){ b.addEventListener('click', function(){ var i=+b.getAttribute('data-tog'); list[i].hide=!list[i].hide; saveAll(list, function(){ msg('저장됨'); }); render(); }); });
      tb.querySelectorAll('[data-del]').forEach(function(b){ b.addEventListener('click', function(){ var i=+b.getAttribute('data-del'); list.splice(i,1); saveAll(list, function(){ msg('삭제 및 반영 완료'); }); render(); }); });
    }

    document.getElementById('cat_add').addEventListener('click', function(){
      var ico = (document.getElementById('cat_ico').value || '📌').trim();
      var nm = (document.getElementById('cat_name').value || '').trim();
      var url = (document.getElementById('cat_url').value || '#').trim();
      if (!nm) { msg('이름을 입력해 주세요'); return; }
      list.push({ id: 'cat_' + Date.now(), icon: ico, name: nm, url: url, hide: false });
      document.getElementById('cat_name').value = '';
      document.getElementById('cat_url').value = '';
      saveAll(list, function(){ msg('카테고리 추가 완료!'); });
      render();
    });

    nav.addEventListener('click', function(e){
      var t = e.target.closest('.ops-nav-item');
      if (!t) return;
      if (t.getAttribute('data-cattab')) {
        nav.querySelectorAll('.ops-nav-item').forEach(function(x){ x.setAttribute('data-on', x === t ? '1' : '0'); });
        ['ops-stats','ops-members','ops-course','ops-notice','ops-banner','ops-diaworld','ops-tag','ops-santa'].forEach(function(id){
          var el = document.getElementById(id); if (el) el.style.display = 'none';
        });
        panel.style.display = '';
        syncRemote(function(arr){ list = arr; render(); });
      } else {
        panel.style.display = 'none';
      }
    });
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
