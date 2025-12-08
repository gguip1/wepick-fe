/**
 * Navigation Manager
 * 안전한 페이지 네비게이션 제공
 *
 * 외부 사이트로의 의도하지 않은 이동을 방지하고,
 * 일관된 네비게이션 인터페이스를 제공합니다.
 */

import { config } from '/shared/utils/config.js';

// 순환 방지할 페이지 경로 (로그인/회원가입 등)
const CIRCULAR_PATHS = [
  '/users/signin',
  '/users/signup',
];

// sessionStorage 키
const HISTORY_KEY = 'nav_history';

/**
 * 히스토리 가져오기
 */
function getHistory() {
  try {
    const history = sessionStorage.getItem(HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
}

/**
 * 히스토리 저장
 */
function saveHistory(history) {
  try {
    // 최대 20개만 유지
    const trimmed = history.slice(-20);
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch {
    // sessionStorage 실패 시 무시
  }
}

/**
 * 현재 페이지를 히스토리에 추가
 */
function trackCurrentPage() {
  const currentPath = window.location.pathname;
  const history = getHistory();

  // 같은 페이지 연속 추가 방지
  if (history[history.length - 1] !== currentPath) {
    history.push(currentPath);
    saveHistory(history);
  }
}

// 페이지 로드 시 현재 페이지 추적
trackCurrentPage();

/**
 * URL이 내부 URL인지 확인
 * @param {string} url - 확인할 URL
 * @returns {boolean} 내부 URL이면 true
 */
function isInternalUrl(url) {
  if (!url) return false;

  try {
    const urlObj = new URL(url, window.location.origin);
    return urlObj.origin === window.location.origin;
  } catch (e) {
    // 상대 경로인 경우 내부 URL로 간주
    return !url.startsWith("http://") && !url.startsWith("https://");
  }
}

/**
 * 경로가 순환 방지 대상인지 확인
 * @param {string} path - 확인할 경로
 * @returns {boolean}
 */
function isCircularPath(path) {
  return CIRCULAR_PATHS.some(p => path.startsWith(p));
}

/**
 * 안전한 뒤로가기
 * - 이전 페이지가 있으면 이전 페이지로 이동
 * - 로그인/회원가입 순환 방지
 * - 히스토리가 없으면 홈으로 이동
 */
function goBack() {
  const currentPath = window.location.pathname;
  const history = getHistory();

  // 현재 페이지를 히스토리에서 제거
  if (history[history.length - 1] === currentPath) {
    history.pop();
  }

  // 히스토리에서 유효한 이전 페이지 찾기
  while (history.length > 0) {
    const prevPath = history.pop();

    // 현재 페이지와 다르고, 순환 경로가 아닌 경우
    if (prevPath !== currentPath && !isCircularPath(prevPath)) {
      saveHistory(history);
      window.location.href = prevPath;
      return;
    }
  }

  // 유효한 이전 페이지가 없으면 홈으로
  saveHistory([]);
  window.location.href = config.ROUTES.HOME;
}

/**
 * 지정된 경로로 이동
 * @param {string} path - 이동할 경로
 */
function goTo(path) {
  if (!path) {
    console.warn("Navigation: Invalid path provided");
    return;
  }

  window.location.href = path;
}

/**
 * 현재 경로 반환
 * @returns {string} 현재 경로
 */
function getCurrentPath() {
  return window.location.pathname;
}

export const navigation = {
  goBack,
  goTo,
  isInternalUrl,
  getCurrentPath,
};
