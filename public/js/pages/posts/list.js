/**
 * Posts List Page Module
 * 게시물 목록 페이지
 */

import { PostsAPI } from "../../api/posts.js";
import { navigation } from "../../utils/navigation.js";
import { initHeaderAuth } from "../../utils/header-init.js";
import { loadHeader } from "../../utils/component-loader.js";

const PAGE_ID = "posts-list";

// 페이지 식별자 확인 (다른 페이지에서 실행 방지)
const root = document.querySelector('[data-page="posts-list"]');
if (!root) {
  throw new Error("Page script loaded on wrong page");
}

// 페이지 상태
let state = {
  isLoading: false,
  hasNext: true,
  lastPostId: null,
  currentUser: null, // 현재 사용자 정보
};

// DOM 요소
let elements = {};

/**
 * 페이지 초기화
 */
async function init() {
  // Load header HTML
  await loadHeader();

  // DOM 요소 캐싱
  cacheElements();

  // Initialize header auth state and get current user (한 번만 호출)
  const user = await initHeaderAuth();
  if (user) {
    state.currentUser = user;
  }

  // 글쓰기 버튼 상태 업데이트
  updateWriteButtonState();

  // 이벤트 리스너 설정
  setupEventListeners();

  // 초기 게시물 로드 (전역 로딩 사용)
  await loadPosts(true);

  // 무한 스크롤 설정
  setupInfiniteScroll();

  // 로그아웃 이벤트 리스너
  window.addEventListener('userLoggedOut', handleLogout);
}

/**
 * DOM 요소 캐싱
 */
function cacheElements() {
  elements = {
    postList: document.getElementById("postList"),
    createBtn: document.querySelector(".post-create-btn"),
    loadingIndicator: document.querySelector(".loading-indicator"),
    endMessage: document.querySelector(".end-message"),
    scrollTrigger: document.querySelector(".scroll-trigger"),
  };

  // 초기 상태: 로딩 인디케이터 명시적으로 숨김
  if (elements.loadingIndicator) {
    elements.loadingIndicator.style.display = 'none';
  }

  // Set active navigation
  const activeNav = document.body.dataset.activeNav;
  if (activeNav) {
    setTimeout(() => {
      const navLink = document.querySelector(`[href="/${activeNav}"]`);
      if (navLink) {
        navLink.classList.add('active');
      }
    }, 100);
  }
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
  // 게시물 작성 버튼
  if (elements.createBtn) {
    elements.createBtn.addEventListener("click", handleCreateClick);
  }
}

/**
 * 무한 스크롤 설정
 */
function setupInfiniteScroll() {
  // Intersection Observer 사용
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && state.hasNext && !state.isLoading) {
          loadPosts();
        }
      });
    },
    {
      root: null,
      rootMargin: "200px", // 화면 아래 200px 전에 미리 로딩
      threshold: 0.1,
    }
  );

  if (elements.scrollTrigger) {
    observer.observe(elements.scrollTrigger);
    state.observer = observer;
  }

  // 윈도우 스크롤 이벤트로도 체크 (백업)
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }

    scrollTimeout = setTimeout(() => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      const clientHeight = window.innerHeight;

      // 페이지 하단 800px 전에 도달하면 로딩
      if (scrollHeight - scrollTop - clientHeight < 800 && state.hasNext && !state.isLoading) {
        loadPosts();
      }
    }, 100);
  }, { passive: true });
}

/**
 * 게시물 로드
 * @param {boolean} isInitialLoad - 첫 로딩 여부
 */
async function loadPosts(isInitialLoad = false) {
  if (state.isLoading || !state.hasNext) {
    return;
  }

  state.isLoading = true;

  // 첫 로딩이 아닐 때만 스켈레톤 UI 표시
  if (!isInitialLoad) {
    showLoading();
  }

  // 타임아웃 설정 (10초)
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), 10000);
  });

  try {
    // 첫 로딩은 전역 로딩 사용, 이후는 로컬 스켈레톤 사용
    const apiPromise = PostsAPI.getList(state.lastPostId, { showLoading: isInitialLoad });
    const response = await Promise.race([apiPromise, timeoutPromise]);

    if (response.status >= 200 && response.status < 300 && response.data) {
      const { posts, lastPostId, hasNext } = response.data;

      // 게시물 렌더링
      renderPosts(posts);

      // 상태 업데이트
      state.lastPostId = lastPostId;
      state.hasNext = hasNext;
    } else {
      console.error("Failed to load posts:", response.error);
      showErrorMessage("게시물을 불러오는데 실패했습니다.");
      state.hasNext = false;
    }
  } catch (error) {
    console.error("Error loading posts:", error);

    // 타임아웃 또는 네트워크 에러 처리
    if (error.message === 'Request timeout') {
      showErrorMessage("서버 연결 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.");
    } else {
      showErrorMessage("게시물을 불러올 수 없습니다. 네트워크 연결을 확인해주세요.");
    }
    state.hasNext = false;
  } finally {
    state.isLoading = false;

    // 첫 로딩이 아닐 때만 로딩 숨김
    if (!isInitialLoad) {
      hideLoading();
      // 더 이상 게시물이 없으면 종료 메시지 표시
      if (!state.hasNext && elements.postList.children.length > 0) {
        showEndMessage();
      }
    } else if (!state.hasNext && elements.postList.children.length > 0) {
      // 첫 로딩이면서 더 이상 게시물이 없을 때만 종료 메시지 표시
      showEndMessage();
    }
  }
}

/**
 * 게시물 렌더링
 * @param {Array} posts - 게시물 배열
 */
function renderPosts(posts) {
  if (!posts || posts.length === 0) {
    return;
  }

  const fragment = document.createDocumentFragment();

  posts.forEach((post) => {
    const postItem = createPostItem(post);
    fragment.appendChild(postItem);
  });

  elements.postList.appendChild(fragment);
}

/**
 * 게시물 카드 생성
 * @param {Object} post - Post data
 * @returns {HTMLElement}
 */
function createPostItem(post) {
  const card = document.createElement('div');
  card.className = 'post-card';
  card.dataset.postId = post.postId;
  card.addEventListener('click', () => {
    navigation.goTo(`/community/posts/${post.postId}`);
  });

  // Card Header (Author + Date + Badge)
  const header = document.createElement('div');
  header.className = 'card-header';

  const authorSection = document.createElement('div');
  authorSection.className = 'card-author-section';

  const authorImage = document.createElement('img');
  authorImage.className = 'card-author-image';
  authorImage.src = post.author?.profileImageUrl || '/assets/imgs/profile_icon.svg';
  authorImage.alt = 'Profile';

  const authorInfo = document.createElement('div');
  authorInfo.className = 'card-author-info';

  const authorName = document.createElement('div');
  authorName.className = 'card-author-name';
  authorName.textContent = post.author?.nickname || '알 수 없음';

  const date = document.createElement('div');
  date.className = 'card-date';
  date.textContent = formatDate(post.createdAt);

  authorInfo.appendChild(authorName);
  authorInfo.appendChild(date);
  authorSection.appendChild(authorImage);
  authorSection.appendChild(authorInfo);
  header.appendChild(authorSection);

  // Topic badge if linked
  if (post.topicId) {
    const badge = document.createElement('div');
    badge.className = 'card-topic-badge';
    badge.textContent = 'WePick';
    header.appendChild(badge);
  }

  card.appendChild(header);

  // Card Title
  const title = document.createElement('h3');
  title.className = 'card-title';
  title.textContent = post.title;
  card.appendChild(title);

  // Card Content Preview (최대 2줄)
  if (post.content) {
    const content = document.createElement('div');
    content.className = 'card-content';
    content.textContent = post.content;
    card.appendChild(content);
  }

  // Card Footer (Stats)
  const footer = document.createElement('div');
  footer.className = 'card-footer';

  const viewsStat = document.createElement('div');
  viewsStat.className = 'card-stat';
  const viewsIcon = document.createElement('img');
  viewsIcon.className = 'card-stat-icon';
  viewsIcon.src = '/assets/imgs/view_icon.svg';
  viewsIcon.alt = 'views';
  const viewsCount = document.createElement('span');
  viewsCount.textContent = post.viewCount || 0;
  viewsStat.appendChild(viewsIcon);
  viewsStat.appendChild(viewsCount);

  const likesStat = document.createElement('div');
  likesStat.className = 'card-stat';
  const likesIcon = document.createElement('img');
  likesIcon.className = 'card-stat-icon';
  likesIcon.src = '/assets/imgs/like_icon.svg';
  likesIcon.alt = 'likes';
  const likesCount = document.createElement('span');
  likesCount.textContent = post.likeCount || 0;
  likesStat.appendChild(likesIcon);
  likesStat.appendChild(likesCount);

  const commentsStat = document.createElement('div');
  commentsStat.className = 'card-stat';
  const commentsIcon = document.createElement('img');
  commentsIcon.className = 'card-stat-icon';
  commentsIcon.src = '/assets/imgs/comment_icon.svg';
  commentsIcon.alt = 'comments';
  const commentsCount = document.createElement('span');
  commentsCount.textContent = post.commentCount || 0;
  commentsStat.appendChild(commentsIcon);
  commentsStat.appendChild(commentsCount);

  footer.appendChild(viewsStat);
  footer.appendChild(likesStat);
  footer.appendChild(commentsStat);

  card.appendChild(footer);

  return card;
}

/**
 * 날짜 포맷팅
 * @param {string} dateString - ISO date string
 * @returns {string}
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}분 전`;
    }
    return `${hours}시간 전`;
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else {
    return date.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });
  }
}

/**
 * 로딩 표시
 */
function showLoading() {
  if (elements.loadingIndicator) {
    elements.loadingIndicator.removeAttribute('hidden');
    elements.loadingIndicator.style.display = 'flex';
  }
}

/**
 * 로딩 숨김
 */
function hideLoading() {
  if (elements.loadingIndicator) {
    elements.loadingIndicator.setAttribute('hidden', '');
    elements.loadingIndicator.style.display = 'none';
  }
}

/**
 * 종료 메시지 표시
 */
function showEndMessage() {
  if (elements.endMessage) {
    elements.endMessage.removeAttribute('hidden');
    elements.endMessage.style.display = 'block';
  }
}

/**
 * 에러 메시지 표시
 */
function showErrorMessage(message) {
  // 종료 메시지 요소를 에러 메시지로 재사용
  if (elements.endMessage) {
    elements.endMessage.innerHTML = `<p style="color: #ef4444;">${message}</p>`;
    elements.endMessage.removeAttribute('hidden');
    elements.endMessage.style.display = 'block';
  }
}

/**
 * 로그아웃 처리
 */
function handleLogout() {
  // 현재 사용자 상태 초기화
  state.currentUser = null;

  // 글쓰기 버튼 상태 업데이트
  updateWriteButtonState();
}

/**
 * 로그인 상태에 따라 글쓰기 버튼 텍스트 업데이트
 */
function updateWriteButtonState() {
  if (!elements.createBtn) return;

  const textSpan = elements.createBtn.querySelector('span:last-child');
  if (!textSpan) return;

  if (state.currentUser) {
    // 로그인 상태: 글쓰기
    textSpan.textContent = '글쓰기';
  } else {
    // 비로그인 상태: 로그인하고 글쓰기
    textSpan.textContent = '로그인하고 글쓰기';
  }
}

/**
 * 게시물 작성 버튼 클릭 핸들러
 */
async function handleCreateClick() {
  if (!state.currentUser) {
    // 비로그인 상태: 로그인 페이지로 리다이렉트 (redirect 파라미터 포함)
    const { storage } = await import('../../utils/storage.js');
    storage.set("redirect_after_signin", "/community/posts/create");
    navigation.goTo("/users/signin");
  } else {
    // 로그인 상태: 글쓰기 페이지로 이동
    navigation.goTo("/community/posts/create");
  }
}

// 페이지 로드 시 자동 실행
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
