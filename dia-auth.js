/* 다이아 — Firebase Google 간편 로그인 연동 (2026-11-27 커비)
   - 로그인 화면(dia-preview-login.html)과 회원가입 화면(dia-preview-join.html) 공용
   - 구글 인증 성공 시 이메일·이름·UID를 저장하고, 기존 연결된 명부 회원이 있으면 바로 dia.html로 이동
*/
(function(){
  var CFG = {
    apiKey: 'AIzaSyDQ1PusFvVlbgWyh0pU-2MoW7PzJZHNDKY',
    authDomain: 'seilindia.firebaseapp.com',
    projectId: 'seilindia'
  };
  var MAP_KEY = 'dia_google_ig_map';
  var USER_KEY = 'dia_google_user';

  function getMap(){
    try { return JSON.parse(localStorage.getItem(MAP_KEY) || '{}') || {}; } catch(e){ return {}; }
  }
  function saveMap(email, nick){
    if (!email || !nick) return;
    try {
      var m = getMap();
      m[String(email).toLowerCase()] = nick;
      localStorage.setItem(MAP_KEY, JSON.stringify(m));
    } catch(e){}
  }

  function showMsg(msg, isOk){
    var el = document.getElementById('lgErr') || document.getElementById('snsMsg');
    if (!el) {
      var box = document.querySelector('.box') || document.querySelector('.pv-card') || document.body;
      el = document.createElement('p');
      el.id = 'snsMsg';
      el.style.cssText = 'margin:10px 0 0;font-size:12px;line-height:1.5;';
      box.appendChild(el);
    }
    el.textContent = msg || '';
    el.style.display = msg ? 'block' : 'none';
    el.style.color = isOk ? '#2e6f40' : '#c95050';
  }

  function onGoogleUser(u){
    if (!u || !u.email) return;
    var email = String(u.email).trim();
    try {
      localStorage.setItem(USER_KEY, JSON.stringify({
        uid: u.uid || '',
        email: email,
        name: u.displayName || '',
        photo: u.photoURL || ''
      }));
    } catch(e){}

    var m = getMap();
    var linkedNick = m[email.toLowerCase()];
    if (linkedNick) {
      try {
        localStorage.setItem('dia_login_member', linkedNick);
        localStorage.setItem('dia_login_member_bak', linkedNick);
        if (linkedNick === 'STAFF' || linkedNick === '세이린뷰티 본점') {
          localStorage.setItem('dia_no_track', '1');
        }
      } catch(e){}
      location.href = 'dia.html';
      return;
    }

    // 회원가입 페이지가 아니면 구글 계정으로 즉시 로그인 완료 -> dia.html 이동
    var isJoin = location.pathname.indexOf('join') >= 0;
    if (!isJoin) {
      var nick = (u.displayName || email.split('@')[0] || '구글회원').trim();
      saveMap(email, nick);
      try {
        localStorage.setItem('dia_login_member', nick);
        localStorage.setItem('dia_login_member_bak', nick);
      } catch(e){}
      location.href = 'dia.html';
      return;
    }
    window.__diaPendingGoogleEmail = email;
    var ig = document.getElementById('igId') || document.querySelector('input[placeholder*="인스타"]');
    var em = document.querySelector('input[type="email"], input[placeholder*="이메일"]');
    if (em && !em.value) em.value = email;
    showMsg('구글 인증 완료 (' + email + '). 인스타그램 아이디를 입력하고 가입하기를 눌러 주세요.', true);
    if (ig) ig.focus();
  }

  function initFirebase(){
    if (!window.firebase) return null;
    if (!firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(CFG);
    }
    return firebase.auth();
  }

  function startGoogle(){
    var auth = initFirebase();
    if (!auth) {
      showMsg('구글 인증 모듈을 불러오는 중입니다. 잠시 후 다시 눌러 주세요.');
      return;
    }
    var provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    auth.signInWithPopup(provider).then(function(res){
      if (res && res.user) onGoogleUser(res.user);
    }).catch(function(err){
      var code = (err && err.code) || '';
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-browser') {
        auth.signInWithRedirect(provider);
      } else if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        showMsg('구글 로그인이 취소되었습니다.');
      } else {
        showMsg('구글 로그인 오류: ' + (err && err.message ? err.message : code));
      }
    });
  }

  function bind(){
    var auth = initFirebase();
    if (auth) {
      auth.getRedirectResult().then(function(res){
        if (res && res.user) onGoogleUser(res.user);
      }).catch(function(){});
    }

    // 구글 버튼 연결
    var gBtns = document.querySelectorAll('[data-sns="google"], .btn-social.google');
    for (var i = 0; i < gBtns.length; i++) {
      gBtns[i].addEventListener('click', function(e){
        e.preventDefault();
        startGoogle();
      });
    }

    // 네이버·카카오 미연동 안내
    var otherBtns = document.querySelectorAll('[data-sns="naver"], [data-sns="kakao"], .btn-social.naver, .btn-social.kakao');
    for (var j = 0; j < otherBtns.length; j++) {
      otherBtns[j].addEventListener('click', function(e){
        e.preventDefault();
        var isKakao = this.classList.contains('kakao') || this.getAttribute('data-sns') === 'kakao';
        showMsg((isKakao ? '카카오' : '네이버') + ' 간편 로그인은 앱 키 등록 준비 중입니다. 구글로 로그인하거나 인스타그램 아이디를 이용해 주세요.');
      });
    }
  }

  window.DiaAuth = {
    linkGoogleMember: function(nick){
      if (window.__diaPendingGoogleEmail && nick) {
        saveMap(window.__diaPendingGoogleEmail, nick);
      }
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
