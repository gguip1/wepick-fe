/**
 * Posts List Page Module
 * 게시물 목록 페이지
 */

import { PostsAPI } from "../../api/posts.js";
import { navigation } from "../../utils/navigation.js";
import { initHeaderAuth } from "../../utils/header-init.js";

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

  // Initialize header auth state
  await initHeaderAuth();

  // 이벤트 리스너 설정
  setupEventListeners();

  // 초기 게시물 로드
  await loadPosts();

  // 무한 스크롤 설정
  setupInfiniteScroll();
}

/**
 * 헤더 HTML 로드
 */
async function loadHeader() {
  const headerContainer = document.getElementById('headerContainer');
  if (!headerContainer) return;

  try {
    const response = await fetch('/components/header.html');
    const html = await response.text();
    headerContainer.innerHTML = html;
  } catch (error) {
    console.error('Failed to load header:', error);
  }
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
 */
async function loadPosts() {
  if (state.isLoading || !state.hasNext) {
    return;
  }

  state.isLoading = true;
  showLoading();

  try {
    // 로컬 로딩 인디케이터를 사용하므로 전역 로딩 비활성화
    const response = await PostsAPI.getList(state.lastPostId, { showLoading: false });

    if (response.status >= 200 && response.status < 300 && response.data) {
      const { posts, lastPostId, hasNext } = response.data;

      // 게시물 렌더링
      renderPosts(posts);

      // 상태 업데이트
      state.lastPostId = lastPostId;
      state.hasNext = hasNext;
    } else {
      console.error("Failed to load posts:", response.error);
    }
  } catch (error) {
    console.error("Error loading posts:", error);
  } finally {
    state.isLoading = false;

    // 더 이상 게시물이 없으면 종료 메시지 표시 후 로딩 숨김
    if (!state.hasNext) {
      hideLoading();
      showEndMessage();
    } else {
      hideLoading();
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
 * 게시물 아이템 생성
 * @param {Object} post - Post data
 * @returns {HTMLElement}
 */
function createPostItem(post) {
  const item = document.createElement('div');
  item.className = 'post-item';
  item.dataset.postId = post.postId;
  item.addEventListener('click', () => {
    navigation.goTo(`/posts/${post.postId}`);
  });

  // Post Header
  const header = document.createElement('div');
  header.className = 'post-header';

  const titleSection = document.createElement('div');
  titleSection.className = 'post-title-section';

  const postNumber = document.createElement('span');
  postNumber.className = 'post-number';
  postNumber.textContent = `#${post.postId}`;

  const title = document.createElement('h3');
  title.className = 'post-title';
  title.textContent = post.title;

  titleSection.appendChild(postNumber);
  titleSection.appendChild(title);

  // Topic badge if linked
  if (post.topicId) {
    const badge = document.createElement('span');
    badge.className = 'topic-badge';
    badge.textContent = 'WePick';
    titleSection.appendChild(badge);
  }

  header.appendChild(titleSection);

  // Post Meta
  const meta = document.createElement('div');
  meta.className = 'post-meta';

  // Author section with profile image
  const authorSection = document.createElement('div');
  authorSection.className = 'post-author-section';

  const authorImage = document.createElement('img');
  authorImage.className = 'post-author-image';
  authorImage.src = post.author?.profileImageUrl || '/assets/imgs/profile_icon.svg';
  authorImage.alt = 'Profile';

  const author = document.createElement('span');
  author.className = 'post-author';
  author.textContent = post.author?.nickname || '알 수 없음';

  authorSection.appendChild(authorImage);
  authorSection.appendChild(author);

  const separator1 = document.createElement('span');
  separator1.className = 'meta-separator';
  separator1.textContent = '·';

  const date = document.createElement('span');
  date.className = 'post-date';
  date.textContent = formatDate(post.createdAt);

  const stats = document.createElement('div');
  stats.className = 'post-stats';

  const viewsItem = document.createElement('div');
  viewsItem.className = 'post-stat-item';
  const viewsIcon = document.createElement('span');
  viewsIcon.className = 'post-stat-icon';
  viewsIcon.textContent = '👁';
  const views = document.createElement('span');
  views.className = 'post-views';
  views.textContent = post.viewCount || 0;
  viewsItem.appendChild(viewsIcon);
  viewsItem.appendChild(views);

  const likesItem = document.createElement('div');
  likesItem.className = 'post-stat-item';
  const likesIcon = document.createElement('span');
  likesIcon.className = 'post-stat-icon';
  likesIcon.textContent = '♡';
  const likes = document.createElement('span');
  likes.className = 'post-likes';
  likes.textContent = post.likeCount || 0;
  likesItem.appendChild(likesIcon);
  likesItem.appendChild(likes);

  const commentsItem = document.createElement('div');
  commentsItem.className = 'post-stat-item';
  const commentsIcon = document.createElement('span');
  commentsIcon.className = 'post-stat-icon';
  commentsIcon.textContent = '💬';
  const comments = document.createElement('span');
  comments.className = 'post-comments';
  comments.textContent = post.commentCount || 0;
  commentsItem.appendChild(commentsIcon);
  commentsItem.appendChild(comments);

  stats.appendChild(viewsItem);
  stats.appendChild(likesItem);
  stats.appendChild(commentsItem);

  meta.appendChild(authorSection);
  meta.appendChild(separator1);
  meta.appendChild(date);
  meta.appendChild(stats);

  item.appendChild(header);
  item.appendChild(meta);

  return item;
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
 * 게시물 작성 버튼 클릭 핸들러
 */
function handleCreateClick() {
  navigation.goTo("/posts/create");
}

// 페이지 로드 시 자동 실행
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
