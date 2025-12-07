/**
 * UI Helpers Module
 * 사용자 인터페이스 관련 유틸리티 함수 모음
 *
 * - 에러/성공 메시지 표시
 * - 버튼 로딩 상태 관리
 * - 폼 제출 컨트롤러
 */

import { Toast } from '/shared/components/toast.js';

/**
 * 사용자에게 에러 메시지를 표시
 * @param {string} message - 에러 메시지
 * @param {number} duration - 표시 시간 (ms)
 */
export function showError(message, duration = 3000) {
  Toast.error(message, duration);
}

/**
 * 사용자에게 성공 메시지를 표시
 * @param {string} message - 성공 메시지
 * @param {number} duration - 표시 시간 (ms)
 */
export function showSuccess(message, duration = 3000) {
  Toast.success(message, duration);
}

/**
 * 사용자에게 정보 메시지를 표시
 * @param {string} message - 정보 메시지
 * @param {number} duration - 표시 시간 (ms)
 */
export function showInfo(message, duration = 3000) {
  Toast.info(message, duration);
}

/**
 * 사용자에게 경고 메시지를 표시
 * @param {string} message - 경고 메시지
 * @param {number} duration - 표시 시간 (ms)
 */
export function showWarning(message, duration = 3000) {
  Toast.show(message, duration);
}

/**
 * 버튼 로딩 상태 관리
 * @param {HTMLButtonElement} button - 버튼 엘리먼트
 * @param {boolean} loading - 로딩 여부
 * @param {string} loadingText - 로딩 중 텍스트 (기본: '처리 중...')
 */
export function setButtonLoading(button, loading, loadingText = '처리 중...') {
  if (!button) return;

  if (loading) {
    // 원래 텍스트 저장
    button.dataset.originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `
      <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
      ${loadingText}
    `;
  } else {
    // 원래 텍스트 복원
    button.disabled = false;
    button.innerHTML = button.dataset.originalText || button.innerHTML;
    delete button.dataset.originalText;
  }
}

/**
 * Form 제출 컨트롤러
 * 폼 제출 시 로딩 상태 관리와 에러 처리를 자동화합니다.
 *
 * @param {HTMLFormElement} form - 폼 엘리먼트
 * @param {Function} submitHandler - 제출 핸들러 함수 (async)
 * @param {Object} options - 옵션
 * @param {HTMLButtonElement} options.submitButton - 제출 버튼 (기본: form 내 submit 버튼)
 * @param {string} options.loadingText - 로딩 중 텍스트 (기본: '처리 중...')
 * @param {Function} options.onSuccess - 성공 콜백
 * @param {Function} options.onError - 에러 콜백
 * @returns {Object} - destroy 메서드를 가진 객체
 *
 * @example
 * const formController = createFormController(
 *   signInForm,
 *   async (form) => {
 *     const formData = new FormData(form);
 *     const result = await UsersAPI.signIn({
 *       email: formData.get('email'),
 *       password: formData.get('password')
 *     });
 *
 *     if (result.error) {
 *       return { success: false, error: result.error };
 *     }
 *
 *     return { success: true, data: result.data };
 *   },
 *   {
 *     loadingText: '로그인 중...',
 *     onSuccess: () => {
 *       window.location.href = '/today';
 *     },
 *     onError: (error) => {
 *       showError('로그인에 실패했습니다.');
 *     }
 *   }
 * );
 */
export function createFormController(form, submitHandler, options = {}) {
  if (!form || !submitHandler) {
    throw new Error('Form and submitHandler are required');
  }

  const {
    submitButton = form.querySelector('button[type="submit"]'),
    loadingText = '처리 중...',
    onSuccess = null,
    onError = null,
  } = options;

  async function handleSubmit(e) {
    e.preventDefault();

    // 버튼 로딩 시작
    setButtonLoading(submitButton, true, loadingText);

    try {
      const result = await submitHandler(form);

      if (result.success && onSuccess) {
        onSuccess(result.data);
      } else if (result.error) {
        if (onError) {
          onError(result.error);
        } else {
          // 기본 에러 처리
          const errorMessage = typeof result.error === 'string'
            ? result.error
            : result.error.message || '오류가 발생했습니다.';
          showError(errorMessage);
        }
      }
    } catch (error) {
      console.error('Form submission error:', error);
      if (onError) {
        onError(error.message || '오류가 발생했습니다.');
      } else {
        showError('오류가 발생했습니다.');
      }
    } finally {
      // 버튼 로딩 종료
      setButtonLoading(submitButton, false);
    }
  }

  form.addEventListener('submit', handleSubmit);

  return {
    destroy: () => form.removeEventListener('submit', handleSubmit)
  };
}
