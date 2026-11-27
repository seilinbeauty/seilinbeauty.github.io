/* 다이아 — Google / Kakao / Naver 간편 로그인 통합 (2026-11-27 커비) */
(function(){
  var FB_CFG = {
    apiKey: 'AIzaSyDQ1PusFvVlbgWyh0pU-2MoW7PzJZHNDKY',
    authDomain: 'seilindia.firebaseapp.com',
    projectId: 'seilindia'
  };
  var KAKAO_JS_KEY = 'a0ec3c93d51585840a5a44f01b8d320b';
  var NAVER_CLIENT_ID = '8ZIpKZwgxChwqaa_qP9q';
  var CALLBACK_URL = 'https://seilinbeauty.github.io/dia-preview-login.html';

  var MAP_KEY = 'dia_sns_ig_map';
  var USER_KEY = 'dia_sns_user';

  function getMap(){
    try { return JSON.parse(localStorage.getItem(MAP_KEY) || '{}') || {}; } catch(e){ return {}; }
  }
  function saveMap(key, nick){
    if (!key || !nick) return;
    try {
      var m = getMap();
      m[String(key).toLowerCase()] = nick;
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

  function completeSnsLogin(provider, uidKey, displayName, email){
    try {
      localStorage.setItem(USER_KEY, JSON.stringify({
        provider: provider,
        key: uidKey || '',
        name: displayName || '',
        email: email || ''
      }));
    } catch(e){}

    var m = getMap();
    var nick = (uidKey && m[String(uidKey).toLowerCase()]) || displayName || (email ? email.split('@')[0] : '') || (provider + '회원');
    nick = String(nick).trim();
    if (uidKey) saveMap(uidKey, nick);

    try {
      localStorage.setItem('dia_login_member', nick);
      localStorage.setItem('dia_login_member_bak', nick);
    } catch(e){}
    location.href = 'dia.html';
  }

  // 1) Google (Firebase Auth)
  function initFirebase(){
    if (!window.firebase) return null;
    if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(FB_CFG);
    return firebase.auth();
  }

  function onGoogleUser(u){
    if (!u || !u.email) return;
    var email = String(u.email).trim();
    var isJoin = location.pathname.indexOf('join') >= 0;
    if (!isJoin) {
      completeSnsLogin('google', 'google:' + email, u.displayName || email.split('@')[0], email);
      return;
    }
    window.__diaPendingGoogleEmail = email;
    var ig = document.getElementById('igId') || document.querySelector('input[placeholder*="인스타"]');
    var em = document.querySelector('input[type="email"], input[placeholder*="이메일"]');
    if (em && !em.value) em.value = email;
    showMsg('구글 인증 완료 (' + email + '). 인스타그램 아이디를 입력하고 가입하기를 눌러 주세요.', true);
    if (ig) ig.focus();
  }

  function startGoogle(){
    var auth = initFirebase();
    if (!auth) { showMsg('구글 인증 모듈을 불러오는 중입니다. 잠시 후 다시 눌러 주세요.'); return; }
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

  // 2) Kakao (JavaScript SDK OAuth authorize -> kauth token -> kapi user/me)
  function ensureKakao(){
    if (!window.Kakao) return false;
    if (!Kakao.isInitialized()) Kakao.init(KAKAO_JS_KEY);
    return true;
  }

  function startKakao(){
    if (!ensureKakao() || !Kakao.Auth || !Kakao.Auth.authorize) {
      // SDK 로드 실패 시 직접 OAuth URL 이동
      var st = 'kakao_' + Date.now();
      try { sessionStorage.setItem('dia_oauth_state', st); } catch(e){}
      location.href = 'https://kauth.kakao.com/oauth/authorize?client_id=' + encodeURIComponent(KAKAO_JS_KEY)
        + '&redirect_uri=' + encodeURIComponent(CALLBACK_URL)
        + '&response_type=code&state=' + encodeURIComponent(st);
      return;
    }
    var st = 'kakao_' + Date.now();
    try { sessionStorage.setItem('dia_oauth_state', st); } catch(e){}
    Kakao.Auth.authorize({ redirectUri: CALLBACK_URL, state: st });
  }

  function handleKakaoCode(code){
    showMsg('카카오 로그인 확인 중입니다...', true);
    var body = 'grant_type=authorization_code'
      + '&client_id=' + encodeURIComponent(KAKAO_JS_KEY)
      + '&redirect_uri=' + encodeURIComponent(CALLBACK_URL)
      + '&code=' + encodeURIComponent(code);
    fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
      body: body
    }).then(function(r){ return r.json(); }).then(function(tok){
      if (!tok || !tok.access_token) {
        showMsg('카카오 인증 토큰을 받지 못했습니다. 다시 시도해 주세요.');
        return;
      }
      return fetch('https://kapi.kakao.com/v2/user/me', {
        headers: { 'Authorization': 'Bearer ' + tok.access_token }
      }).then(function(r){ return r.json(); }).then(function(me){
        var acc = (me && me.kakao_account) || {};
        var prof = (acc && acc.profile) || (me && me.properties) || {};
        var name = prof.nickname || ('카카오회원_' + String((me && me.id) || '').slice(-4));
        var email = acc.email || '';
        completeSnsLogin('kakao', 'kakao:' + ((me && me.id) || name), name, email);
      });
    }).catch(function(){
      showMsg('카카오 로그인 확인 중 오류가 발생했습니다. 다시 시도해 주세요.');
    });
  }

  // 3) Naver (Naver JS SDK Implicit Token -> getLoginStatus)
  function initNaverHidden(){
    if (!window.naver || !naver.LoginWithNaverId) return null;
    if (!document.getElementById('naverIdLogin')) {
      var div = document.createElement('div');
      div.id = 'naverIdLogin';
      div.style.display = 'none';
      document.body.appendChild(div);
    }
    var n = new naver.LoginWithNaverId({
      clientId: NAVER_CLIENT_ID,
      callbackUrl: CALLBACK_URL,
      isPopup: false,
      loginButton: { color: 'green', type: 1, height: 40 }
    });
    n.init();
    return n;
  }

  function startNaver(){
    var st = 'naver_' + Date.now();
    try { sessionStorage.setItem('dia_oauth_state', st); } catch(e){}
    location.href = 'https://nid.naver.com/oauth2.0/authorize?response_type=token'
      + '&client_id=' + encodeURIComponent(NAVER_CLIENT_ID)
      + '&redirect_uri=' + encodeURIComponent(CALLBACK_URL)
      + '&state=' + encodeURIComponent(st);
  }

  function handleNaverCallback(){
    if (location.hash.indexOf('access_token=') < 0) return;
    var n = initNaverHidden();
    if (!n) return;
    showMsg('네이버 로그인 확인 중입니다...', true);
    n.getLoginStatus(function(status){
      if (status && n.user) {
        var name = n.user.getNickName() || n.user.getName() || '네이버회원';
        var email = n.user.getEmail() || '';
        var id = n.user.getId() || email || name;
        completeSnsLogin('naver', 'naver:' + id, name, email);
      } else {
        showMsg('네이버 로그인 정보를 불러오지 못했습니다. (개발 중 상태에서는 등록된 관리자/테스터 계정만 로그인됩니다.)');
      }
    });
  }

  function bind(){
    // Google redirect callback
    var auth = initFirebase();
    if (auth) {
      auth.getRedirectResult().then(function(res){
        if (res && res.user) onGoogleUser(res.user);
      }).catch(function(){});
    }

    // Kakao callback (?code=...&state=kakao_...)
    var sp = new URLSearchParams(location.search);
    var code = sp.get('code');
    var state = sp.get('state') || '';
    if (code && state.indexOf('kakao_') === 0) {
      try { history.replaceState(null, '', location.pathname); } catch(e){}
      handleKakaoCode(code);
    }

    // Naver callback (#access_token=...)
    if (location.hash.indexOf('access_token=') >= 0) {
      handleNaverCallback();
    }

    // Button bindings
    var gBtns = document.querySelectorAll('[data-sns="google"], .btn-social.google');
    for (var i = 0; i < gBtns.length; i++) {
      gBtns[i].addEventListener('click', function(e){ e.preventDefault(); startGoogle(); });
    }
    var kBtns = document.querySelectorAll('[data-sns="kakao"], .btn-social.kakao');
    for (var j = 0; j < kBtns.length; j++) {
      kBtns[j].addEventListener('click', function(e){ e.preventDefault(); startKakao(); });
    }
    var nBtns = document.querySelectorAll('[data-sns="naver"], .btn-social.naver');
    for (var k = 0; k < nBtns.length; k++) {
      nBtns[k].addEventListener('click', function(e){ e.preventDefault(); startNaver(); });
    }
  }

  window.DiaAuth = {
    linkGoogleMember: function(nick){
      if (window.__diaPendingGoogleEmail && nick) {
        saveMap('google:' + window.__diaPendingGoogleEmail, nick);
      }
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
