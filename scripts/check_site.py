#!/usr/bin/env python3
"""배포 전 전 페이지 무결성 자동 검수 스크립트 (UI·JS·참조파일 잠금 장치)"""
import glob, os, re, sys
import esprima

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

TARGET_HTML = sorted([
    p for p in glob.glob("*.html")
    if p in ("index.html", "board.html", "book.html") or p.startswith("dia")
])

errors = []
checked_js = 0

def check_js_syntax(code, label):
    global checked_js
    checked_js += 1
    try:
        esprima.parseScript(code, {"tolerant": False})
    except Exception as e:
        errors.append(f"[JS 문법 오류] {label}: {str(e).splitlines()[0]}")

# 1. 외부 JS 파일 문법 검사
for js in sorted(glob.glob("*.js")):
    with open(js, encoding="utf-8", errors="ignore") as f:
        check_js_syntax(f.read(), js)

# 2. HTML 페이지별 검사
for html_path in TARGET_HTML:
    with open(html_path, encoding="utf-8", errors="ignore") as f:
        html = f.read()

    # 2-1. ?pc=1 스크립트 포함 여부 (viewport 있는 페이지만)
    if re.search(r'<meta\s+name=["\']viewport["\']', html, re.I):
        if 'data-dia-pc="1"' not in html:
            errors.append(f"[PC 보기 누락] {html_path}: data-dia-pc=\"1\" 없음")

    # 2-2. 인라인 <script> 문법 검사
    for idx, m in enumerate(re.finditer(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', html, re.S | re.I), 1):
        body = m.group(1).strip()
        if not body:
            continue
        tag = m.group(0)[:120].lower()
        if "ld+json" in tag:
            continue
        check_js_syntax(body, f"{html_path}#script{idx}")

    # 2-3. 로컬 src/href 참조 파일 존재 여부
    for ref in re.findall(r'(?:src|href)=["\']([^"\'?#]+)', html, re.I):
        if re.match(r'^(https?:|data:|mailto:|tel:|javascript:|#)', ref, re.I):
            continue
        chk = ref.lstrip("/")
        if chk and not os.path.exists(chk):
            errors.append(f"[파일 누락 404] {html_path} -> {ref}")

    # 2-4. dia-sub-header 적용 페이지 헤더 일관성 체크
    if "dia-sub-header.css" in html and "dia-sub-header.js" not in html:
        errors.append(f"[헤더 불일치] {html_path}: dia-sub-header.css는 있으나 dia-sub-header.js 없음")

print(f"검사 대상 HTML: {len(TARGET_HTML)}개 / JS 검증: {checked_js}개")
if errors:
    print(f"오류 {len(errors)}건 발견:")
    for e in errors[:30]:
        print(" -", e)
    sys.exit(1)
else:
    print("전 페이지 무결성 검사 통과 (오류 0건)")
