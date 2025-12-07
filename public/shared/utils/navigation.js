/**
 * Navigation Manager
 * 안전한 페이지 네비게이션 제공
 * 
 * 외부 사이트로의 의도하지 않은 이동을 방지하고,
 * 일관된 네비게이션 인터페이스를 제공합니다.
 */

import { config } from '/shared/utils/config.js';

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
 * 안전한 뒤로가기
 * 히스토리 스택을 확인하여 안전하게 뒤로가기
 */
function goBack() {
  // 히스토리 스택이 있는지 확인
  // history.length > 1: 현재 페이지 외에 히스토리가 있음
  // history.length === 1: 현재 페이지만 있음 (새 탭/창으로 열림)
  if (window.history.length > 1) {
    // 히스토리가 있으면 뒤로가기
    window.history.back();
  } else {
    // 히스토리가 없으면 (새 탭/창으로 열린 경우) 홈으로 이동
    goTo(config.ROUTES.HOME);
  }
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
