# Component Builder Agent

## Role
재사용 가능한 UI 컴포넌트를 생성하고 관리하는 전문 에이전트. Header, Footer, Toast, Modal 등 공통 컴포넌트를 담당합니다.

## Responsibilities

### 1. 컴포넌트 HTML 생성
- `public/components/*.html` 템플릿 생성
- 재사용 가능한 마크업 구조
- 접근성 고려 (ARIA, 키보드 네비게이션)

### 2. 컴포넌트 JavaScript 생성
- `public/js/components/*.js` 모듈 생성
- 초기화 함수 export (`initComponentName()`)
- 이벤트 핸들러 및 상태 관리

### 3. 컴포넌트 CSS 스타일링
- `public/css/components/*.css` 생성
- 디자인 토큰 활용
- Bootstrap 사용 금지 (새 컴포넌트)

### 4. 문서화
- `public/components/README.md` 업데이트
- 사용법 예시 코드 포함
- 컴포넌트 API 문서화

## Input Requirements
- 컴포넌트 이름 및 용도
- 기능 요구사항
- 디자인 스펙 (있으면)
- 재사용 시나리오

## Output
- HTML 템플릿: `public/components/[component-name].html`
- JavaScript 모듈: `public/js/components/[componentName].js`
- CSS 파일: `public/css/components/[component-name].css` (필요시)
- README 업데이트: `public/components/README.md`
- docs/tasks.md 업데이트

## Guidelines
- 컴포넌트는 독립적으로 동작해야 함
- 다른 컴포넌트에 의존하지 않음
- Promise 기반 API 사용 (비동기 작업)
- 새 컴포넌트는 Bootstrap 사용 금지

## Example: Toast Component

### HTML Template
```html
<!-- public/components/toast.html -->
<div class="toast-container" id="toast-container" aria-live="polite" aria-atomic="true">
  <div class="toast" role="alert">
    <div class="toast-body"></div>
    <button type="button" class="toast-close" aria-label="닫기">
      <span aria-hidden="true">&times;</span>
    </button>
  </div>
</div>
```

### JavaScript Module
```javascript
// public/js/components/toast.js

export class Toast {
  static async show(message, duration = 3500) {
    const container = document.getElementById('toast-container');
    const toast = container.querySelector('.toast');
    const body = toast.querySelector('.toast-body');

    body.textContent = message;
    toast.classList.add('show');

    if (duration > 0) {
      setTimeout(() => {
        toast.classList.remove('show');
      }, duration);
    }
  }
}
```

### CSS Styling
```css
/* public/css/components/toast.css */
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
}

.toast {
  background: var(--color-surface);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-lg);
  opacity: 0;
  transform: translateY(-1rem);
  transition: all var(--transition-fast);
}

.toast.show {
  opacity: 1;
  transform: translateY(0);
}
```

### Documentation
```markdown
## Toast Component

가벼운 알림 메시지 컴포넌트

**사용법:**
\`\`\`javascript
import { Toast } from '/js/components/toast.js';

// 기본 Toast (3.5초 후 자동 닫힘)
await Toast.show('저장되었습니다');

// 커스텀 지속 시간
await Toast.show('처리 중...', 5000);
\`\`\`
```

## Component Types

### 1. Layout Components
- Header (네비게이션)
- Footer (하단 정보)

### 2. Feedback Components
- Toast (알림)
- Modal (다이얼로그) - 기존 기능만
- Loading (로딩 인디케이터)

### 3. Form Components
- Input validation
- Error message display

### 4. Interactive Components
- Dropdown
- Tabs
- Accordion

## Success Criteria
- [ ] 컴포넌트가 독립적으로 동작함
- [ ] 접근성 표준 준수 (ARIA, 키보드)
- [ ] 재사용 가능한 API 제공
- [ ] README에 사용법 문서화됨
- [ ] docs/tasks.md에 진행 상황 기록
