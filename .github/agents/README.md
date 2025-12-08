# WePick Sub Agents

이 디렉토리는 WePick 프로젝트의 전문화된 Sub Agent 정의를 포함합니다.

## 📋 Agent 목록

### 1. [Page Builder](./page-builder.md)
**역할:** 새로운 페이지 구축 (HTML, CSS, JavaScript)

**사용 시점:**
- 새 페이지 생성이 필요할 때
- 랜딩, /today, 토픽 리스트/상세, 채팅 페이지 등

**주요 책임:**
- HTML 구조 생성
- CSS 스타일링 (Bootstrap 없이)
- JavaScript 로직 구현
- Express 라우팅 설정

---

### 2. [API Integrator](./api-integrator.md)
**역할:** 백엔드 API 연동 및 mock 데이터 처리

**사용 시점:**
- 새 API 엔드포인트 연동이 필요할 때
- API 모듈 생성 (`public/js/api/*.js`)
- Mock 데이터로 UI 먼저 구현할 때

**주요 책임:**
- API 함수 구현
- base.js 패턴 사용
- 에러 처리
- Mock 데이터 제공

---

### 3. [Component Builder](./component-builder.md)
**역할:** 재사용 가능한 UI 컴포넌트 생성

**사용 시점:**
- 공통 컴포넌트 필요 시 (Header, Footer, Toast 등)
- 여러 페이지에서 재사용할 UI 요소
- Bootstrap 없는 새 컴포넌트

**주요 책임:**
- 컴포넌트 HTML 템플릿
- 컴포넌트 JavaScript 모듈
- 컴포넌트 CSS 스타일
- 문서화

---

### 4. [UI Stylist](./ui-stylist.md)
**역할:** CSS 스타일링, 애니메이션, 디자인 시스템 관리

**사용 시점:**
- 디자인 토큰 관리
- CSS 애니메이션 구현
- 반응형 레이아웃
- Bootstrap 마이그레이션

**주요 책임:**
- 디자인 토큰 정의
- CSS 애니메이션 vs 이미지 판단
- 반응형 레이아웃
- 일관된 스타일 가이드

---

### 5. [Router Manager](./router-manager.md)
**역할:** Express 라우팅 설정 및 관리

**사용 시점:**
- 새 URL 경로 추가
- 라우터 파일 생성/수정
- URL 리다이렉트 설정

**주요 책임:**
- Express Router 파일 생성
- 경로 매핑 (URL ↔ HTML)
- app.js에 라우터 등록
- 경로 충돌 방지

---

### 6. [Task Tracker](./task-tracker.md)
**역할:** 작업 진행 상황 추적 및 관리

**사용 시점:**
- **모든 작업 세션** (필수)
- 세션 시작/종료 시
- 작업 완료 시

**주요 책임:**
- docs/tasks.md 읽기/업데이트
- 진행률 계산
- 새 작업 추가
- 블로커/이슈 기록

---

## 🔄 Agent 협업 워크플로우

### 예시 1: 새 페이지 생성

```
1. Task Tracker → docs/tasks.md 읽고 다음 작업 확인
2. Page Builder → HTML/CSS/JS 구조 생성
3. Router Manager → Express 라우트 설정
4. API Integrator → 필요한 API 함수 생성 (또는 mock)
5. UI Stylist → CSS 스타일링 및 애니메이션
6. Task Tracker → docs/tasks.md 업데이트
```

### 예시 2: 컴포넌트 생성

```
1. Task Tracker → docs/tasks.md 읽기
2. Component Builder → 컴포넌트 HTML/JS/CSS 생성
3. UI Stylist → 디자인 토큰 적용 및 스타일 최적화
4. Task Tracker → docs/tasks.md 업데이트
```

### 예시 3: API 연동

```
1. Task Tracker → docs/tasks.md 읽기
2. API Integrator → API 함수 구현
3. Page Builder → 페이지에서 API 함수 호출
4. Task Tracker → docs/tasks.md 업데이트
```

---

## 📐 Agent 선택 가이드

### 상황별 Agent 선택

| 작업 유형 | Primary Agent | Supporting Agents |
|---------|---------------|-------------------|
| 새 페이지 생성 | Page Builder | Router Manager, API Integrator, UI Stylist |
| API 연동 | API Integrator | Page Builder |
| 컴포넌트 생성 | Component Builder | UI Stylist |
| CSS 작업 | UI Stylist | - |
| 라우팅 설정 | Router Manager | - |
| 진행 상황 기록 | Task Tracker | (모든 Agent) |

---

## 🎯 중요 원칙

### 1. Task Tracker는 필수
**모든 작업 세션에서 Task Tracker를 먼저 실행하여 `docs/tasks.md`를 확인하고 업데이트해야 합니다.**

### 2. Bootstrap 금지 (새 기능)
새 WePick 페이지는 Bootstrap 없이 `custom.css` 디자인 토큰을 사용합니다.

### 3. API는 base.js 사용
모든 API 호출은 `public/js/api/base.js`의 `apiRequest()` 함수를 사용해야 합니다.

### 4. Express 라우트는 VIEW
Express 라우트는 HTML을 제공하는 VIEW 라우트입니다. API 엔드포인트가 아닙니다.

### 5. 모달 금지 (새 기능)
새 기능에서는 모달 대신 Toast/인라인 메시지를 사용합니다.

---

## 📝 Agent 사용 예시

### Page Builder 호출
```
작업: 오늘의 선택 페이지 생성
입력:
  - 페이지 이름: 오늘의 선택/결과
  - URL: /today
  - PRD 참조: Section 2.1.1, 6.2
  - 디자인: docs/webdesign/today-choice.png
  - API: fetchTodayTopic(), submitVote()

출력:
  - public/pages/wepick/today-choice.html
  - public/js/pages/today.js
  - routes/wepick.js 업데이트
```

### API Integrator 호출
```
작업: Topics API 모듈 생성
입력:
  - 엔드포인트: /topics/today, /topics/:id/vote
  - Mock 여부: 일부 mock (checkUserVote)
  - 인증: 필요

출력:
  - public/js/api/topics.js
  - fetchTodayTopic(), submitVote(), checkUserVote()
```

### Task Tracker 호출
```
작업: 진행 상황 업데이트
입력:
  - 완료된 작업: 랜딩 페이지 HTML/CSS
  - 새 작업: Toast 컴포넌트 개선 필요
  - Phase: Phase 1

출력:
  - docs/tasks.md 업데이트
  - 진행률: Phase 1 20% (1/5)
```

---

## 🔧 Agent 확장

새로운 Agent가 필요한 경우:

1. 이 디렉토리에 `[agent-name].md` 생성
2. Agent 역할, 책임, 입출력 정의
3. 예시 코드 포함
4. 이 README에 Agent 추가

---

## 📚 관련 문서

- [CLAUDE.md](../../CLAUDE.md) - 전체 프로젝트 가이드
- [PRD](../../docs/prd.md) - 제품 요구사항 문서
- [Tasks](../../docs/tasks.md) - 작업 추적 문서
