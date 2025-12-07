/**
 * 비밀번호 변경 페이지 모듈
 *
 * 사용자 비밀번호 변경 기능
 */

import { UsersAPI } from "../../api/users.js";
import { events } from "../../utils/events.js";
import { dom } from "../../utils/dom.js";
import { navigation } from "../../utils/navigation.js";
import { auth } from "../../utils/auth.js";
import { setupRealtimeValidation, validateField } from "../../utils/validation.js";
import { showMessage } from "../../utils/message.js";

const PAGE_ID = "users-edit-password";

// 페이지 식별자 확인
const root = dom.qs('[data-page="users-edit-password"]');
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
  setupValidation();
}

/**
 * 폼 유효성 검사 설정
 */
function setupValidation() {
  const form = dom.qs("#password-change-form");
  if (form) {
    setupRealtimeValidation(form, { pageId: PAGE_ID });
  }
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
  const form = dom.qs("#password-change-form");
  const cancelBtn = dom.qs("#cancel-btn");

  if (form) {
    events.on(form, "submit", handlePasswordChange, { pageId: PAGE_ID });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", handleCancel);
  }
}

/**
 * 취소 버튼 클릭 처리
 */
function handleCancel() {
  navigation.goTo('/users/mypage');
}

/**
 * 비밀번호 일치 확인
 */
function validatePasswordMatch(password1Input, password2Input) {
  const password1 = password1Input?.value || '';
  const password2 = password2Input?.value || '';

  if (!password2) {
    return true; // 빈 값은 required 검증에서 처리
  }

  if (password1 !== password2) {
    // 비밀번호 불일치
    const feedback = password2Input.parentElement.querySelector('.invalid-feedback');
    if (feedback) {
      feedback.textContent = '비밀번호가 일치하지 않습니다';
      feedback.classList.add('show');
    }
    password2Input.classList.remove('is-valid');
    password2Input.classList.add('is-invalid');
    return false;
  }

  // 비밀번호 일치
  const feedback = password2Input.parentElement.querySelector('.invalid-feedback');
  if (feedback) {
    feedback.textContent = '';
    feedback.classList.remove('show');
  }
  password2Input.classList.remove('is-invalid');
  password2Input.classList.add('is-valid');
  return true;
}

/**
 * 비밀번호 변경 처리
 */
async function handlePasswordChange(e) {
  e.preventDefault();

  const currentPasswordInput = dom.qs("#currentPassword");
  const newPasswordInput = dom.qs("#newPassword");
  const newPassword2Input = dom.qs("#newPassword2");
  const submitBtn = dom.qs('button[type="submit"]');

  // 현재 비밀번호 검증
  if (!validateField(currentPasswordInput, "required")) {
    return;
  }

  // 새 비밀번호 검증
  if (!validateField(newPasswordInput, "password")) {
    return;
  }

  // 비밀번호 확인 검증
  if (!validateField(newPassword2Input, "required")) {
    return;
  }

  // 비밀번호 일치 확인
  if (!validatePasswordMatch(newPasswordInput, newPassword2Input)) {
    return;
  }

  const currentPassword = currentPasswordInput?.value.trim();
  const newPassword = newPasswordInput?.value.trim();

  // 새 비밀번호가 현재 비밀번호와 같은지 확인
  if (currentPassword === newPassword) {
    showMessage("새 비밀번호는 현재 비밀번호와 달라야 합니다.", 'warning');
    return;
  }

  // 로딩 상태 시작
  const originalBtnText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = '변경 중...';

  try {
    const response = await UsersAPI.updatePassword({
      oldPassword: currentPassword,
      newPassword,
      newPassword2: newPassword
    });

    if (response.status >= 200 && response.status < 300) {
      // 비밀번호 변경 성공 - 개인정보 수정 메인 페이지로 이동
      navigation.goTo('/users/mypage');
    } else if (response.status === null) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
      showMessage("서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.", 'error');
    } else {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
      const errorMessage = response.error?.message || "비밀번호 변경에 실패했습니다.";
      showMessage(errorMessage, 'error');
    }
  } catch (error) {
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
    console.error("Change password error:", error);
    showMessage("일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.", 'error');
  }
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
