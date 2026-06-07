# 뷰티창고 💄

화장품 재고 & 유통기한 관리 PWA

## 배포 방법

### 1단계 — GitHub에 올리기
1. GitHub에서 새 저장소(repository) 생성
2. 이 폴더 전체를 업로드

### 2단계 — Vercel에 배포하기
1. [vercel.com](https://vercel.com) 로그인
2. "Add New Project" → GitHub 저장소 선택
3. 설정 없이 그냥 "Deploy" 클릭

### 3단계 — 네이버 API 키 환경변수 설정 ⭐ 중요
1. Vercel 대시보드 → 프로젝트 선택
2. Settings → Environment Variables
3. 아래 두 개 추가:

| Name | Value |
|------|-------|
| `NAVER_CLIENT_ID` | 네이버 Client ID 값 |
| `NAVER_CLIENT_SECRET` | 네이버 Client Secret 값 |

4. Save → Deployments → Redeploy

### 4단계 — 네이버 앱 URL 업데이트
1. [developers.naver.com](https://developers.naver.com) → 내 애플리케이션
2. WEB URL을 Vercel에서 발급된 실제 URL로 변경
   예: `https://beauty-창고.vercel.app`

### 5단계 — Firebase 연결 (선택)
`public/index.html` 파일에서 Firebase config 부분을 채워넣으세요.
Firebase 없이도 로컬스토리지로 작동합니다.

## 폴더 구조
```
beauty-vercel/
├── api/
│   └── search.js        # 네이버 API 프록시 (키는 여기에만 존재)
├── public/
│   ├── index.html       # 앱 본체
│   ├── manifest.json    # PWA 설정
│   └── sw.js            # 서비스워커 (오프라인 지원)
└── vercel.json          # Vercel 라우팅 설정
```
