/**
 * Configuration Module
 * 중앙 집중식 설정 관리
 * 
 * 모든 환경 설정을 한 곳에서 관리하여 유지보수성을 향상시킵니다.
 * 불변 객체로 export되어 실수로 인한 설정 변경을 방지합니다.
 */

export const config = Object.freeze({
  // API 설정
  API_BASE_URL: "https://wepick.cloud/api",
  // API_BASE_URL: "http://localhost:8080/api",
  TIMEOUT: 6000,

  // 애플리케이션 설정
  APP_NAME: "wepick-fe",
  STORAGE_PREFIX: "wepick_",

  // 페이지네이션 설정
  PAGINATION: Object.freeze({
    DEFAULT_SIZE: 10,
    COMMENT_SIZE: 5,
  }),

  // 라우트 설정
  ROUTES: Object.freeze({
    HOME: "/posts",
    SIGNIN: "/users/signin",
    SIGNUP: "/users/signup",
    NOT_FOUND: "/pages/error/404.html",

    // Navigation routes
    NAV: Object.freeze({
      TODAY: '/today',
      TOPICS: '/topics',
      COMMUNITY: '/community/posts',
    }),
  }),

  // 이미지 업로드 설정
  IMAGE_UPLOAD: Object.freeze({
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif'],
  }),
});
