/* 다이아 품앗이 해시태그 (공용)
   - 모양(틀)은 운영 센터 '#️⃣ 해시태그' 탭에서 바꿉니다.
   - [날짜] → 1122 처럼 월일 4자리, [연도] → 2026 으로 매일 자동으로 채워집니다(한국 시간, 자정에 바뀜).
   - 지금은 미리보기: 저장 연결 전이라 바꾼 모양이 그 기기에만 저장됩니다(PREVIEW). */
(function(){
  var PREVIEW = true;
  var DEFAULT_TPL = '#[날짜]_행운을부탁해';
  var KEY = 'dia_tag_tpl';
  function kst(d){ return new Date((d ? d.getTime() : Date.now()) + 9 * 3600 * 1000); }
  function clean(tpl){
    tpl = String(tpl || '').replace(/\s+/g, '').replace(/^#*/, '#');
    return tpl.length > 1 ? tpl.slice(0, 60) : DEFAULT_TPL;
  }
  function get(){
    try{ return clean(localStorage.getItem(KEY) || DEFAULT_TPL); }catch(e){ return DEFAULT_TPL; }
  }
  function set(tpl){
    tpl = clean(tpl);
    try{ localStorage.setItem(KEY, tpl); }catch(e){}
    return tpl;
  }
  function reset(){ try{ localStorage.removeItem(KEY); }catch(e){} return DEFAULT_TPL; }
  function render(tpl, date){
    var k = kst(date);
    var mm = String(k.getUTCMonth() + 1).padStart(2, '0'), dd = String(k.getUTCDate()).padStart(2, '0');
    return clean(tpl == null ? get() : tpl).replace(/\[날짜\]/g, mm + dd).replace(/\[연도\]/g, String(k.getUTCFullYear()));
  }
  window.DiaTag = { PREVIEW: PREVIEW, DEFAULT: DEFAULT_TPL, get: get, set: set, reset: reset, render: render, today: function(){ return render(); } };
})();
