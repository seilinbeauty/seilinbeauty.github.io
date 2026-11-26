/* 알림장 게시판 — 운영 센터에서 쓴 글을 파이어스토어(board_posts)에서 읽어 옵니다. (2026-11-26 커비)
   · 글쓰기·지우기는 운영 센터(비밀번호 0423)에서만 — dia-fb.js 의 addBoardPost · delBoardPost
   · 문서 모양: board_posts/{id} = { id, title, body, date:'YYYY-MM-DD', createdAt, chk, chkDel }
   · 목록은 최신순(createdAt 내림차순). 글이 없으면 '새 소식이 없습니다'.
   · 완료패스·휴식·가이드 안내 3건은 알림장 목록에 넣지 않습니다(kind 로 걸러 냅니다).
   · 홈 PC 패널(dia.html) · 공지사항 하단(dia-notice.html) · 게시판 페이지(dia-board-notice.html) · 운영 센터(dia-info.html)가 함께 씁니다. */
(function(){
  var BASE = 'https://firestore.googleapis.com/v1/projects/seilindia/databases/(default)/';
  var KEY = 'AIzaSyDQ1PusFvVlbgWyh0pU-2MoW7PzJZHNDKY';
  var COLL = 'board_posts';
  var CACHE_KEY = 'dia_board_cache_v2';
  var HIDE = { '완료패스': 1, '휴식': 1, '가이드': 1 };

  var posts = [];       // 전체 글 (최신순)
  var loaded = false;   // 한 번 읽었거나 읽기 실패로 결론냈으면 true (되풀이 요청 금지)
  var pLoad = null;
  var waiters = [];
  var LIMIT = 12000;    // 12초 안에 응답이 없으면 읽기 실패로 본다

  function esc(s){
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function sv(f, k){ return (f && f[k] && f[k].stringValue) || ''; }

  function parseDoc(doc){
    var f = doc.fields || {};
    var id = sv(f, 'id') || String(doc.name || '').split('/').pop();
    var createdAt = (f.createdAt && f.createdAt.timestampValue) || '';
    return {
      id: id,
      title: sv(f, 'title'),
      body: sv(f, 'body'),
      date: sv(f, 'date'),
      kind: sv(f, 'kind'),
      chkDel: sv(f, 'chkDel'),
      createdAt: createdAt,
      ts: Date.parse(createdAt) || 0
    };
  }
  function newer(a, b){
    if (b.ts !== a.ts) return b.ts - a.ts;
    return a.id < b.id ? 1 : (a.id > b.id ? -1 : 0);
  }
  // 알림장에 보이는 글 (완료패스·휴식·가이드 3건 제외)
  function visible(){ return posts.filter(function(p){ return !HIDE[p.kind]; }); }

  function notify(){
    var now = visible();
    var list = waiters.slice();
    waiters = [];
    for (var i = 0; i < list.length; i++){
      try{ list[i](now); }catch(e){}
    }
  }

  function load(force){
    if (loaded && !force) return Promise.resolve(visible());
    if (pLoad && !force) return pLoad;
    var url = BASE + 'documents/' + COLL + '?pageSize=300&key=' + KEY;
    var opt = { cache: 'no-store' };
    var ctl = window.AbortController ? new AbortController() : null;
    if (ctl) opt.signal = ctl.signal;
    var timer = setTimeout(function(){ if (ctl){ try{ ctl.abort(); }catch(e){} } }, LIMIT);
    pLoad = fetch(url, opt).then(function(r){
      clearTimeout(timer);
      if (!r.ok) throw new Error('fb');
      return r.json();
    }).then(function(d){
      var arr = ((d && d.documents) || []).map(parseDoc);
      arr.sort(newer);
      posts = arr;
      loaded = true;
      pLoad = null;
      try{ localStorage.setItem(CACHE_KEY, JSON.stringify(arr.slice(0, 300))); }catch(e){}
      notify();
      return visible();
    }, function(){
      clearTimeout(timer);
      pLoad = null;
      if (!loaded){
        try{
          var c = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
          if (c && c.length) posts = c;
        }catch(e){}
        loaded = true;   // 실패해도 다시 되풀이해 요청하지 않는다 (다음에 force 로 다시 읽음)
      }
      notify();
      return visible();
    });
    return pLoad;
  }

  // 글이 준비되면 cb(목록)을 부릅니다. 이미 읽었으면 바로.
  function ready(cb){
    if (loaded) { cb(visible()); return; }
    waiters.push(cb);
    load();
  }

  // 게시판 페이지 — 10줄씩, 줄을 누르면 내용이 그 자리에서 펼쳐집니다.
  // opt.onEdit(글, 버튼) 을 넣으면 각 글 아래에 '수정' 버튼이 붙습니다(알림장 페이지의 스태프 전용).
  function renderBoard(el, pager, page, opt){
    if (!el) return;
    if (!loaded){
      el.innerHTML = '<div class="bd-empty">불러오는 중…</div>';
      load().then(function(){ renderBoard(el, pager, page, opt); });
      return;
    }
    var canEdit = !!(opt && typeof opt.onEdit === 'function');
    var src = visible();
    var size = 10, total = src.length;
    var pages = Math.max(1, Math.ceil(total / size));
    page = Math.min(Math.max(1, page || 1), pages);
    var start = (page - 1) * size;
    var list = src.slice(start, start + size);

    if (!list.length){
      el.innerHTML = '<div class="bd-empty">새 소식이 없습니다</div>';
    } else {
      el.innerHTML = list.map(function(p, i){
        var no = total - (start + i);
        var vid = 'bdBody_' + p.id.replace(/[^A-Za-z0-9_-]/g, '');
        var pid = esc(p.id);
        return '<div class="bd-item">'
          + '<button type="button" class="bd-row" aria-expanded="false" data-body="' + vid + '">'
          + '<span class="bd-no">' + no + '</span>'
          + '<span class="bd-tt">' + esc(p.title) + '</span>'
          + '<span class="bd-dt">' + esc(p.date) + '</span>'
          + '</button>'
          + '<div class="bd-body" id="' + vid + '" hidden><div class="bd-body-in">' + esc(p.body) + '</div></div>'
          + (canEdit ? '<div class="bd-staff"><button type="button" class="bd-edit" data-edit="' + pid + '">수정</button></div>' : '')
          + '</div>';
      }).join('');
      var btns = el.querySelectorAll('.bd-row');
      for (var i = 0; i < btns.length; i++){
        btns[i].addEventListener('click', function(){
          var body = document.getElementById(this.getAttribute('data-body'));
          if (!body) return;
          var open = !body.hidden;
          body.hidden = open;
          this.setAttribute('aria-expanded', open ? 'false' : 'true');
        });
      }
      if (canEdit){
        var ebtns = el.querySelectorAll('.bd-edit');
        for (var k = 0; k < ebtns.length; k++){
          ebtns[k].addEventListener('click', function(){
            var id = this.getAttribute('data-edit'), post = null;
            for (var m = 0; m < list.length; m++){ if (list[m].id === id){ post = list[m]; break; } }
            if (post) opt.onEdit(post, this);
          });
        }
      }
    }

    if (pager){
      var h = '';
      for (var p = 1; p <= pages; p++){
        h += '<button type="button" class="bd-pg' + (p === page ? ' is-on' : '') + '" data-pg="' + p + '">' + p + '</button>';
      }
      pager.innerHTML = pages > 1 ? h : '';
      var pbtns = pager.querySelectorAll('.bd-pg');
      for (var j = 0; j < pbtns.length; j++){
        pbtns[j].addEventListener('click', function(){
          renderBoard(el, pager, Number(this.getAttribute('data-pg')), opt);
        });
      }
    }
  }

  window.DiaBoard = {
    load: load,
    ready: ready,
    renderBoard: renderBoard,
    esc: esc,
    all: function(){ return posts.slice(); },
    get list(){ return visible(); }
  };
})();
