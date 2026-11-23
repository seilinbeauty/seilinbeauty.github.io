/* 다이아 품앗이 해시태그 (공용)
   - 모양(틀)은 운영 센터 '#️⃣ 해시태그' 탭에서 바꿉니다.
   - [날짜] → 1122 처럼 월일 4자리, [연도] → 2026 으로 매일 자동으로 채워집니다(한국 시간, 자정에 바뀜).
   - PREVIEW=false: 창고 서버의 저장값을 씁니다.
     · 조회: mode=tag_get (누구나)  · 저장: mode=tag_set&pw=0423&tpl=...  · 처음 모양: mode=tag_set&pw=0423&reset=1
   - 서버값을 받아오면 화면도 따라 바뀌도록 on(콜백)으로 알립니다. */
(function(){
  var PREVIEW = false;
  var EXEC = 'https://script.google.com/macros/s/AKfycbxLu7nD0RH1FkCKdmgQkP7AybLKit34KN9ISnuW_pHwYrLW7EaqsWddNWBSGWfJ0S-V5A/exec';
  var STAFF_PW = '0423';
  var DEFAULT_TPL = '#[날짜]_행운을부탁해';
  var KEY = 'dia_tag_tpl';
  var tpl = '';      // 서버에서 받은 모양
  var subs = [];     // 바뀌면 알려줄 곳
  function kst(d){ return new Date((d ? d.getTime() : Date.now()) + 9 * 3600 * 1000); }
  function clean(v){
    var t = String(v || '').replace(/\s+/g, '').replace(/^#*/, '#');
    return t.length > 1 ? t.slice(0, 60) : DEFAULT_TPL;
  }
  function cached(){ try{ return clean(localStorage.getItem(KEY) || DEFAULT_TPL); }catch(e){ return DEFAULT_TPL; } }
  function get(){ return tpl || cached(); }
  function store(v){ tpl = clean(v); try{ localStorage.setItem(KEY, tpl); }catch(e){} }
  function fire(){ for(var i = 0; i < subs.length; i++){ try{ subs[i](tpl); }catch(e){} } }
  function apply(v){ var before = get(); store(v); if(get() !== before) fire(); return get(); }
  function call(q){
    if(!window.fetch) return Promise.reject(new Error('nosupport'));
    return fetch(EXEC + '?' + q + '&_=' + Date.now(), { cache: 'no-store' }).then(function(r){ return r.json(); });
  }
  // 서버에서 지금 모양을 받아온다(실패하면 이 기기에 남은 값)
  function load(){
    if(PREVIEW) return Promise.resolve(get());
    return call('mode=tag_get')
      .then(function(d){ if(d && d.ok && d.tpl) apply(d.tpl); return get(); })
      .catch(function(){ return get(); });
  }
  // 저장(운영 센터): 성공하면 {ok:true, tpl}
  function save(v){
    var t = clean(v);
    if(PREVIEW){ apply(t); return Promise.resolve({ ok: true, tpl: get() }); }
    return call('mode=tag_set&pw=' + encodeURIComponent(STAFF_PW) + '&tpl=' + encodeURIComponent(t))
      .then(function(d){
        if(d && d.ok){ apply(d.tpl || t); return { ok: true, tpl: get() }; }
        return { ok: false, error: (d && d.error) || 'fail' };
      })
      .catch(function(){ return { ok: false, error: '연결' }; });
  }
  // 처음 모양으로(운영 센터)
  function resetServer(){
    if(PREVIEW){ var d0 = apply(DEFAULT_TPL); return Promise.resolve({ ok: true, tpl: d0 }); }
    return call('mode=tag_set&pw=' + encodeURIComponent(STAFF_PW) + '&reset=1')
      .then(function(d){
        if(d && d.ok){ apply(d.tpl || DEFAULT_TPL); return { ok: true, tpl: get() }; }
        return { ok: false, error: (d && d.error) || 'fail' };
      })
      .catch(function(){ return { ok: false, error: '연결' }; });
  }
  function set(v){ return apply(v); }
  function reset(){ try{ localStorage.removeItem(KEY); }catch(e){} tpl = ''; return DEFAULT_TPL; }
  function render(v, date){
    var k = kst(date);
    var mm = String(k.getUTCMonth() + 1).padStart(2, '0'), dd = String(k.getUTCDate()).padStart(2, '0');
    return clean(v == null ? get() : v).replace(/\[날짜\]/g, mm + dd).replace(/\[연도\]/g, String(k.getUTCFullYear()));
  }
  function on(fn){ if(typeof fn === 'function') subs.push(fn); }
  window.DiaTag = {
    PREVIEW: PREVIEW, DEFAULT: DEFAULT_TPL, get: get, set: set, reset: reset, render: render,
    today: function(){ return render(); }, load: load, save: save, resetServer: resetServer, on: on
  };
  if(!PREVIEW) load();
})();
