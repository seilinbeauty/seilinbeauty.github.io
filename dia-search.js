(function(w){
  var CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  function norm(t){
    return String(t || '').toLowerCase().replace(/[^0-9a-z가-힣ㄱ-ㅎ]/g, '');
  }
  function toCho(t){
    var out = '';
    t = String(t || '');
    for(var i = 0; i < t.length; i++){
      var c = t.charCodeAt(i);
      if(c >= 0xAC00 && c <= 0xD7A3){
        out += CHO.charAt(Math.floor((c - 0xAC00) / 588));
      } else {
        out += t.charAt(i);
      }
    }
    return out;
  }
  function isJamoOnly(t){
    return /^[ㄱ-ㅎ]+$/.test(t);
  }

  // 영문 단어/상호 -> 한국어 발음 매핑
  var DICT = {
    'seilin': ['세이린'],
    'beauty': ['뷰티'],
    'beuty': ['뷰티'],
    'beu': ['뷰'],
    'ty': ['티'],
    'beu_ty': ['뷰티'],
    'beu_ty_j': ['뷰티제이'],
    'beutyj': ['뷰티제이'],
    '6eauty': ['뷰티'],
    'brow': ['브로우', '부로우'],
    'brows': ['브로우즈', '브로우'],
    'lash': ['래쉬', '래시', '레쉬'],
    'nail': ['네일'],
    'naill': ['네일'],
    'nuel': ['누엘'],
    'studio': ['스튜디오'],
    'studios': ['스튜디오'],
    'salon': ['살롱'],
    'waxing': ['왁싱'],
    'wxaing': ['왁싱'],
    'academy': ['아카데미'],
    'scalp': ['스칼프', '두피'],
    'aesthetic': ['에스테틱'],
    'atelier': ['아틀리에'],
    'extension': ['익스텐션'],
    'official': ['오피셜'],
    'seoul': ['서울'],
    'scalp': ['스칼프'],
    'plan': ['플랜'],
    'point': ['포인트'],
    'line': ['라인'],
    'time': ['타임'],
    'days': ['데이즈'],
    'day': ['데이'],
    'ink': ['잉크'],
    'lip': ['립'],
    'eye': ['아이'],
    'bari': ['바리'],
    'lusom': ['루솜'],
    'bins': ['빈스'],
    'bonnie': ['보니'],
    'leeji': ['이지'],
    'novar': ['노바르', '노바'],
    'monde': ['몽드'],
    'once': ['원스'],
    'onii': ['오니'],
    'sio': ['시오'],
    'yoon': ['윤'],
    'yoony': ['유니'],
    'yeogi': ['여기'],
    'needu': ['니쥬', '니드유', '니두'],
    'youux': ['유우', '유우스', '유우엑스'],
    'youu': ['유우'],
    'smp': ['에셈피'],
    'clover': ['클로버'],
    'lumi': ['루미', '루미에'],
    'iumi': ['루미', '루미에', '이우미'],
    'llenar': ['예나르', '레나르'],
    'ming': ['밍'],
    '2um': ['이음'],
    'deepin': ['디핀', '딥인'],
    'row': ['로우'],
    'myu': ['뮤'],
    'jvely': ['제이블리', '제이벨리', '벨리'],
    'belle': ['벨', '르벨'],
    'llovee': ['러브'],
    'soie': ['소이에', '소이', '스와'],
    'star': ['별', '스타'],
    'myua': ['뮤아'],
    'brown': ['브라운'],
    'eveof': ['이브오브'],
    '5wol': ['오월'],
    'beau': ['보', '뷰'],
    'onne': ['온느'],
    'bella': ['벨라'],
    'domely': ['도멜리'],
    'dyeon': ['디연'],
    'haute': ['오트', '오뜨'],
    'ob': ['오브'],
    'hb': ['에이치비'],
    'reve': ['레브'],
    'lehee': ['르히', '리히'],
    'jiand': ['지앤', '지앤드'],
    'leego': ['리고'],
    'nanabella': ['나나벨라'],
    'nue': ['누에'],
    'chu': ['츄'],
    'yale': ['예일'],
    'year': ['이어'],
    'hion': ['히온', '하이온'],
    'jio': ['지오'],
    'dareuming': ['다르밍'],
    'ndd': ['앤디디'],
    'chaeum': ['채움'],
    'browe': ['브로우', '브로우이'],
    'min': ['민'],
    'idreamiin': ['아이드리밍', '아이드리민'],
    'uni': ['유니'],
    'soy': ['소이'],
    'and': ['앤드', '앤'],
    'muse': ['어나더뮤즈', '뮤즈'],
    'amuse': ['어나더뮤즈'],
    'long': ['롱'],
    'boutique': ['뷰띠끄', '부띠끄', '부티크'],
    'tique': ['띠끄', '티크'],
    'lodeur': ['로더', '로되르'],
    'luin': ['루인'],
    'ellido': ['엘리도'],
    'pium': ['피움'],
    'yuha': ['유하'],
    'reby': ['리바이', '레비'],
    'ddumi': ['뚜미'],
    'dene': ['드네', '데네'],
    'sina': ['시나브로', '시나'],
    'sinabr': ['시나브로'],
    'mellow': ['멜로우'],
    'mini': ['미니'],
    'eyelight': ['아이라이트'],
    'develo': ['디벨로'],
    'isooroom': ['아이수', '이수룸'],
    'isoo': ['아이수'],
    'room': ['룸'],
    'kyma': ['키마', '카이마'],
    'pmu': ['피엠유'],
    'jinee': ['지니'],
    'merry': ['메리'],
    'lyn': ['린'],
    'autumn': ['어텀'],
    'hiino': ['히노'],
    'dear': ['디어'],
    'dearmin': ['디어민'],
    'hagenna': ['하겐나'],
    'from': ['프롬'],
    'ur': ['유어', '유얼', '유알'],
    'beautying': ['뷰티잉'],
    'heeov': ['히오브'],
    'nar': ['나르'],
    'onoa': ['오노아'],
    'jlee': ['제이리'],
    'new': ['뉴'],
    'jelly': ['젤리'],
    'hev': ['헤브'],
    'shube': ['슈베'],
    'wuv': ['우브'],
    'ssolbling': ['쏠블링'],
    'oaru': ['오아루'],
    'wonz': ['원즈'],
    'rori': ['로리'],
    'dalibom': ['달리봄'],
    'cel': ['셀'],
    'black': ['블랙'],
    'city': ['시티'],
    'ella': ['엘라'],
    'labuna': ['라부나'],
    'la': ['라'],
    'bu': ['부'],
    'na': ['나'],
    'gangshop': ['강샵', '갱샵'],
    'gang': ['강', '갱'],
    'shop': ['샵'],
    'nudi': ['누디'],
    'hiu': ['히우'],
    'haerin': ['해린'],
    'jihye': ['지혜'],
    'kiiara': ['키아라'],
    'nuzzik': ['누찌크', '누직', '느직'],
    'noble': ['노블'],
    'label': ['라벨'],
    'hedini': ['헤디니'],
    'onend': ['원엔드'],
    'one': ['원'],
    'end': ['엔드'],
    'kr': ['케이알'],
    'nb': ['엔비'],
    'mj': ['메이'],
    'mubit': ['무빗'],
    'joy': ['조이'],
    'de': ['드']
  };

  var CHAR_KO = {
    a:'에이', b:'비', c:'씨', d:'디', e:'이', f:'에프', g:'지',
    h:'에이치', i:'아이', j:'제이', k:'케이', l:'엘', m:'엠', n:'엔',
    o:'오', p:'피', q:'큐', r:'알', s:'에스', t:'티', u:'유',
    v:'브이', w:'더블유', x:'엑스', y:'와이', z:'제트'
  };

  // 사전 키 길이 내림차순
  var DICT_KEYS = Object.keys(DICT).sort(function(a, b){ return b.length - a.length; });

  // 간단한 범용 영문->한글 음차 (사전에 없는 신규 영문 아이디 대비)
  function fallbackRomanize(word){
    var w0 = String(word || '').toLowerCase().replace(/[^a-z]/g, '');
    if(!w0) return '';
    // 자음/모음 초간단 매핑
    var map = [
      ['sh', 'ㅅ'], ['ch', 'ㅊ'], ['th', 'ㅅ'], ['ph', 'ㅍ'], ['ng', 'ㅇ'],
      ['a','ㅇ'],['e','ㅇ'],['i','ㅇ'],['o','ㅇ'],['u','ㅇ'],['y','ㅇ'],
      ['b','ㅂ'],['c','ㅋ'],['d','ㄷ'],['f','ㅍ'],['g','ㄱ'],['h','ㅎ'],
      ['j','ㅈ'],['k','ㅋ'],['l','ㄹ'],['m','ㅁ'],['n','ㄴ'],['p','ㅍ'],
      ['q','ㅋ'],['r','ㄹ'],['s','ㅅ'],['t','ㅌ'],['v','ㅂ'],['w','ㅇ'],
      ['x','ㅅ'],['z','ㅈ']
    ];
    var out = '';
    for(var i = 0; i < w0.length; ){
      var matched = false;
      for(var j = 0; j < map.length; j++){
        var k = map[j][0];
        if(w0.slice(i, i + k.length) === k){
          out += map[j][1];
          i += k.length;
          matched = true;
          break;
        }
      }
      if(!matched) i++;
    }
    return out;
  }

  function expandEngToKo(raw){
    var s = String(raw || '').toLowerCase();
    if(!/[a-z]/.test(s)) return [];
    var out = [];
    // 구분자(_, ., /, 공백)로 쪼개진 토큰 + 붙어있는 긴 토큰 모두 처리
    var tokens = s.split(/[^a-z0-9]+/).filter(Boolean);
    var joined = s.replace(/[^a-z0-9]+/g, '');
    if(joined && tokens.length > 1) tokens.push(joined);
    var fullJoined = [];
    tokens.forEach(function(tok){
      var parts = [];
      var rest = tok;
      while(rest.length){
        var hit = false;
        for(var i = 0; i < DICT_KEYS.length; i++){
          var dk = DICT_KEYS[i];
          if(rest.indexOf(dk) === 0){
            parts.push(DICT[dk]);
            rest = rest.slice(dk.length);
            hit = true;
            break;
          }
        }
        if(!hit){
          // 단일 알파벳(j, b, k 등) 또는 나머지
          var ch = rest.charAt(0);
          if(CHAR_KO[ch]) parts.push([CHAR_KO[ch]]);
          rest = rest.slice(1);
        }
      }
      if(parts.length){
        // 각 파트의 첫 번째 발음 조합 + 전체 변형들 추가
        var mainStr = parts.map(function(p){ return p[0]; }).join('');
        out.push(mainStr);
        fullJoined.push(mainStr);
        parts.forEach(function(p){
          p.forEach(function(v){ out.push(v); });
        });
        if(parts.length >= 2){
          // 조합 2개씩도 허용
          var altStr = parts.map(function(p){ return p[p.length - 1]; }).join('');
          if(altStr !== mainStr) out.push(altStr);
        }
      }
      var fb = fallbackRomanize(tok);
      if(fb) out.push(fb);
    });
    if(fullJoined.length > 1) out.push(fullJoined.join(''));
    return out;
  }

  function buildKeys(arr){
    var keys = [];
    var seen = {};
    function add(v){
      var n = norm(v);
      if(n && n.length >= 1 && !seen[n]){
        seen[n] = true;
        keys.push(n);
      }
    }
    (arr || []).forEach(function(item){
      if(!item) return;
      var s = String(item);
      add(s);
      s.split(/[\/\s._-]+/).forEach(add);
      expandEngToKo(s).forEach(add);
    });
    return keys;
  }

  function matchKeys(keys, rawQuery){
    var q = norm(rawQuery);
    if(!q) return 1;
    var jamo = isJamoOnly(q);
    var best = 0;
    for(var i = 0; i < keys.length; i++){
      var k = keys[i];
      if(jamo){
        var ch = toCho(k);
        if(ch.indexOf(q) >= 0){
          best = Math.max(best, k.length + (ch === q ? 50 : 0));
        }
      } else {
        if(k.indexOf(q) >= 0){
          best = Math.max(best, k.length + (k === q ? 50 : 0));
        }
      }
    }
    return best;
  }

  w.DIA_SEARCH = {
    norm: norm,
    toCho: toCho,
    isJamoOnly: isJamoOnly,
    buildKeys: buildKeys,
    matchKeys: matchKeys
  };
})(window);
