(function () {
  if (window.__diaSubHeaderInit) return;
  window.__diaSubHeaderInit = true;

  var page = (location.pathname.split('/').pop() || 'dia.html').split('?')[0];

  function isLoggedIn() {
    try {
      return !!(localStorage.getItem('dia_login_member') || localStorage.getItem('dia_login_member_bak'));
    } catch (e) {
      return false;
    }
  }

  function doLogout(e) {
    if (e) e.preventDefault();
    try {
      localStorage.removeItem('dia_login_member');
      localStorage.removeItem('dia_login_member_bak');
      localStorage.removeItem('dia_sns_auth');
    } catch (err) {}
    location.reload();
  }

  function ensureDrawerAndModal() {
    if (!document.getElementById('moCatDrawer')) {
      var d = document.createElement('div');
      d.id = 'moCatDrawer';
      d.setAttribute('role', 'dialog');
      d.setAttribute('aria-modal', 'true');
      d.setAttribute('aria-label', '카테고리 메뉴');
      d.innerHTML =
        '<div class="mcd-panel">' +
          '<div class="mcd-top">' +
            '<span class="mcd-title">카테고리</span>' +
            '<button type="button" class="mcd-x" id="moCatClose" aria-label="닫기">×</button>' +
          '</div>' +
          '<div class="mcd-auth" id="moCatAuth">' +
            '<a href="dia-preview-login.html" id="moCatLogin">로그인</a>' +
            '<a href="dia-preview-join.html" class="primary" id="moCatJoin">회원가입</a>' +
          '</div>' +
          '<div class="mcd-list">' +
            '<a href="dia.html" class="mcd-link">🏠 커뮤니티 홈</a>' +
            '<div class="mcd-sub-label">📢 공지사항</div>' +
            '<div class="mcd-sub">' +
              '<a href="dia-guide.html">품앗이 가이드</a>' +
              '<a href="dia-pass.html">완료패스 공지</a>' +
              '<a href="dia-rest.html">휴식 공지</a>' +
              '<a href="dia-board-notice.html">NOTICE</a>' +
              '<a href="dia-qna.html">Q&amp;A</a>' +
            '</div>' +
            '<a href="dia-workspace.html" class="mcd-link">다이아 워크스페이스</a>' +
            '<a href="dia-tools.html" class="mcd-link">다이아 마케팅 프로</a>' +
            '<div class="mcd-sep"></div>' +
            '<a href="dia-shop.html" class="mcd-link">뷰티샵 직거래</a>' +
            '<a href="dia-course.html" class="mcd-link">전국 뷰티수강 비교</a>' +
            '<div class="mcd-sep"></div>' +
            '<a href="https://open.kakao.com/o/gQOf8yAf" target="_blank" rel="noopener" class="mcd-link" id="moCatKakao">💬 마케팅 오픈채팅 입장하기</a>' +
            '<div class="mcd-sep"></div>' +
            '<a href="dia-info.html" class="mcd-link">⚙️ 운영 센터</a>' +
          '</div>' +
        '</div>';
      document.body.appendChild(d);
    }

    if (!document.getElementById('diaInviteModal')) {
      var m = document.createElement('div');
      m.id = 'diaInviteModal';
      m.setAttribute('role', 'dialog');
      m.setAttribute('aria-modal', 'true');
      m.innerHTML =
        '<div class="dim-box">' +
          '<button type="button" class="dim-x" id="dimClose" aria-label="닫기">×</button>' +
          '<p class="dim-t" id="dimTitle">💬 마케팅 오픈채팅 입장 안내</p>' +
          '<p class="dim-s" id="dimSub"></p>' +
          '<div class="dim-code-wrap" id="dimCodeWrap" style="display:none;">' +
            '<span class="dim-code">S3333</span>' +
            '<button type="button" class="dim-copy" id="dimCopyBtn">코드 복사</button>' +
          '</div>' +
          '<a href="https://open.kakao.com/o/gQOf8yAf" target="_blank" rel="noopener" class="dim-go" id="dimGoBtn">오픈채팅 바로 가기</a>' +
        '</div>';
      document.body.appendChild(m);
    }
  }

  function init() {
    ensureDrawerAndModal();

    var drawer = document.getElementById('moCatDrawer');
    var btn = document.getElementById('moCatBtn');
    var closeBtn = document.getElementById('moCatClose');

    function openDrawer() {
      if (!drawer) return;
      drawer.classList.add('is-open');
      if (btn) btn.setAttribute('aria-expanded', 'true');
    }
    function closeDrawer() {
      if (!drawer) return;
      drawer.classList.remove('is-open');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }

    if (btn) btn.addEventListener('click', openDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (drawer) {
      drawer.addEventListener('click', function (e) {
        if (e.target === drawer) closeDrawer();
      });
      var links = drawer.querySelectorAll('a[href]');
      for (var i = 0; i < links.length; i++) {
        var href = links[i].getAttribute('href');
        if (href === page) links[i].classList.add('is-active');
      }
    }

    // 로그인 / 회원가입 <-> 로그아웃 상태 동기화
    var logged = isLoggedIn();
    var hdrLogin = document.getElementById('hdrLogin');
    var hdrJoin = document.querySelector('header.dia-header .nav-join');
    var moLogin = document.getElementById('moCatLogin');
    var moJoin = document.getElementById('moCatJoin');

    if (logged) {
      if (hdrLogin) {
        hdrLogin.textContent = '로그아웃';
        hdrLogin.setAttribute('href', '#');
        hdrLogin.addEventListener('click', doLogout);
      }
      if (hdrJoin) hdrJoin.style.display = 'none';
      if (moLogin) {
        moLogin.textContent = '로그아웃';
        moLogin.setAttribute('href', '#');
        moLogin.addEventListener('click', doLogout);
      }
      if (moJoin) moJoin.style.display = 'none';
    }

    // 마케팅 오픈채팅 초대코드 모달
    var modal = document.getElementById('diaInviteModal');
    var dimClose = document.getElementById('dimClose');
    var dimSub = document.getElementById('dimSub');
    var dimCodeWrap = document.getElementById('dimCodeWrap');
    var dimCopyBtn = document.getElementById('dimCopyBtn');
    var dimGoBtn = document.getElementById('dimGoBtn');

    function openInviteModal(e) {
      if (e) e.preventDefault();
      closeDrawer();
      if (!modal) return;
      if (isLoggedIn()) {
        dimSub.textContent = '아래 입장코드를 복사한 뒤 오픈채팅방에 입력해 주세요.';
        dimCodeWrap.style.display = 'flex';
        dimGoBtn.textContent = '오픈채팅 바로 가기';
        dimGoBtn.setAttribute('href', 'https://open.kakao.com/o/gQOf8yAf');
        dimGoBtn.setAttribute('target', '_blank');
      } else {
        dimSub.textContent = '초대코드는 로그인 후 바로 확인하실 수 있어요.';
        dimCodeWrap.style.display = 'none';
        dimGoBtn.textContent = '로그인하고 코드 보기';
        dimGoBtn.setAttribute('href', 'dia-preview-login.html');
        dimGoBtn.removeAttribute('target');
      }
      modal.classList.add('is-open');
    }

    var moKakao = document.getElementById('moCatKakao');
    var pcKakao = document.querySelector('header.dia-header .nav-links a[href*="open.kakao.com"]');
    if (moKakao) moKakao.addEventListener('click', openInviteModal);
    if (pcKakao) pcKakao.addEventListener('click', openInviteModal);

    if (dimClose) dimClose.addEventListener('click', function () { modal.classList.remove('is-open'); });
    if (modal) modal.addEventListener('click', function (e) { if (e.target === modal) modal.classList.remove('is-open'); });
    if (dimCopyBtn) {
      dimCopyBtn.addEventListener('click', function () {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText('S3333');
        }
        dimCopyBtn.textContent = '복사됨';
        setTimeout(function () { dimCopyBtn.textContent = '코드 복사'; }, 1500);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
