/**
 * 회원가입 페이지 모듈
 * 
 * 사용자 회원가입 기능을 처리합니다.
 * - 회원가입 폼 제출 처리
 * - 실시간 입력 검증 및 피드백
 * - 프로필 이미지 업로드 (선택사항)
 * - 회원가입 성공 시 로그인 페이지로 이동
 * - 에러 처리 및 사용자 피드백
 */

import { UsersAPI } from '/shared/api/users.js';
import { events } from '/shared/utils/events.js';
import { dom } from '/shared/utils/dom.js';
import { navigation } from '/shared/utils/navigation.js';
import { showMessage, hideMessage } from '/shared/utils/message.js';
import { setupRealtimeValidation, validateForm, validateField, validatePasswordMatch } from '/shared/utils/validation.js';

const PAGE_ID = "users-signup";

// 페이지 식별자 확인 (다른 페이지에서 실행 방지)
const root = dom.qs('[data-page="users-signup"]');
if (!root) {
  throw new Error("Page script loaded on wrong page");
}

// 현재 스텝 상태
let currentStep = 1;
const totalSteps = 3;

/**
 * 페이지 초기화
 */
async function init() {
  setupEventListeners();
  setupValidation();
  updateStepUI();
}

/**
 * 폼 유효성 검사 설정
 */
function setupValidation() {
  const form = dom.qs("#sign-up-form");
  if (form) {
    setupRealtimeValidation(form, { pageId: PAGE_ID });

    // 비밀번호 확인 필드에 대한 추가 검증 (일치 여부)
    const passwordInput = dom.qs("#password");
    const password2Input = dom.qs("#password2");

    if (password2Input && passwordInput) {
      // blur 이벤트: 비밀번호 확인 필드에서 벗어날 때 일치 검증
      events.on(password2Input, "blur", () => {
        validatePasswordMatch(passwordInput, password2Input);
      }, { pageId: PAGE_ID });

      // input 이벤트: 비밀번호 확인 입력 중 실시간 검증
      events.on(password2Input, "input", () => {
        if (password2Input.classList.contains('is-invalid')) {
          validatePasswordMatch(passwordInput, password2Input);
        }
      }, { pageId: PAGE_ID });

      // 비밀번호 필드 변경 시에도 확인 필드 재검증
      events.on(passwordInput, "input", () => {
        if (password2Input.value && password2Input.classList.contains('is-invalid')) {
          validatePasswordMatch(passwordInput, password2Input);
        }
      }, { pageId: PAGE_ID });
    }
  }
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
  const form = dom.qs("#sign-up-form");
  const nextBtn = dom.qs("#next-btn");
  const prevBtn = dom.qs("#prev-btn");
  const stepIndicators = document.querySelectorAll('.step');

  if (form) {
    events.on(form, "submit", handleSignUp, { pageId: PAGE_ID });
  }

  if (nextBtn) {
    events.on(nextBtn, "click", handleNextStep, { pageId: PAGE_ID });
  }

  if (prevBtn) {
    events.on(prevBtn, "click", handlePrevStep, { pageId: PAGE_ID });
  }

  // 스텝 인디케이터 클릭 이벤트
  stepIndicators.forEach((step, index) => {
    events.on(step, "click", () => handleStepClick(index + 1), { pageId: PAGE_ID });
  });
}

/**
 * 다음 스텝으로 이동
 */
function handleNextStep() {
  // 현재 스텝 검증
  if (!validateCurrentStep()) {
    return;
  }

  // 다음 스텝으로 이동
  if (currentStep < totalSteps) {
    currentStep++;
    updateStepUI();
  }
}

/**
 * 이전 스텝으로 이동
 */
function handlePrevStep() {
  if (currentStep > 1) {
    currentStep--;
    updateStepUI();
  }
}

/**
 * 스텝 인디케이터 클릭 처리
 * @param {number} targetStep - 이동할 스텝 번호
 */
function handleStepClick(targetStep) {
  // 같은 스텝이면 무시
  if (targetStep === currentStep) {
    return;
  }

  // 앞으로 가는 경우 (다음 스텝으로)
  if (targetStep > currentStep) {
    // 현재 스텝 검증
    if (!validateCurrentStep()) {
      return;
    }

    // 한 단계씩만 이동 가능
    if (targetStep > currentStep + 1) {
      return;
    }

    currentStep = targetStep;
    updateStepUI();
  } else {
    // 뒤로 가는 경우 (이전 스텝으로) - 자유롭게 이동 가능
    currentStep = targetStep;
    updateStepUI();
  }
}

/**
 * 현재 스텝 검증
 * @returns {boolean} 검증 통과 여부
 */
function validateCurrentStep() {
  if (currentStep === 1) {
    // Step 1: 이메일 검증
    const emailInput = dom.qs("#email");
    return validateField(emailInput, "email");
  } else if (currentStep === 2) {
    // Step 2: 비밀번호 검증
    const passwordInput = dom.qs("#password");
    const password2Input = dom.qs("#password2");

    if (!validateField(passwordInput, "password")) {
      return false;
    }

    if (!validatePasswordMatch(passwordInput, password2Input)) {
      return false;
    }

    return true;
  } else if (currentStep === 3) {
    // Step 3: 닉네임 검증
    const nicknameInput = dom.qs("#nickname");
    return validateField(nicknameInput, "nickname");
  }

  return true;
}

/**
 * 스텝 UI 업데이트
 */
function updateStepUI() {
  // Form steps 업데이트
  const formSteps = document.querySelectorAll('.form-step');
  formSteps.forEach((step, index) => {
    if (index + 1 === currentStep) {
      step.classList.add('active');
    } else {
      step.classList.remove('active');
    }
  });

  // Step indicator 업데이트
  const stepIndicators = document.querySelectorAll('.step');
  stepIndicators.forEach((step, index) => {
    const stepNum = index + 1;
    if (stepNum < currentStep) {
      step.classList.add('completed');
      step.classList.remove('active');
    } else if (stepNum === currentStep) {
      step.classList.add('active');
      step.classList.remove('completed');
    } else {
      step.classList.remove('active', 'completed');
    }
  });

  // 버튼 표시/숨김
  const prevBtn = dom.qs("#prev-btn");
  const nextBtn = dom.qs("#next-btn");
  const submitBtn = dom.qs("#submit-btn");

  if (prevBtn) {
    if (currentStep === 1) {
      prevBtn.classList.add('hidden');
    } else {
      prevBtn.classList.remove('hidden');
    }
  }

  if (nextBtn && submitBtn) {
    if (currentStep === totalSteps) {
      nextBtn.classList.add('hidden');
      submitBtn.classList.remove('hidden');
    } else {
      nextBtn.classList.remove('hidden');
      submitBtn.classList.add('hidden');
    }
  }
}

/**
 * 회원가입 폼 제출 처리
 * @param {Event} e - 폼 제출 이벤트
 */
async function handleSignUp(e) {
  e.preventDefault();

  const form = dom.qs("#sign-up-form");
  const emailInput = dom.qs("#email");
  const passwordInput = dom.qs("#password");
  const password2Input = dom.qs("#password2");
  const nicknameInput = dom.qs("#nickname");
  const submitBtn = dom.qs('button[type="submit"]');

  // 폼 유효성 검사
  if (!validateForm(form)) {
    showMessage("입력 항목을 확인해주세요.", 'warning');
    return;
  }

  // 비밀번호 일치 확인
  if (!validatePasswordMatch(passwordInput, password2Input)) {
    showMessage("비밀번호가 일치하지 않습니다.", 'warning');
    return;
  }

  const email = emailInput?.value.trim();
  const password = passwordInput?.value;
  const password2 = password2Input?.value;
  const nickname = nicknameInput?.value.trim();

  // 로딩 상태 시작
  const originalBtnText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<div class="spinner"></div>회원가입 중...';

  try {
    // 회원가입 API 호출
    const response = await UsersAPI.signUp({
      email,
      password,
      password2,
      nickname
    });

    if (response.status >= 200 && response.status < 300) {
      // 회원가입 성공 - 바로 로그인 페이지로 이동
      navigation.goTo('/users/signin');
    } else if (response.status === null) {
      // 로딩 상태 종료
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
      
      // 네트워크 에러
      showMessage("서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.", 'error');
    } else {
      // 로딩 상태 종료
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
      
      // 회원가입 실패 (400, 409 등)
      const errorMessage = response.error?.message || "회원가입에 실패했습니다.";
      showMessage(errorMessage, 'error');
    }
  } catch (error) {
    // 로딩 상태 종료
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
    
    console.error("Sign up error:", error);
    showMessage("일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.", 'error');
  }
}

/**
 * 페이지 정리
 * 페이지 언로드 시 모든 이벤트 리스너 제거
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
