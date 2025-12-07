/**
 * 프로필 사진 변경 페이지 모듈
 *
 * 사용자 프로필 사진 변경 기능
 */

import { UsersAPI } from '/shared/api/users.js';
import { ImagesAPI } from '/shared/api/images.js';
import { events } from '/shared/utils/events.js';
import { dom } from '/shared/utils/dom.js';
import { navigation } from '/shared/utils/navigation.js';
import { auth } from '/shared/utils/auth.js';
import { showMessage } from '/shared/utils/message.js';

const PAGE_ID = "users-edit-profile-img";

// 페이지 식별자 확인
const root = dom.qs('[data-page="users-edit-profile-img"]');
if (!root) {
  throw new Error("Page script loaded on wrong page");
}

// 상태 관리
let uploadedImageId = null;
let currentImageFile = null;
let originalUserData = null;

// 허용된 이미지 형식
const ALLOWED_IMAGE_TYPES = ['image/webp', 'image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_IMAGE_EXTENSIONS = ['.webp', '.jpeg', '.jpg', '.png'];

/**
 * 페이지 초기화
 */
async function init() {
  // 인증 필수
  const user = await auth.requireAuth();
  if (!user) return;

  await loadCurrentUserData(user);
  setupEventListeners();
}

/**
 * 현재 사용자 정보 로드 및 표시
 */
async function loadCurrentUserData(currentUser) {
  try {
    originalUserData = currentUser;

    // 프로필 이미지 표시
    if (currentUser.profileImageUrl) {
      displayExistingProfileImage(currentUser.profileImageUrl);
    }
  } catch (error) {
    console.error("Failed to load user data:", error);
    showMessage("사용자 정보를 불러오는데 실패했습니다.", 'error');
  }
}

/**
 * 기존 프로필 이미지 표시
 */
function displayExistingProfileImage(imageUrl) {
  const previewImg = dom.qs("#previewImg");
  const profilePlaceholder = dom.qs("#profilePlaceholder");
  const profileImageCircle = dom.qs("#profileImageWrapper");
  const removeImageBtn = dom.qs("#removeImageBtn");

  if (!previewImg || !profilePlaceholder || !profileImageCircle) return;

  previewImg.src = imageUrl;
  previewImg.classList.remove('hidden');
  profilePlaceholder.classList.add('hidden');
  profileImageCircle.classList.add('has-image');

  if (removeImageBtn) {
    removeImageBtn.classList.remove('hidden');
  }
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
  const form = dom.qs("#profile-img-form");
  const profileImageWrapper = dom.qs("#profileImageWrapper");
  const profileImageInput = dom.qs("#profileImage");
  const removeImageBtn = dom.qs("#removeImageBtn");
  const cancelBtn = dom.qs("#cancel-btn");

  if (form) {
    form.addEventListener("submit", handleUpdateProfileImage);
  }

  if (profileImageWrapper) {
    profileImageWrapper.addEventListener("click", handleImageWrapperClick);
  }

  if (profileImageInput) {
    profileImageInput.addEventListener("change", handleImageSelect);
  }

  if (removeImageBtn) {
    removeImageBtn.addEventListener("click", handleImageRemove);
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
 * 프로필 이미지 영역 클릭 처리
 */
function handleImageWrapperClick(e) {
  if (e.target.closest('#removeImageBtn')) {
    return;
  }

  const profileImageInput = dom.qs("#profileImage");
  if (profileImageInput) {
    profileImageInput.click();
  }
}

/**
 * 이미지 파일 형식 검증
 */
function isValidImageType(file) {
  if (!file) return false;

  if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return true;
  }

  const fileName = file.name.toLowerCase();
  return ALLOWED_IMAGE_EXTENSIONS.some(ext => fileName.endsWith(ext));
}

/**
 * 이미지 선택 처리
 */
async function handleImageSelect(e) {
  const input = e.target;
  const file = input.files?.[0];

  if (!file) {
    if (currentImageFile) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(currentImageFile);
      input.files = dataTransfer.files;
    }
    return;
  }

  if (!isValidImageType(file)) {
    showMessage("webp, jpeg, jpg, png 형식의 이미지만 업로드 가능합니다.", 'warning');
    input.value = '';

    if (currentImageFile) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(currentImageFile);
      input.files = dataTransfer.files;
    }
    return;
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    showMessage(`파일 크기가 너무 큽니다. (${sizeMB}MB / 최대 5MB)`, 'warning');
    input.value = '';

    if (currentImageFile) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(currentImageFile);
      input.files = dataTransfer.files;
    }
    return;
  }

  showImagePreview(file);
  await uploadProfileImage(file);
}

/**
 * 프로필 이미지 업로드 (Presigned URL 방식)
 */
async function uploadProfileImage(file) {
  const profileImageWrapper = dom.qs("#profileImageWrapper");

  try {
    if (profileImageWrapper) {
      profileImageWrapper.classList.add('loading');
    }

    // Presigned URL 방식으로 업로드
    const result = await ImagesAPI.uploadProfileImage(file);

    if (result.error) {
      console.error('Image upload failed:', result.error);
      showMessage(result.error, 'error');
      handleImageRemove({ preventDefault: () => {}, stopPropagation: () => {} });
    } else {
      uploadedImageId = result.imageId;
      currentImageFile = file;
      console.log('Image uploaded successfully, imageId:', uploadedImageId);
    }
  } catch (error) {
    console.error('Image upload error:', error);
    showMessage("이미지 업로드 중 오류가 발생했습니다.", 'error');
    handleImageRemove({ preventDefault: () => {}, stopPropagation: () => {} });
  } finally {
    if (profileImageWrapper) {
      profileImageWrapper.classList.remove('loading');
    }
  }
}

/**
 * 이미지 미리보기 표시
 */
function showImagePreview(file) {
  const previewImg = dom.qs("#previewImg");
  const profilePlaceholder = dom.qs("#profilePlaceholder");
  const profileImageCircle = dom.qs("#profileImageWrapper");
  const removeImageBtn = dom.qs("#removeImageBtn");

  if (!previewImg || !profilePlaceholder || !profileImageCircle) return;

  const reader = new FileReader();

  reader.onload = (e) => {
    previewImg.src = e.target.result;
    previewImg.classList.remove('hidden');
    profilePlaceholder.classList.add('hidden');
    profileImageCircle.classList.add('has-image');

    if (removeImageBtn) {
      removeImageBtn.classList.remove('hidden');
    }
  };

  reader.onerror = () => {
    showMessage("이미지를 불러오는데 실패했습니다.", 'error');
  };

  reader.readAsDataURL(file);
}

/**
 * 이미지 제거 처리
 */
function handleImageRemove(e) {
  e.preventDefault();
  e.stopPropagation();

  const profileImageInput = dom.qs("#profileImage");
  const previewImg = dom.qs("#previewImg");
  const profilePlaceholder = dom.qs("#profilePlaceholder");
  const profileImageCircle = dom.qs("#profileImageWrapper");
  const removeImageBtn = dom.qs("#removeImageBtn");

  if (profileImageInput) {
    profileImageInput.value = '';
  }

  if (previewImg) {
    previewImg.src = '';
    previewImg.classList.add('hidden');
  }

  if (profilePlaceholder) {
    profilePlaceholder.classList.remove('hidden');
  }

  if (profileImageCircle) {
    profileImageCircle.classList.remove('has-image');
  }

  if (removeImageBtn) {
    removeImageBtn.classList.add('hidden');
  }

  uploadedImageId = null;
  currentImageFile = null;
}

/**
 * 프로필 사진 변경 처리
 */
async function handleUpdateProfileImage(e) {
  e.preventDefault();

  const submitBtn = dom.qs('button[type="submit"]');

  // 변경사항 확인
  const hasImageChanged = uploadedImageId !== null;
  const hasImageRemoved = uploadedImageId === null && !currentImageFile && originalUserData?.profileImageUrl;

  if (!hasImageChanged && !hasImageRemoved) {
    showMessage("변경된 내용이 없습니다.", 'warning');
    return;
  }

  const originalBtnText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = '변경 중...';

  try {
    const updateData = {};

    if (hasImageChanged) {
      updateData.profileImageId = uploadedImageId;
    } else if (hasImageRemoved) {
      updateData.profileImageId = null;
    }

    const response = await UsersAPI.updateProfileImage(updateData);

    if (response.status >= 200 && response.status < 300) {
      navigation.goTo('/users/mypage');
    } else if (response.status === null) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
      showMessage("서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.", 'error');
    } else {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
      const errorMessage = response.error?.message || "프로필 사진 변경에 실패했습니다.";
      showMessage(errorMessage, 'error');
    }
  } catch (error) {
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
    console.error("Update profile image error:", error);
    showMessage("일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.", 'error');
  }
}

// 페이지 로드 시 자동 실행
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
