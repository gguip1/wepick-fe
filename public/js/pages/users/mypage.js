/**
 * Mypage Module
 * 마이페이지 로직
 */

import { UsersAPI } from '../../api/users.js';
import { initHeaderAuth } from '../../utils/header-init.js';
import { loadHeader, loadFooter } from '../../utils/component-loader.js';

const PAGE_ID = "users-mypage";

// 페이지 식별자 확인
const root = document.querySelector('[data-page="mypage"]');
if (!root) {
  throw new Error('Page script loaded on wrong page');
}

// 상태 관리
let state = { 
  currentUser: null,
};

/**
 * 페이지 초기화
 */
async function init() {
  // Load header and footer
  await loadHeader();
  await loadFooter();

  // Initialize header auth state and get current user
  const user = await initHeaderAuth();

  if (!user) {
    // 비로그인 상태면 로그인 페이지로 리다이렉트
    window.location.href = '/users/signin';
    return;
  }

  state.currentUser = user;

  // 사용자 정보 표시
  displayUserInfo(user);

  // 로딩 스켈레톤 숨기고 실제 콘텐츠 표시
  const loadingSkeleton = document.getElementById('loadingSkeleton');
  const actualContent = document.getElementById('actualContent');

  if (loadingSkeleton) {
    loadingSkeleton.style.display = 'none';
  }
  if (actualContent) {
    actualContent.removeAttribute('hidden');
  }

  // 이벤트 리스너 설정
  setupEventListeners();

  // 로그아웃 이벤트 리스너
  window.addEventListener('userLoggedOut', handleLogout);
}

/**
 * 사용자 정보 표시
 */
function displayUserInfo(user) {
  const profileImage = document.getElementById('userProfileImage');
  const nickname = document.getElementById('userNickname');
  const email = document.getElementById('userEmail');

  if (profileImage) {
    profileImage.src = user.profileImageUrl || '/assets/imgs/profile_icon.svg';
    profileImage.alt = user.nickname || '프로필 이미지';
  }

  if (nickname) {
    nickname.textContent = user.nickname || '사용자';
  }

  if (email) {
    email.textContent = user.email || '';
  }
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
  const deleteAccountBtn = document.getElementById('deleteAccountBtn');

  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', handleDeleteAccount);
  }
}

/**
 * 회원탈퇴 처리
 */
async function handleDeleteAccount() {
  try {
    // 1차 확인
    const confirmed = confirm(
      '정말 탈퇴하시겠습니까?\n\n탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.'
    );

    if (!confirmed) {
      return;
    }

    // 2차 확인 (더 강한 경고)
    const finalConfirmed = confirm(
      '최종 확인\n\n탈퇴를 진행하면 다음 데이터가 모두 삭제됩니다:\n\n• 작성한 모든 게시글\n• 작성한 모든 댓글\n• 투표 기록\n• 개인정보\n\n정말로 탈퇴하시겠습니까?'
    );

    if (!finalConfirmed) {
      return;
    }

    // 회원탈퇴 API 호출
    const response = await UsersAPI.deleteCurrent();

    if (response.status >= 200 && response.status < 300) {
      // 탈퇴 성공
      alert('회원탈퇴가 완료되었습니다.\n그동안 이용해주셔서 감사합니다.');

      // 로그인 페이지로 리다이렉트
      window.location.href = '/users/signin';
    } else {
      // 탈퇴 실패
      const errorMessage = response.error?.message || '회원탈퇴에 실패했습니다.';
      alert(errorMessage);
    }
  } catch (error) {
    console.error('회원탈퇴 에러:', error);
    alert('회원탈퇴 처리 중 오류가 발생했습니다.');
  }
}

/**
 * 로그아웃 처리
 */
function handleLogout() {
  // 로그아웃 시 로그인 페이지로 리다이렉트
  window.location.href = '/users/signin';
}

// 페이지 로드 시 자동 실행
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
