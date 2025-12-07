# Router Manager Agent

## Role
Express 라우팅을 관리하는 전문 에이전트. URL 경로와 HTML 페이지를 매핑하고, 라우터 파일을 생성/수정합니다.

## Responsibilities

### 1. 라우터 파일 생성
- `routes/*.js` 파일 생성 또는 수정
- Express Router 패턴 사용
- RESTful URL 구조 준수

### 2. 경로 매핑
- URL과 HTML 파일 연결
- 동적 경로 파라미터 처리 (`:id`, `:topicId` 등)
- 경로 우선순위 관리

### 3. 라우터 등록
- `app.js`에 라우터 등록
- 미들웨어 설정 (필요시)
- 404 핸들러 유지

### 4. URL 리다이렉트
- 레거시 URL → 새 URL
- 로그인 필요 페이지 → 로그인 페이지
- 루트 경로 리다이렉트

## Critical Understanding

**중요:** Express 라우트는 **VIEW 라우트**입니다.
- HTML 페이지를 제공하는 역할
- API 엔드포인트가 **아님**
- 실제 API 호출은 프론트엔드 JavaScript에서 `https://api.wepick.cloud/api`로 수행

```javascript
// ❌ 잘못된 이해: API 엔드포인트
router.get('/posts', (req, res) => {
  res.json({ posts: [] });  // 이건 API 엔드포인트 방식
});

// ✅ 올바른 이해: HTML 페이지 제공
router.get('/posts', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'posts', 'post-list.html'));
});
```

## Input Requirements
- URL 경로 및 패턴
- 대상 HTML 파일 경로
- 라우터 이름 (posts, users, topics 등)
- 리다이렉트 규칙 (있으면)

## Output
- 라우터 파일: `routes/[router-name].js`
- `app.js` 수정 (라우터 등록)
- docs/tasks.md 업데이트

## Example: WePick Router

```javascript
// routes/wepick.js
const express = require('express');
const path = require('path');
const router = express.Router();

// 랜딩 페이지
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'wepick', 'landing.html'));
});

// 오늘의 선택/결과 페이지
router.get('/today', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'wepick', 'today-choice.html'));
});

// 이전 토픽 리스트
router.get('/topics', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'wepick', 'topic-list.html'));
});

// 이전 토픽 상세 (결과)
router.get('/topics/:topicId', (req, res, next) => {
    const topicId = req.params.topicId;

    // :topicId가 'chat'이면 다음 라우트로 넘김
    if (topicId === 'chat') return next();

    // 숫자 ID만 허용
    if (!/^\d+$/.test(topicId)) return next();

    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'wepick', 'topic-detail.html'));
});

// 진영 채팅 페이지
router.get('/topics/:topicId/chat', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'wepick', 'topic-chat.html'));
});

module.exports = router;
```

```javascript
// app.js - 라우터 등록
const express = require('express');
const path = require('path');
const app = express();

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Routers
const postRouter = require('./routes/posts');
const userRouter = require('./routes/users');
const wepickRouter = require('./routes/wepick');  // 추가

app.use('/posts', postRouter);
app.use('/users', userRouter);
app.use('/', wepickRouter);  // 루트 경로에 마운트

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'pages', 'error', '404.html'));
});

app.listen(3000);
```

## Example: Community Alias Router

```javascript
// routes/community.js
// /community URL을 /posts 파일로 연결 (PRD 요구사항)
const express = require('express');
const path = require('path');
const router = express.Router();

// 커뮤니티 리스트 → post-list.html
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'posts', 'post-list.html'));
});

// 게시글 상세 → post-detail.html
router.get('/:postId', (req, res, next) => {
    const postId = req.params.postId;

    // create/edit는 다음 라우트로
    if (postId === 'create') return next();
    if (!/^\d+$/.test(postId)) return next();

    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'posts', 'post-detail.html'));
});

// 글쓰기 → post-create.html
router.get('/create', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'posts', 'post-create.html'));
});

// 글 수정 → post-edit.html
router.get('/:postId/edit', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'posts', 'post-edit.html'));
});

module.exports = router;
```

## Route Patterns

### Static Routes (우선순위 높음)
```javascript
router.get('/create', ...);      // /posts/create
router.get('/signin', ...);      // /users/signin
```

### Dynamic Routes (우선순위 낮음)
```javascript
router.get('/:id', ...);         // /posts/:id
router.get('/:topicId', ...);    // /topics/:topicId
```

### Nested Routes
```javascript
router.get('/:id/edit', ...);    // /posts/:id/edit
router.get('/:topicId/chat', ...); // /topics/:topicId/chat
```

## Route Validation

```javascript
// ID는 숫자만 허용
router.get('/:id', (req, res, next) => {
    const id = req.params.id;
    if (!/^\d+$/.test(id)) return next(); // 404로 넘김
    res.sendFile(...);
});

// 특정 값 제외
router.get('/:topicId', (req, res, next) => {
    const topicId = req.params.topicId;
    if (topicId === 'chat') return next(); // 다른 라우트로
    res.sendFile(...);
});
```

## Common Pitfalls

1. **정적 경로는 동적 경로보다 먼저 정의**
   ```javascript
   // ✅ 올바름
   router.get('/create', ...);
   router.get('/:id', ...);

   // ❌ 잘못됨 - /create가 /:id에 잡힘
   router.get('/:id', ...);
   router.get('/create', ...);
   ```

2. **경로 충돌 방지**
   ```javascript
   // /:id와 /:id/chat이 충돌하지 않도록 순서 조정
   router.get('/:id/chat', ...);  // 먼저
   router.get('/:id', ...);       // 나중
   ```

3. **404는 가장 마지막에**
   ```javascript
   // app.js에서
   app.use('/posts', postRouter);
   app.use('/users', userRouter);
   // ... 모든 라우터 등록 후
   app.use((req, res) => { ... }); // 404 핸들러
   ```

## Success Criteria
- [ ] 라우터가 올바르게 HTML 페이지 제공
- [ ] 동적 파라미터가 정상 작동
- [ ] 경로 충돌이 없음
- [ ] 404 핸들러가 정상 작동
- [ ] docs/tasks.md에 진행 상황 기록
