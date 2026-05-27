# StockLens AI — 설정 가이드

## 1. 환경변수 설정

`.env.local.example`을 복사하여 `.env.local` 파일 생성 후 값 입력:

```bash
cp .env.local.example .env.local
```

| 변수명 | 필수 | 설명 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (DB 쓰기용) |
| `ANTHROPIC_API_KEY` | ✅ | Claude AI 분석용 |
| `DART_API_KEY` | ⬜ | [DART OpenAPI](https://opendart.fss.or.kr) 공시 수집 |
| `FINNHUB_API_KEY` | ⬜ | [Finnhub](https://finnhub.io) 해외 뉴스 |
| `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET` | ⬜ | [네이버 개발자센터](https://developers.naver.com) 검색 API |
| `COLLECT_SECRET` | ✅ | GitHub Actions 인증용 임의 문자열 |

## 2. Supabase DB 초기화

Supabase 대시보드 → SQL Editor에서 `supabase/schema.sql` 전체 실행

## 3. 로컬 개발 실행

```bash
npm run dev
# http://localhost:3000 접속
```

## 4. Vercel 배포

```bash
npx vercel --prod
```

Vercel 대시보드 → Settings → Environment Variables에 위 변수 모두 추가

## 5. GitHub Actions 설정

GitHub 저장소 → Settings → Secrets and variables → Actions:

| 시크릿 | 값 |
|--------|-----|
| `APP_URL` | Vercel 배포 URL (예: `https://your-app.vercel.app`) |
| `COLLECT_SECRET` | `.env.local`의 `COLLECT_SECRET`와 동일한 값 |

## 6. 수동 수집 테스트

배포 후 수동으로 뉴스 수집을 트리거할 수 있습니다:

```bash
# 아침 수집 테스트
curl -X POST https://your-app.vercel.app/api/collect \
  -H "Content-Type: application/json" \
  -H "x-collect-secret: YOUR_SECRET" \
  -d '{"slot":"morning"}'
```

또는 GitHub Actions 탭에서 각 워크플로우를 수동 실행(Run workflow)

## 7. 자동 수집 일정

| 시간 (KST) | 워크플로우 | 수집 범위 |
|-----------|-----------|----------|
| 08:00 | morning-collect.yml | 전날 16:00 ~ 당일 08:00 |
| 14:30 | afternoon-collect.yml | 당일 09:00 ~ 14:00 (평일만) |
| 16:10 | closing-analysis.yml | 종가 비교 분석 (평일만) |

## 8. DART 고유번호 조회

[DART 기업 검색](https://dart.fss.or.kr)에서 종목 검색 후 URL의 `corp_code` 값 확인
또는 DART API: `https://opendart.fss.or.kr/api/company.json?crtfc_key=YOUR_KEY&corp_name=삼성전자`
