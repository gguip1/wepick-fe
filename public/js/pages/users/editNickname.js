/**
 * 닉네임 변경 페이지 모듈
 *
 * 사용자 닉네임 변경 기능
 */

import { UsersAPI } from "../../api/users.js";
import { dom } from "../../utils/dom.js";
import { navigation } from "../../utils/navigation.js";
import { auth } from "../../utils/auth.js";
import { setupRealtimeValidation, validateForm } from "../../utils/validation.js";
import { showMessage } from "../../utils/message.js";

const PAGE_ID = "users-edit-nickname";

// 페이지 식별자 확인
const root = dom.qs('[data-page="users-edit-nickname"]');
if (!root) {
  throw new Error("Page script loaded on wrong page");
}

let originalUserData = null;

/**
 * 페이지 초기화
 */
async function init() {
  // 인증 필수
  const user = await auth.requireAuth();
  if (!user) return;

  await loadCurrentUserData(user);
  setupEventListeners();
  setupValidation();
}

/**
 * 폼 유효성 검사 설정
 */
function setupValidation() {
  const form = dom.qs("#nickname-change-form");
  if (form) {
    setupRealtimeValidation(form, { pageId: PAGE_ID });
  }
}

/**
 * 현재 사용자 정보 로드 및 표시
 */
async function loadCurrentUserData(currentUser) {
  try {
    originalUserData = currentUser;

    // 현재 닉네임 표시 (읽기 전용)
    const currentNicknameInput = dom.qs("#currentNickname");
    if (currentNicknameInput) {
      currentNicknameInput.value = currentUser.nickname || '';
    }
  } catch (error) {
    console.error("Failed to load user data:", error);
    showMessage("사용자 정보를 불러오는데 실패했습니다.", 'error');
  }
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
  const form = dom.qs("#nickname-change-form");
  const cancelBtn = dom.qs("#cancel-btn");

  if (form) {
    form.addEventListener("submit", handleNicknameChange);
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", handleCancel);
  }
}

/**
 * 취소 버튼 클릭 처리
 */
function handleCancel() {
  navigation.goTo('/users/edit');
}

/**
 * 닉네임 변경 처리
 */
async function handleNicknameChange(e) {
  e.preventDefault();

  const form = dom.qs("#nickname-change-form");
  const nicknameInput = dom.qs("#nickname");
  const submitBtn = dom.qs('button[type="submit"]');

  // 폼 유효성 검사
  if (!validateForm(form)) {
    showMessage("입력 항목을 확인해주세요.", 'warning');
    return;
  }

  const nickname = nicknameInput?.value.trim();

  // 변경사항 확인
  if (nickname === originalUserData?.nickname) {
    showMessage("현재 닉네임과 동일합니다.", 'warning');
    return;
  }

  const originalBtnText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = '변경 중...';

  try {
    const response = await UsersAPI.updateNickname({ nickname });

    if (response.status >= 200 && response.status < 300) {
      navigation.goTo('/users/edit');
    } else if (response.status === null) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
      showMessage("서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.", 'error');
    } else {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
      const errorMessage = response.error?.message || "닉네임 변경에 실패했습니다.";
      showMessage(errorMessage, 'error');
    }
  } catch (error) {
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
    console.error("Change nickname error:", error);
    showMessage("일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.", 'error');
  }
}

// 페이지 로드 시 자동 실행
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
