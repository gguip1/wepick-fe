/**
 * 개인정보 수정 메인 페이지 모듈
 *
 * 프로필 수정과 비밀번호 변경 옵션을 제공하는 메인 페이지
 */

import { events } from "../../utils/events.js";
import { dom } from "../../utils/dom.js";
import { navigation } from "../../utils/navigation.js";
import { auth } from "../../utils/auth.js";

const PAGE_ID = "users-edit";

// 페이지 식별자 확인
const root = dom.qs('[data-page="users-edit"]');
if (!root) {
  throw new Error("Page script loaded on wrong page");
}

/**
 * 페이지 초기화
 */
async function init() {
  // 인증 필수
  const user = await auth.requireAuth();
  if (!user) return;

  setupEventListeners();
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
  const editCards = document.querySelectorAll('.edit-card');

  console.log('Edit cards found:', editCards.length);

  editCards.forEach(card => {
    const link = card.dataset.link;
    console.log('Card link:', link);

    // 직접 addEventListener 사용
    card.addEventListener('click', (e) => handleCardClick(e, card, link));
  });
}

/**
 * 카드 클릭 처리
 * @param {Event} e - 클릭 이벤트
 * @param {HTMLElement} card - 클릭된 카드
 * @param {string} link - 이동할 링크
 */
function handleCardClick(e, card, link) {
  console.log('Card clicked, link:', link);

  if (!link) {
    console.error('No link found on card');
    return;
  }

  // 카드에 로딩 상태 추가
  card.classList.add('loading');

  // 페이지 이동
  console.log('Navigating to:', link);
  navigation.goTo(link);
}

/**
 * 페이지 정리
 */
function cleanup() {
  events.removeAllForPage(PAGE_ID);
}

// 페이지 로드 시 자동 실행
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// 페이지 언로드 시 정리
window.addEventListener("beforeunload", cleanup);
