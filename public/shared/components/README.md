# 공용 컴포넌트 (Bootstrap 5.3.8 기반)

이 디렉토리는 애플리케이션 전체에서 재사용 가능한 HTML 컴포넌트를 포함합니다.

## 📁 컴포넌트 목록

### 1. Header (header.html)

네비게이션 헤더 컴포넌트

**사용법:**

```html
<!-- HTML 페이지에 컨테이너 추가 -->
<header></header>
```

```javascript
// JavaScript에서 초기화
import { initHeader } from "/js/components/header.js";

await initHeader("page-id");
```

**기능:**

- 뒤로가기 버튼
- 브랜드 로고/타이틀 (클릭 시 홈으로 이동)
- 프로필 드롭다운 메뉴
- 로그아웃 기능

---

### 2. Footer (footer.html)

페이지 하단 푸터 컴포넌트

**사용법:**

```html
<!-- HTML 페이지에 컨테이너 추가 -->
<footer></footer>
```

```javascript
// JavaScript에서 초기화
import { initFooter } from "/js/components/footer.js";

await initFooter();
```

**기능:**

- 브랜드 정보
- 바로가기 링크
- 저작권 정보

---

### 3. Modal

동적으로 생성되는 모달 다이얼로그 (alert/confirm/prompt 대체)

**사용법:**

```javascript
import { Modal } from "/js/components/modal.js";

// Alert
await Modal.alert("제목", "메시지");

// Confirm
const confirmed = await Modal.confirm("제목", "확인하시겠습니까?");
if (confirmed) {
  // 확인 처리
}

// Prompt
const value = await Modal.prompt("제목", "입력하세요", "기본값");
if (value !== null) {
  // 입력값 처리
}

// Custom Modal
await Modal.custom({
  title: "커스텀 모달",
  body: "<p>커스텀 내용</p>",
  buttons: [
    {
      text: "취소",
      className: "btn-secondary",
      onClick: () => false,
    },
    {
      text: "확인",
      className: "btn-primary",
      onClick: () => true,
    },
  ],
});
```

**특징:**

- Promise 기반 인터페이스
- Bootstrap Modal 래퍼
- 접근성 지원 (ARIA 속성)
- 키보드 네비게이션 (ESC, Enter)
- HTML 템플릿 없이 JS에서 동적 생성

---

### 4. Toast

가벼운 알림 메시지

**사용법:**

```javascript
import { Toast } from "/js/components/toast.js";

// Success Toast
Toast.success("저장되었습니다");

// Error Toast
Toast.error("오류가 발생했습니다");

// Info Toast
Toast.info("정보 메시지");

// Warning Toast
Toast.warning("경고 메시지");

// 커스텀 지속 시간
Toast.success("메시지", 5000);
```

**특징:**

- 여러 Toast 동시 표시 가능
- 자동 닫힘 기능 (기본 3초)
- 우측 상단에 표시
- 부드러운 애니메이션
- HTML 템플릿 없이 JS에서 동적 생성

---

### 5. Gauge Bar

재사용 가능한 VS 게이지 바 컴포넌트 (Bootstrap 독립형)

**사용법:**

```html
<!-- CSS 포함 -->
<link rel="stylesheet" href="/css/components/gauge-bar.css" />

<!-- HTML 컴포넌트 -->
<div class="gauge-bar-component">
  <div class="gauge-percentages">
    <div class="gauge-percentage-item gauge-percentage-a">
      <div class="gauge-option-label">Option A</div>
      <div class="gauge-option-percentage" data-option="a">50%</div>
    </div>
    <div class="gauge-percentage-item gauge-percentage-b">
      <div class="gauge-option-percentage" data-option="b">50%</div>
      <div class="gauge-option-label">Option B</div>
    </div>
  </div>
  <div class="gauge-progress-bar">
    <div class="gauge-bar-fill" data-fill="a"></div>
  </div>
</div>

<!-- JavaScript -->
<script src="/js/components/gauge-bar.js"></script>
<script>
  const gauge = new GaugeBar('.gauge-bar-component', {
    percentageA: 60,
    percentageB: 40,
    animate: true
  });
</script>
```

**기능:**

- 실시간 퍼센트 업데이트
- 부드러운 애니메이션
- 자동 업데이트 모드 (랜덤 시뮬레이션)
- 크기 변형 (small, medium, large)
- 완전 반응형

**API:**

```javascript
// 수동 업데이트
gauge.update(55, 45);

// 자동 업데이트 시작
gauge.startAutoUpdate(4000); // 4초마다

// 자동 업데이트 중지
gauge.stopAutoUpdate();

// 정리
gauge.destroy();
```

---

## 🎨 스타일링

모든 컴포넌트는 Bootstrap 5.3.8 클래스를 사용하며, 추가 커스텀 스타일은 `/css/custom.css`에 정의되어 있습니다.

### 커스텀 CSS 변수

```css
:root {
  --bs-primary: #3b82f6;
  --bs-border-radius: 8px;
  --transition-fast: 0.15s ease;
  --color-bg-hover: #f3f4f6;
}
```

---

## ♿ 접근성

모든 컴포넌트는 웹 접근성 표준을 준수합니다:

- ARIA 속성 (aria-label, aria-expanded, aria-hidden)
- 키보드 네비게이션 지원
- 포커스 관리
- 스크린 리더 호환

---

## 📦 의존성

- **Bootstrap 5.3.8**: CSS 및 JavaScript
- **Bootstrap Icons**: 아이콘 (선택사항)

---

## 🔧 개발 가이드

### 새 컴포넌트 추가하기

1. HTML 템플릿 생성: `public/components/component-name.html`
2. JavaScript 모듈 생성: `public/js/components/componentName.js`
3. CSS 스타일 추가: `public/css/custom.css`
4. 이 README에 문서 추가

### 컴포넌트 설계 원칙

- **재사용성**: 여러 페이지에서 사용 가능해야 함
- **독립성**: 다른 컴포넌트에 의존하지 않아야 함
- **접근성**: WCAG 2.1 AA 수준 준수
- **성능**: 최소한의 DOM 조작
- **Bootstrap 우선**: 가능한 Bootstrap 컴포넌트 활용

---

## 📝 변경 이력

- **2024-12-08**: 사용하지 않는 컴포넌트 정리
  - 삭제: `modal-template.html`, `toast-template.html`, `gauge-bar.html` (JS에서 동적 생성)
  - 삭제: `dropdown.js`, `skeleton.js` (사용하지 않음)
  - `loading.js`는 `api/base.js`에서 사용 중이므로 유지
- **2024-11**: Bootstrap 5.3.8 기반으로 리팩토링
  - Header: Navbar 컴포넌트 적용
  - Footer: 새로 추가
  - Modal/Toast: 템플릿 문서화
