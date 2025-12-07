# 🎯 WePick - 일상의 선택을 공유하는 커뮤니티

**WePick**은 매일 새로운 주제에 대해 A와 B 중 하나를 선택하고, 실시간으로 다른 사람들의 선택을 확인하며 의견을 나눌 수 있는 소셜 투표 플랫폼입니다.

<!-- TODO: 여기에 프로젝트 대표 이미지 또는 데모 영상 추가 -->
<!-- 권장: 랜딩 페이지 또는 "오늘의 선택" 화면 GIF (투표 → 결과 전환 과정) -->

## 🛠 Tech Stack

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

- **Frontend**: Vanilla JavaScript (ES6 Modules), CSS3, HTML5
- **Backend**: Express.js (MPA - Multi-Page Application)
- **UI Framework**: Bootstrap 5.3.8 (Legacy), Custom CSS (New Features)
- **Authentication**: HTTP-only Cookie
- **API Server**: `https://api.wepick.cloud/api`

---

## 🎨 화면 구성

### 1. 랜딩 페이지 (`/`)

![랜딩 페이지 스크린샷](./assets/docs/readme/imgs/landing.png)

### 2. 오늘의 선택 (`/today`)

![오늘의 선택 - 투표 전 화면 스크린샷](./assets/docs/readme/imgs/today.png)

### 3. 커뮤니티 게시판 (`/community` 또는 `/posts`)

![커뮤니티 게시판 - 게시글 리스트 화면 스크린샷](./assets/docs/readme/imgs/community.png)

### 4. 로그인/회원가입 (`/users/signin`, `/users/signup`)

<div style="display: flex; justify-content: center; gap: 20px;">
  <img src="./assets/docs/readme/imgs/login.png" alt="로그인 페이지 스크린샷" width="300"/>
  <img src="./assets/docs/readme/imgs/register.png" alt="회원가입 페이지 스크린샷" width="300"/>
</div>

### 5. 마이페이지 (`/users/mypage`)

![마이페이지 스크린샷](./assets/docs/readme/imgs/mypage.png)

### 6. 개발 중 페이지 (`/topics`, `/topics/:id/chat`)

![개발 중 페이지 스크린샷](./assets/docs/readme/imgs/deving.png)

---

## 📱 동영상

[구글 드라이브 링크](https://drive.google.com/file/d/1e_eifhW6RB9JiNBXwG_PDSp4VV77ieg-/view?usp=drive_link)

## ✨ 주요 기능

### 1. 오늘의 선택 (Today's Choice)

매일 새로운 주제에 대해 두 가지 선택지 중 하나를 고르고, 실시간으로 다른 사람들의 선택 결과를 확인할 수 있습니다.

<!-- TODO: 여기에 "오늘의 선택" 페이지 스크린샷 또는 GIF 추가 -->
<!-- 포함할 내용: 투표 전 화면 → 투표 버튼 클릭 → 결과 화면으로 전환되는 과정 -->

**특징:**

- 동적 UI 전환: 투표 전/후 화면이 페이지 새로고침 없이 자연스럽게 전환
- 실시간 결과: 투표 직후 퍼센티지 바 애니메이션으로 결과 표시
- 로그인 후 투표 가능 (비로그인 시 투표 버튼 클릭 → 로그인 페이지 리다이렉트)

### 2. 커뮤니티 게시판

자유롭게 글을 작성하고 댓글을 통해 소통할 수 있는 게시판 기능을 제공합니다.

<!-- TODO: 여기에 게시판 리스트 및 상세 페이지 스크린샷 추가 -->
<!-- 포함할 내용: 게시글 목록 → 게시글 상세 → 댓글 작성 화면 -->

**특징:**

- 게시글 CRUD (생성, 조회, 수정, 삭제)
- 댓글 시스템
- 무한 스크롤 페이지네이션
- 프로필 이미지 지원 (Presigned URL 업로드)

### 3. 마이페이지

개인정보를 관리하고 계정 설정을 변경할 수 있는 페이지입니다.

<!-- TODO: 여기에 마이페이지 스크린샷 추가 -->
<!-- 포함할 내용: 프로필 정보 영역 + 메뉴 리스트 (프로필 이미지/닉네임/비밀번호 변경) -->

**특징:**

- 프로필 이미지 변경
- 닉네임 변경
- 비밀번호 변경
- 계정 삭제
- 모바일 최적화된 세로 메뉴 레이아웃

### 4. 개발 중 기능 (Coming Soon)

현재 개발 진행 중인 기능들에 대한 안내 페이지를 제공합니다.

- 이전 토픽 리스트 (`/topics`)
- 토픽 상세 결과 (`/topics/:topicId`)
- 진영별 채팅 (`/topics/:topicId/chat`)

---

## 🔗 주요 라우트

### WePick 코어 기능

| 경로                    | 설명                       | 상태       |
| ----------------------- | -------------------------- | ---------- |
| `/`                     | 랜딩 페이지                | ✅ 완료    |
| `/today`                | 오늘의 선택/결과 (동적 UI) | ✅ 완료    |
| `/topics`               | 이전 토픽 리스트           | 🚧 개발 중 |
| `/topics/:topicId`      | 토픽 상세 결과             | 🚧 개발 중 |
| `/topics/:topicId/chat` | 진영별 채팅                | 🚧 개발 중 |

### 커뮤니티 (레거시)

| 경로                       | 설명                    |
| -------------------------- | ----------------------- |
| `/posts` 또는 `/community` | 게시글 목록             |
| `/posts/create`            | 게시글 작성 (인증 필요) |
| `/posts/:id`               | 게시글 상세             |
| `/posts/edit/:id`          | 게시글 수정 (인증 필요) |

### 사용자

| 경로                      | 설명                           |
| ------------------------- | ------------------------------ |
| `/users/signin`           | 로그인                         |
| `/users/signup`           | 회원가입                       |
| `/users/mypage`           | 마이페이지 (인증 필요)         |
| `/users/edit/profile-img` | 프로필 이미지 변경 (인증 필요) |
| `/users/edit/nickname`    | 닉네임 변경 (인증 필요)        |
| `/users/edit/password`    | 비밀번호 변경 (인증 필요)      |

### 기타

| 경로                 | 설명              |
| -------------------- | ----------------- |
| `/policy/terms`      | 이용약관          |
| `/policy/privacy`    | 개인정보 처리방침 |
| `/error/404`         | 404 에러 페이지   |
| `/error/coming-soon` | 개발 중 페이지    |

---

## 🔗 Backend Repository

프론트엔드는 백엔드 API 서버(`https://api.wepick.cloud/api`)와 통신합니다.

백엔드 레포지토리: [3-ellim-lee-community-be](https://github.com/100-hours-a-week/3-ellim-lee-community-be)

---

## 🚀 빠른 시작 (Docker)

```bash
# 개발 환경
docker-compose -f docker/dev/docker-compose.yml up -d

# 프로덕션 환경
docker-compose -f docker/prod/docker-compose.yml up -d
```

---

## 🔄 CI/CD

이 프로젝트는 GitHub Actions를 통해 자동 배포됩니다.

- **Development**: `dev` 브랜치에 push 시 자동 배포
- **Production**: `main` 브랜치에 push 시 자동 배포

배포 워크플로우는 `.github/workflows/` 디렉토리에서 확인할 수 있습니다.

---

## 🌿 브랜치 전략

- **main**: 프로덕션 배포 브랜치
- **dev**: 개발 브랜치
- **feature/브랜치명**: 기능 개발 브랜치
- **docs/브랜치명**: 문서 작성 브랜치
