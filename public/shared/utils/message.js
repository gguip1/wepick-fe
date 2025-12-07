/**
 * Form Message Utility
 * 폼 인라인 메시지 표시/숨김 유틸리티
 *
 * 사용법:
 * 1. HTML에 <div id="form-message" class="small mb-3"></div> 추가
 * 2. showMessage(message, type) 호출
 *
 * 타입:
 * - 'error': 빨간색 (기본값)
 * - 'success': 초록색
 * - 'warning': 노란색
 */

// 타이머 ID를 저장할 변수
let messageTimeout = null;

/**
 * 메시지 표시
 * @param {string} message - 표시할 메시지
 * @param {string} type - 메시지 타입 ('error' | 'success' | 'warning')
 * @param {number} duration - 메시지 표시 시간 (밀리초, 0이면 자동 숨김 안함)
 */
export function showMessage(message, type = 'error', duration = 5000) {
  const messageElement = document.querySelector('#form-message');
  if (messageElement) {
    // 기존 타이머가 있으면 취소
    if (messageTimeout) {
      clearTimeout(messageTimeout);
      messageTimeout = null;
    }

    messageElement.textContent = message;

    // 기존 클래스 제거
    messageElement.classList.remove('error', 'success', 'warning');

    // 타입에 따라 클래스 추가
    messageElement.classList.add(type, 'show');

    // duration이 0보다 크면 자동으로 숨김
    if (duration > 0) {
      messageTimeout = setTimeout(() => {
        hideMessage();
      }, duration);
    }
  }
}

/**
 * 메시지 숨김
 */
export function hideMessage() {
  const messageElement = document.querySelector('#form-message');
  if (messageElement) {
    // 타이머가 있으면 취소
    if (messageTimeout) {
      clearTimeout(messageTimeout);
      messageTimeout = null;
    }

    messageElement.textContent = '';
    messageElement.classList.remove('error', 'success', 'warning', 'show');
  }
}
