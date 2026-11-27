/* 전 페이지 카테고리/페이지별 방문자·조회수 집계 (2026-11-28 커비) */
(function(){
  try {
    if (!window.fetch) return;
    if (/[?&]notrack=1/.test(location.search)) {
      try { localStorage.setItem('dia_no_track', '1'); } catch(e){}
      return;
    }
    try {
      if (localStorage.getItem('dia_no_track') === '1') return;
    } catch(e){}
    if (navigator.webdriver) return;

    var file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    var MAP = {
      'dia.html': 'dia_home',
      'dia-shop.html': 'dia_shop',
      'dia-shop-write.html': 'dia_shop',
      'dia-course.html': 'dia_course',
      'dia-my-course.html': 'dia_course',
      'dia-tools.html': 'dia_tools',
      'dia-guide.html': 'dia_guide',
      'dia-qna.html': 'dia_qna',
      'dia-mypage.html': 'dia_mypage',
      'dia-notice.html': 'dia_notice',
      'dia-board-notice.html': 'dia_notice',
      'dia-pass.html': 'dia_pass',
      'dia-rest.html': 'dia_rest',
      'dia-link.html': 'dia_link',
      'dia-info.html': 'dia_info',
      'index.html': 'academy_home',
      'parking.html': 'parking'
    };
    var pKey = MAP[file] || file.replace(/[^a-z0-9]/g, '_');

    var now = new Date();
    var kst = new Date(now.getTime() + 9 * 3600000);
    var day = kst.toISOString().slice(0, 10);

    var ssKey = 'dia_pt_' + day + '_' + pKey;
    var alreadyView = false;
    try {
      if (sessionStorage.getItem(ssKey)) alreadyView = true;
      else sessionStorage.setItem(ssKey, '1');
    } catch(e){}
    if (alreadyView) return;

    var visKey = 'dia_pv_' + day + '_' + pKey;
    var isNewVisitor = false;
    try {
      if (!localStorage.getItem(visKey)) {
        isNewVisitor = true;
        localStorage.setItem(visKey, '1');
      }
    } catch(e){}

    var FB_DOC = 'https://firestore.googleapis.com/v1/projects/seilindia/databases/(default)/documents/course_views/dia_page_stats_v1';
    var FB_KEY = 'AIzaSyDQ1PusFvVlbgWyh0pU-2MoW7PzJZHNDKY';

    fetch(FB_DOC + '?key=' + FB_KEY)
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(doc){
        var cur = 0, curU = 0;
        try {
          var dMap = doc && doc.fields && doc.fields.days && doc.fields.days.mapValue && doc.fields.days.mapValue.fields;
          var pMap = dMap && dMap[day] && dMap[day].mapValue && dMap[day].mapValue.fields;
          var item = pMap && pMap[pKey] && pMap[pKey].mapValue && pMap[pKey].mapValue.fields;
          if (item) {
            cur = parseInt((item.v && item.v.integerValue) || '0', 10) || 0;
            curU = parseInt((item.u && item.u.integerValue) || '0', 10) || 0;
          }
        } catch(e){}

        var nextV = cur + 1;
        var nextU = curU + (isNewVisitor ? 1 : 0);
        if (nextU < 1) nextU = 1;

        var body = { fields: { days: { mapValue: { fields: {} } } } };
        body.fields.days.mapValue.fields[day] = { mapValue: { fields: {} } };
        body.fields.days.mapValue.fields[day].mapValue.fields[pKey] = {
          mapValue: {
            fields: {
              v: { integerValue: String(nextV) },
              u: { integerValue: String(nextU) }
            }
          }
        };
        var mask = 'updateMask.fieldPaths=' + encodeURIComponent('days.' + day + '.' + pKey);
        return fetch(FB_DOC + '?' + mask + '&key=' + FB_KEY, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
      })
      .catch(function(){});
  } catch (e) {}
})();
