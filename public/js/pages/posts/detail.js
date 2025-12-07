/**
 * Post Detail Page
 * 게시물 상세 페이지 로직
 */

import { PostsAPI } from "../../api/posts.js";
import { events } from "../../utils/events.js";
import { dom } from "../../utils/dom.js";
import { navigation } from "../../utils/navigation.js";
import { auth } from "../../utils/auth.js";
import { config } from "../../config.js";
import { createCommentCard } from "../../components/card.js";
import { Modal } from "../../components/modal.js";
import { Toast } from "../../components/toast.js";
import { initHeaderAuth } from "../../utils/header-init.js";
import { loadHeader as loadHeaderComponent } from "../../utils/component-loader.js";

const PAGE_ID = "posts-detail";

// 페이지 식별자 확인 (다른 페이지에서 실행 방지)
const root = dom.qs('[data-page="posts-detail"]');
if (!root) {
  throw new Error("Page script loaded on wrong page");
}

// 상태 관리
let state = {
  postId: null,
  post: null,
  isLoadingComments: false,
  hasNext: false,
  lastCommentId: null,
  comments: [],
  currentUser: null, // 현재 사용자 정보 저장
};

/**
 * URL에서 postId 추출
 */
function getPostIdFromUrl() {
  const path = window.location.pathname; // "/posts/1"
  const segments = path.split('/').filter(Boolean); // ["posts", "1"]
  const last = segments[segments.length - 1];
  return last || null;
}

/**
 * 게시물 상세 정보 로드
 */
async function loadPostDetail() {
  try {
    const response = await PostsAPI.getById(state.postId);

    if (response.status >= 200 && response.status < 300 && response.data) {
      state.post = response.data;
      renderPostDetail(response.data);
    } else {
      await Modal.alert("오류", "게시물을 불러올 수 없습니다.");
      navigation.goTo(config.ROUTES.HOME);
    }
  } catch (error) {
    console.error("Failed to load post:", error);
    await Modal.alert("오류", "게시물을 불러오는 중 오류가 발생했습니다.");
    navigation.goTo(config.ROUTES.HOME);
  }
}

/**
 * 날짜를 상대적 시간으로 변환
 * @param {string} dateString - ISO 8601 날짜 문자열
 * @returns {string} - 상대적 시간 표현
 */
function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return "방금 전";
  } else if (diffMin < 60) {
    return `${diffMin}분 전`;
  } else if (diffHour < 24) {
    return `${diffHour}시간 전`;
  } else if (diffDay < 7) {
    return `${diffDay}일 전`;
  } else {
    return date.toLocaleDateString("ko-KR");
  }
}

/**
 * 로그아웃 처리
 */
function handleLogout() {
  // 현재 사용자 상태 초기화
  state.currentUser = null;

  // UI 업데이트
  updateAuthUI();

  // 좋아요 상태 초기화 (필요 시)
  if (state.post) {
    state.post.isLiked = false;
  }

  // 수정/삭제 버튼 숨기기
  const actions = dom.qs('.post-actions');
  if (actions) {
    actions.remove();
  }
}

/**
 * 인증 상태에 따른 UI 업데이트
 */
function updateAuthUI() {
  const commentsSection = dom.qs("#comments-section");
  if (!commentsSection) return;

  const commentForm = dom.qs("#comment-form");
  const likeBtn = dom.qs("#like-btn");

  if (!state.currentUser) {
    // 비로그인 상태: 댓글 폼과 좋아요 버튼 숨기고 로그인 버튼 표시
    if (commentForm) {
      commentForm.style.display = 'none';
    }
    if (likeBtn) {
      likeBtn.style.display = 'none';
    }

    // "로그인하고 댓글 쓰기" 버튼 생성 및 삽입
    createLoginPrompt(commentsSection, commentForm);
  } else {
    // 로그인 상태: 댓글 폼과 좋아요 버튼 표시
    if (commentForm) {
      commentForm.style.display = 'block';
    }
    if (likeBtn) {
      likeBtn.style.display = 'inline-flex';
    }

    // 로그인 프롬프트 제거 (있다면)
    const loginPrompt = dom.qs("#login-prompt");
    if (loginPrompt) {
      loginPrompt.remove();
    }
  }
}

/**
 * 로그인 프롬프트 생성
 */
function createLoginPrompt(commentsSection, commentForm) {
  // 이미 존재하면 생성하지 않음
  if (dom.qs("#login-prompt")) return;

  const loginPrompt = document.createElement('div');
  loginPrompt.id = 'login-prompt';
  loginPrompt.className = 'login-prompt';
  loginPrompt.innerHTML = `
    <div class="login-prompt-content">
      <p class="login-prompt-text">댓글을 작성하려면 로그인이 필요합니다</p>
      <button class="login-prompt-btn" id="login-prompt-btn">
        로그인하고 댓글 쓰기
      </button>
    </div>
  `;

  // 댓글 폼 다음에 삽입
  if (commentForm && commentForm.nextSibling) {
    commentsSection.insertBefore(loginPrompt, commentForm.nextSibling);
  } else if (commentForm) {
    commentForm.parentNode.insertBefore(loginPrompt, commentForm.nextSibling);
  } else {
    // 댓글 폼이 없으면 댓글 섹션 상단에 삽입
    const commentsHeader = dom.qs(".comments-header", commentsSection);
    if (commentsHeader && commentsHeader.nextSibling) {
      commentsSection.insertBefore(loginPrompt, commentsHeader.nextSibling);
    } else {
      commentsSection.insertBefore(loginPrompt, commentsSection.firstChild);
    }
  }

  // 로그인 버튼 클릭 이벤트
  const loginBtn = dom.qs("#login-prompt-btn");
  if (loginBtn) {
    events.on(loginBtn, "click", async () => {
      const { storage } = await import("../../utils/storage.js");
      const currentPath = window.location.pathname;
      storage.set("redirect_after_signin", currentPath);
      navigation.goTo("/users/signin");
    }, { pageId: PAGE_ID });
  }
}

/**
 * 게시물 상세 렌더링
 */
function renderPostDetail(post) {
  const section = dom.qs("#post-detail-section");

  // 스켈레톤 로더 제거
  const skeletonLoader = dom.qs(".skeleton-loader", section);
  if (skeletonLoader) {
    skeletonLoader.remove();
  }

  // 기존 게시물 컨테이너 제거 (중복 방지)
  const existingArticle = dom.qs(".post-detail-content", section);
  if (existingArticle) {
    existingArticle.remove();
  }

  // 게시물 컨테이너 생성
  const article = document.createElement("article");
  article.className = "post-detail-content";
  article.dataset.postId = post.postId;

  // Topic badge if linked
  if (post.topicId) {
    const badge = document.createElement("div");
    badge.className = "topic-badge";
    badge.textContent = "🎯 WePick Today와 연동된 게시물";
    article.appendChild(badge);
  }

  // 1. 제목
  const title = document.createElement("h1");
  title.className = "post-title";
  title.textContent = post.title;
  article.appendChild(title);

  // 2. 작성자 정보 + 통계 + 수정/삭제 버튼
  const metaBar = document.createElement("div");
  metaBar.className = "meta-bar";

  const leftSection = document.createElement("div");
  leftSection.className = "meta-bar-left";

  // 작성자 정보
  const authorSection = document.createElement("div");
  authorSection.className = "author-section";

  const authorImage = document.createElement("img");
  authorImage.src = post.author.profileImageUrl || "/assets/imgs/profile_icon.svg";
  authorImage.alt = post.author.nickname;
  authorImage.className = "author-image";

  const authorInfo = document.createElement("div");
  authorInfo.className = "author-info";

  const authorName = document.createElement("span");
  authorName.className = "author-name";
  authorName.textContent = post.author.nickname;

  const postDate = document.createElement("span");
  postDate.className = "post-date";
  postDate.textContent = formatRelativeTime(post.createdAt);

  authorInfo.appendChild(authorName);
  authorInfo.appendChild(postDate);

  authorSection.appendChild(authorImage);
  authorSection.appendChild(authorInfo);
  leftSection.appendChild(authorSection);

  // 통계 (조회수, 좋아요, 댓글)
  const metaStats = document.createElement("div");
  metaStats.className = "post-meta-stats";

  const viewStat = document.createElement("span");
  viewStat.className = "post-stat";
  const viewIcon = document.createElement("img");
  viewIcon.className = "post-stat-icon";
  viewIcon.src = "/assets/imgs/view_icon.svg";
  viewIcon.alt = "조회수";
  const viewCount = document.createElement("span");
  viewCount.textContent = post.viewCount || 0;
  viewStat.appendChild(viewIcon);
  viewStat.appendChild(viewCount);

  const separator1 = document.createElement("span");
  separator1.className = "meta-separator";
  separator1.textContent = "·";

  const likeStat = document.createElement("span");
  likeStat.className = `post-stat ${post.isLiked ? "liked" : ""}`;
  likeStat.id = "like-stat";
  const likeIcon = document.createElement("img");
  likeIcon.className = "post-stat-icon";
  likeIcon.src = "/assets/imgs/like_icon.svg";
  likeIcon.alt = "좋아요";
  const likeCount = document.createElement("span");
  likeCount.textContent = post.likeCount || 0;
  likeStat.appendChild(likeIcon);
  likeStat.appendChild(likeCount);

  const separator2 = document.createElement("span");
  separator2.className = "meta-separator";
  separator2.textContent = "·";

  const commentStat = document.createElement("span");
  commentStat.className = "post-stat";
  const commentIcon = document.createElement("img");
  commentIcon.className = "post-stat-icon";
  commentIcon.src = "/assets/imgs/comment_icon.svg";
  commentIcon.alt = "댓글";
  const commentCount = document.createElement("span");
  commentCount.textContent = post.commentCount || 0;
  commentStat.appendChild(commentIcon);
  commentStat.appendChild(commentCount);

  metaStats.appendChild(viewStat);
  metaStats.appendChild(separator1);
  metaStats.appendChild(likeStat);
  metaStats.appendChild(separator2);
  metaStats.appendChild(commentStat);

  metaBar.appendChild(leftSection);
  metaBar.appendChild(metaStats);

  // 작성자인 경우 수정/삭제 버튼
  if (post.isAuthor) {
    const actions = document.createElement("div");
    actions.className = "post-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "action-btn";
    editBtn.textContent = "수정";
    editBtn.dataset.action = "edit";

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "action-btn delete-btn";
    deleteBtn.textContent = "삭제";
    deleteBtn.dataset.action = "delete";

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    metaBar.appendChild(actions);
  }

  article.appendChild(metaBar);

  // 4. 이미지
  const images = post.images || (post.imageUrls ? post.imageUrls.map(url => ({ imageUrl: url })) : []);

  if (images.length > 0) {
    const imageContainer = document.createElement("div");
    imageContainer.className = "post-images";

    images.forEach((image, index) => {
      const img = document.createElement("img");
      img.src = image.imageUrl || image;
      img.alt = `Post image ${index + 1}`;
      img.className = "post-image";
      img.loading = "lazy";
      imageContainer.appendChild(img);
    });

    article.appendChild(imageContainer);
  }

  // 5. 내용
  const content = document.createElement("div");
  content.className = "post-content";
  content.textContent = post.content;
  article.appendChild(content);

  // 6. 좋아요 버튼
  const likeSection = document.createElement("div");
  likeSection.className = "like-section";

  const likeBtn = document.createElement("button");
  likeBtn.className = `like-btn ${post.isLiked ? "liked" : ""}`;
  likeBtn.id = "like-btn";

  const likeBtnIcon = document.createElement("img");
  likeBtnIcon.className = "like-icon heart-icon";
  likeBtnIcon.src = "/assets/imgs/like_icon.svg";
  likeBtnIcon.alt = "좋아요";

  const likeText = document.createElement("span");
  likeText.className = "like-text";
  likeText.textContent = "좋아요";

  const likeBtnCount = document.createElement("span");
  likeBtnCount.className = "like-count";
  likeBtnCount.id = "like-btn-count";
  likeBtnCount.textContent = post.likeCount;

  likeBtn.appendChild(likeBtnIcon);
  likeBtn.appendChild(likeText);
  likeBtn.appendChild(likeBtnCount);

  likeSection.appendChild(likeBtn);
  article.appendChild(likeSection);

  section.appendChild(article);

  // 이벤트 리스너 등록
  setupPostEventListeners();

  // 초기 댓글 수 표시
  updateCommentCount();
}

/**
 * 게시물 이벤트 리스너 설정
 */
function setupPostEventListeners() {
  const section = dom.qs("#post-detail-section");

  // 수정 버튼
  const editBtn = dom.qs('[data-action="edit"]', section);
  if (editBtn) {
    events.on(editBtn, "click", handleEditPost, { pageId: PAGE_ID });
  }

  // 삭제 버튼
  const deleteBtn = dom.qs('[data-action="delete"]', section);
  if (deleteBtn) {
    events.on(deleteBtn, "click", handleDeletePost, { pageId: PAGE_ID });
  }

  // 좋아요 버튼
  const likeBtn = dom.qs("#like-btn");
  if (likeBtn) {
    events.on(likeBtn, "click", handleLikeToggle, { pageId: PAGE_ID });
  }
}

/**
 * 게시물 수정 핸들러
 */
function handleEditPost() {
  navigation.goTo(`/community/posts/edit/${state.postId}`);
}

/**
 * 게시물 삭제 핸들러
 */
async function handleDeletePost() {
  const confirmed = confirm(
    "정말로 이 게시물을 삭제하시겠습니까?\n삭제된 게시물은 영구적으로 삭제되며 복구할 수 없습니다."
  );

  if (!confirmed) return;

  try {
    await PostsAPI.delete(state.postId);
    // 삭제 성공 시 바로 목록으로 이동
    navigation.goTo("/community/posts");
  } catch (error) {
    console.error("Failed to delete post:", error);
    alert("게시물 삭제 중 오류가 발생했습니다.");
  }
}

/**
 * 좋아요 토글 핸들러
 */
async function handleLikeToggle() {
  if (!state.post) return;

  // 로그인 확인
  if (!state.currentUser) {
    const { storage } = await import('../../utils/storage.js');
    storage.set("redirect_after_signin", window.location.pathname);
    navigation.goTo("/users/signin");
    return;
  }

  const isLiked = state.post.isLiked;

  try {
    const response = isLiked
      ? await PostsAPI.unlike(state.postId)
      : await PostsAPI.like(state.postId);

    if (response.status >= 200 && response.status < 300) {
      // 상태 업데이트
      state.post.isLiked = !isLiked;
      state.post.likeCount += isLiked ? -1 : 1;

      // 좋아요 버튼 UI 업데이트
      const likeBtn = dom.qs("#like-btn");
      if (likeBtn) {
        likeBtn.className = `like-btn ${state.post.isLiked ? "liked" : ""}`;
        const likeBtnCount = dom.qs("#like-btn-count", likeBtn);
        if (likeBtnCount) {
          likeBtnCount.textContent = state.post.likeCount;
        }
      }

      // 통계 영역의 좋아요 수 업데이트
      const likeStat = dom.qs("#like-stat");
      if (likeStat) {
        likeStat.className = `post-stat ${state.post.isLiked ? "liked" : ""}`;
        const likeStatCount = likeStat.querySelector("span:last-child");
        if (likeStatCount) {
          likeStatCount.textContent = state.post.likeCount;
        }
      }
    } else {
      Toast.error(response.error?.message || "좋아요 처리에 실패했습니다.");
    }
  } catch (error) {
    console.error("Failed to toggle like:", error);
    Toast.error("좋아요 처리 중 오류가 발생했습니다.");
  }
}

/**
 * 초기 댓글 목록 로드
 */
async function loadInitialComments() {
  if (state.isLoadingComments) return;

  state.isLoadingComments = true;

  try {
    const response = await PostsAPI.getComments(
      state.postId,
      null, // 초기 로드는 lastCommentId 없음
      config.PAGINATION.COMMENT_SIZE
    );

    if (response.status >= 200 && response.status < 300 && response.data) {
      const { comments, hasNext, lastCommentId } = response.data;

      state.comments = comments || [];
      state.hasNext = hasNext;
      state.lastCommentId = lastCommentId;

      // 댓글 렌더링
      renderComments(state.comments, false);
      
      // "이전 댓글 보기" 버튼 표시/숨김
      updateLoadMoreButton();
    }
  } catch (error) {
    console.error("Failed to load comments:", error);
  } finally {
    state.isLoadingComments = false;
  }
}

/**
 * 이전 댓글 로드 (페이지네이션)
 */
async function loadMoreComments() {
  if (state.isLoadingComments || !state.hasNext) return;

  state.isLoadingComments = true;
  
  const loadMoreBtn = dom.qs("#load-more-btn");
  if (loadMoreBtn) {
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = '로딩 중...';
  }

  // 스크롤 위치 보정을 위해 첫 번째 댓글을 기준점으로 저장
  const container = dom.qs("#comments-list");
  const firstComment = container.firstElementChild;
  const anchorOffset = firstComment ? firstComment.getBoundingClientRect().top : 0;

  try {
    const response = await PostsAPI.getComments(
      state.postId,
      state.lastCommentId,
      config.PAGINATION.COMMENT_SIZE
    );

    if (response.status >= 200 && response.status < 300 && response.data) {
      const { comments, hasNext, lastCommentId } = response.data;

      if (comments && comments.length > 0) {
        // 기존 댓글 앞에 추가 (이전 댓글이므로)
        state.comments = [...comments, ...state.comments];
        state.hasNext = hasNext;
        state.lastCommentId = lastCommentId;

        // 이전 댓글을 맨 위에 추가
        renderComments(comments, true);
        
        // "이전 댓글 보기" 버튼 업데이트
        updateLoadMoreButton();

        // 스크롤 위치 보정: 기준점 댓글의 위치를 유지
        if (firstComment) {
          const newOffset = firstComment.getBoundingClientRect().top;
          const scrollDiff = newOffset - anchorOffset;
          if (scrollDiff !== 0) {
            window.scrollBy({
              top: scrollDiff,
              behavior: 'instant' // 즉시 이동 (애니메이션 없음)
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("Failed to load more comments:", error);
  } finally {
    state.isLoadingComments = false;


    if (loadMoreBtn) {
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = '↑ 이전 댓글 보기';
    }
  }
}

/**
 * 댓글 렌더링
 * @param {Array} comments - 렌더링할 댓글 배열
 * @param {boolean} prepend - true면 맨 위에 추가, false면 맨 아래에 추가
 */
function renderComments(comments, prepend = false) {
  const container = dom.qs("#comments-list");
  
  comments.forEach((comment) => {
    // 중복 체크
    const existingComment = dom.qs(`[data-comment-id="${comment.commentId}"]`, container);
    if (existingComment) {
      return;
    }

    const commentCard = createCommentCard(comment);
    
    if (prepend) {
      container.insertBefore(commentCard, container.firstChild);
    } else {
      container.appendChild(commentCard);
    }

    // 댓글 수정/삭제 이벤트 리스너
    if (comment.isAuthor) {
      const editBtn = dom.qs('[data-action="edit"]', commentCard);
      const deleteBtn = dom.qs('[data-action="delete"]', commentCard);

      if (editBtn) {
        events.on(editBtn, "click", () => handleEditComment(comment.commentId), {
          pageId: PAGE_ID,
        });
      }

      if (deleteBtn) {
        events.on(deleteBtn, "click", () => handleDeleteComment(comment.commentId), {
          pageId: PAGE_ID,
        });
      }
    }
  });
}

/**
 * "이전 댓글 보기" 버튼 표시/숨김
 */
function updateLoadMoreButton() {
  const loadMoreContainer = dom.qs("#load-more-container");
  if (loadMoreContainer) {
    if (state.hasNext) {
      loadMoreContainer.removeAttribute('hidden');
    } else {
      loadMoreContainer.setAttribute('hidden', '');
    }
  }
}

/**
 * 댓글 수 업데이트
 */
function updateCommentCount() {
  const countElement = dom.qs("#comment-count");
  if (countElement && state.post) {
    // 게시물의 총 댓글 수를 표시 (로드된 개수가 아님)
    countElement.textContent = state.post.commentCount || 0;
  }
}

/**
 * 댓글 작성 핸들러 (낙관적 업데이트)
 */
async function handleCommentSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const contentInput = dom.qs("#comment-content", form);
  const submitBtn = form.querySelector('button[type="submit"]');
  const content = contentInput.value.trim();

  // 유효성 검사
  if (!content) {
    alert("댓글 내용을 입력해주세요.");
    return;
  }

  if (content.length > 300) {
    alert("댓글은 최대 300자까지 입력 가능합니다.");
    return;
  }

  // 버튼 비활성화 (중복 제출 방지)
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = '등록 중...';
  }

  // 낙관적 업데이트: 임시 댓글 생성
  const tempComment = {
    commentId: `temp-${Date.now()}`,
    content: content,
    author: {
      nickname: state.currentUser?.nickname || "나",
      profileImageUrl: state.currentUser?.profileImageUrl || null,
    },
    isAuthor: true,
    createdAt: new Date().toISOString(),
  };

  // 임시 댓글을 UI에 추가
  const container = dom.qs("#comments-list");
  const tempCard = createCommentCard(tempComment, true);
  container.appendChild(tempCard);

  // 폼 초기화
  form.reset();

  // 글자 수 카운터 초기화
  const charCounter = dom.qs(".char-counter");
  if (charCounter) {
    const charCount = dom.qs("#char-count", charCounter);
    if (charCount) {
      charCount.textContent = "0";
    }
    charCounter.className = "char-counter";
  }

  // 게시물의 댓글 수 업데이트 (낙관적)
  if (state.post) {
    state.post.commentCount = (state.post.commentCount || 0) + 1;
    updateCommentCount();
  }

  // 새 댓글로 스크롤
  setTimeout(() => {
    tempCard.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 100);

  try {
    const response = await PostsAPI.createComment(state.postId, content);

    if (response.status >= 200 && response.status < 300 && response.data) {
      // 성공: 임시 댓글을 실제 댓글로 교체
      const realComment = response.data;
      
      // 임시 댓글 제거
      tempCard.remove();
      
      // 실제 댓글 추가
      const realCard = createCommentCard(realComment);
      container.appendChild(realCard);
      
      // 상태 업데이트
      state.comments.push(realComment);

      // 댓글 이벤트 리스너 설정
      if (realComment.isAuthor) {
        const editBtn = dom.qs('[data-action="edit"]', realCard);
        const deleteBtn = dom.qs('[data-action="delete"]', realCard);

        if (editBtn) {
          events.on(editBtn, "click", () => handleEditComment(realComment.commentId), {
            pageId: PAGE_ID,
          });
        }

        if (deleteBtn) {
          events.on(deleteBtn, "click", () => handleDeleteComment(realComment.commentId), {
            pageId: PAGE_ID,
          });
        }
      }

      // 하이라이트 효과
      realCard.classList.add("new-comment-highlight");
      setTimeout(() => {
        realCard.classList.remove("new-comment-highlight");
      }, 3000);

      // 실제 댓글로 스크롤
      setTimeout(() => {
        realCard.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    } else {
      // 실패: 임시 댓글 제거 및 댓글 수 복구
      tempCard.remove();
      if (state.post) {
        state.post.commentCount = Math.max(0, (state.post.commentCount || 0) - 1);
        updateCommentCount();
      }
      alert(response.error?.message || "댓글 작성에 실패했습니다.");
    }
  } catch (error) {
    console.error("Failed to create comment:", error);
    // 실패: 임시 댓글 제거 및 댓글 수 복구
    tempCard.remove();
    if (state.post) {
      state.post.commentCount = Math.max(0, (state.post.commentCount || 0) - 1);
      updateCommentCount();
    }
    alert("댓글 작성 중 오류가 발생했습니다.");
  } finally {
    // 버튼 활성화
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '댓글 등록';
    }
  }
}

/**
 * 댓글 수정 핸들러 (인라인 편집)
 */
function handleEditComment(commentId) {
  // 댓글 수정은 현재 인라인 편집으로 구현되어 있습니다.
  // 향후 별도 수정 페이지가 필요하면 아래와 같이 구현할 수 있습니다:
  // navigation.goTo(`/community/posts/${state.postId}/comments/${commentId}/edit`);

  const comment = state.comments.find((c) => c.commentId === commentId);
  if (!comment) return;

  const commentCard = dom.qs(`[data-comment-id="${commentId}"]`);
  if (!commentCard) return;

  const cardBody = dom.qs(".comment-content", commentCard)?.parentElement;
  if (!cardBody) return;

  // 이미 편집 모드인지 확인
  const existingEditForm = dom.qs(".comment-edit-form", cardBody);
  if (existingEditForm) {
    return; // 이미 편집 중이면 무시
  }

  // 기존 내용 저장
  const originalContent = comment.content;

  // 편집 폼 생성
  const editForm = document.createElement("div");
  editForm.className = "comment-edit-form";

  const textarea = document.createElement("textarea");
  textarea.className = "comment-textarea";
  textarea.rows = 3;
  textarea.maxLength = 300;
  textarea.value = originalContent;

  const controlsDiv = document.createElement("div");
  controlsDiv.className = "comment-edit-controls";

  const charCountSmall = document.createElement("small");
  charCountSmall.className = "char-counter";
  charCountSmall.innerHTML = `<span class="edit-char-count">${originalContent.length}</span> / 300자`;

  const buttonsDiv = document.createElement("div");
  buttonsDiv.className = "comment-edit-buttons";

  const saveBtn = document.createElement("button");
  saveBtn.className = "comment-edit-btn save-btn";
  saveBtn.textContent = "댓글 수정하기";

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "comment-edit-btn";
  cancelBtn.textContent = "취소";

  buttonsDiv.appendChild(saveBtn);
  buttonsDiv.appendChild(cancelBtn);
  controlsDiv.appendChild(charCountSmall);
  controlsDiv.appendChild(buttonsDiv);
  editForm.appendChild(textarea);
  editForm.appendChild(controlsDiv);

  // 기존 내용 숨기기
  const contentElement = dom.qs(".comment-content", cardBody);
  const actionsElement = cardBody.querySelector(".d-flex.gap-2");
  if (contentElement) contentElement.style.display = "none";
  if (actionsElement) actionsElement.style.display = "none";

  // 편집 폼 추가
  cardBody.appendChild(editForm);

  // 글자 수 카운터 업데이트
  const updateEditCharCount = () => {
    const currentLength = textarea.value.length;
    const charCountSpan = editForm.querySelector(".edit-char-count");
    if (charCountSpan) {
      charCountSpan.textContent = currentLength;

      if (currentLength >= 300) {
        charCountSpan.parentElement.className = "char-counter danger";
      } else if (currentLength >= 270) {
        charCountSpan.parentElement.className = "char-counter warning";
      } else {
        charCountSpan.parentElement.className = "char-counter";
      }
    }
  };

  textarea.addEventListener("input", updateEditCharCount);
  textarea.focus();

  // 취소 버튼
  cancelBtn.addEventListener("click", () => {
    editForm.remove();
    if (contentElement) contentElement.style.display = "";
    if (actionsElement) actionsElement.style.display = "";
  });

  // 저장 버튼
  saveBtn.addEventListener("click", async () => {
    const newContent = textarea.value.trim();

    if (!newContent) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }

    if (newContent.length > 300) {
      alert("댓글은 최대 300자까지 입력 가능합니다.");
      return;
    }

    if (newContent === originalContent) {
      // 변경사항 없음
      editForm.remove();
      if (contentElement) contentElement.style.display = "";
      if (actionsElement) actionsElement.style.display = "";
      return;
    }

    // 버튼 비활성화
    saveBtn.disabled = true;
    saveBtn.textContent = '수정 중...';

    try {
      const response = await PostsAPI.updateComment(
        state.postId,
        commentId,
        newContent
      );

      if (response.status >= 200 && response.status < 300) {
        // 상태 업데이트
        comment.content = newContent;
        comment.updatedAt = new Date().toISOString();

        // UI 업데이트
        if (contentElement) {
          contentElement.textContent = newContent;
        }

        // 편집 폼 제거 및 원래 내용 표시
        editForm.remove();
        if (contentElement) contentElement.style.display = "";
        if (actionsElement) actionsElement.style.display = "";

        // 하이라이트 효과
        commentCard.classList.add("new-comment-highlight");
        setTimeout(() => {
          commentCard.classList.remove("new-comment-highlight");
        }, 3000);
      } else {
        alert(response.error?.message || "댓글 수정에 실패했습니다.");
        saveBtn.disabled = false;
        saveBtn.textContent = "댓글 수정하기";
      }
    } catch (error) {
      console.error("Failed to update comment:", error);
      alert("댓글 수정 중 오류가 발생했습니다.");
      saveBtn.disabled = false;
      saveBtn.textContent = "댓글 수정하기";
    }
  });
}

/**
 * 댓글 삭제 핸들러
 */
async function handleDeleteComment(commentId) {
  const confirmed = confirm("정말로 이 댓글을 삭제하시겠습니까?");

  if (!confirmed) return;

  try {
    await PostsAPI.deleteComment(state.postId, commentId);

    // 상태에서 제거
    state.comments = state.comments.filter((c) => c.commentId !== commentId);

    // UI에서 제거
    const commentCard = dom.qs(`[data-comment-id="${commentId}"]`);
    if (commentCard) {
      commentCard.remove();
    }

    // 댓글 수 업데이트
    updateCommentCount();

    // 게시물의 댓글 수도 업데이트
    if (state.post) {
      state.post.commentCount = Math.max(0, (state.post.commentCount || 0) - 1);
    }
  } catch (error) {
    console.error("Failed to delete comment:", error);
    alert("댓글 삭제 중 오류가 발생했습니다.");
  }
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
  // 댓글 작성 폼
  const commentForm = dom.qs("#comment-form");
  if (commentForm) {
    events.on(commentForm, "submit", handleCommentSubmit, { pageId: PAGE_ID });
  }

  // 댓글 입력창 글자 수 카운터
  const commentContent = dom.qs("#comment-content");
  const charCount = dom.qs("#char-count");
  
  if (commentContent && charCount) {
    // 초기 글자 수 표시
    updateCharCount(commentContent, charCount);
    
    // 입력 시 실시간 업데이트
    events.on(commentContent, "input", () => {
      updateCharCount(commentContent, charCount);
    }, { pageId: PAGE_ID });
  }

  // "이전 댓글 보기" 버튼
  const loadMoreBtn = dom.qs("#load-more-btn");
  if (loadMoreBtn) {
    events.on(loadMoreBtn, "click", loadMoreComments, { pageId: PAGE_ID });
  }
}

/**
 * 글자 수 카운터 업데이트
 */
function updateCharCount(textarea, countElement) {
  const currentLength = textarea.value.length;
  const maxLength = 300;

  countElement.textContent = currentLength;

  // 글자 수에 따라 색상 변경
  const parentElement = countElement.parentElement;
  if (currentLength >= maxLength) {
    parentElement.className = "char-counter danger";
  } else if (currentLength >= maxLength * 0.9) {
    parentElement.className = "char-counter warning";
  } else {
    parentElement.className = "char-counter";
  }
}

/**
 * 페이지 초기화
 */
async function init() {
  // Load header and footer HTML
  await loadHeader();
  await loadFooter();

  // Initialize header auth state and get current user (한 번만 호출)
  const user = await initHeaderAuth();
  if (user) {
    state.currentUser = user;
  }

  // postId 추출
  state.postId = getPostIdFromUrl();
  if (!state.postId) {
    console.error("Invalid post ID");
    navigation.goTo(config.ROUTES.HOME);
    return;
  }

  // 게시물 로드
  await loadPostDetail();

  // 초기 댓글 로드
  await loadInitialComments();

  // 인증 상태에 따른 UI 업데이트
  updateAuthUI();

  // 이벤트 리스너 설정
  setupEventListeners();

  // 로그아웃 이벤트 리스너
  window.addEventListener('userLoggedOut', handleLogout);
}

/**
 * 헤더 HTML 로드
 */
async function loadHeader() {
  await loadHeaderComponent();

  // 뒤로가기 버튼 활성화 및 이벤트 추가
  initBackButton();
}

/**
 * Footer HTML 로드
 */
async function loadFooter() {
  const footerContainer = document.querySelector('footer');
  if (!footerContainer) return;

  try {
    const response = await fetch('/components/footer.html');
    const html = await response.text();
    footerContainer.innerHTML = html;
  } catch (error) {
    console.error('Failed to load footer:', error);
  }
}

/**
 * 뒤로가기 버튼 초기화
 */
function initBackButton() {
  const backBtn = document.getElementById('headerBackBtn');
  if (!backBtn) return;

  // 버튼 표시
  backBtn.removeAttribute('hidden');

  // 클릭 이벤트 추가
  backBtn.addEventListener('click', () => {
    // 커뮤니티 목록 페이지로 이동
    navigation.goTo('/community/posts');
  });
}

/**
 * 정리 함수
 */
function cleanup() {
  events.removeAllForPage(PAGE_ID);
}

// 초기화 상태 추적
let isInitialized = false;

// 페이지 로드 시 자동 실행
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    if (!isInitialized) {
      isInitialized = true;
      init();
    }
  });
} else {
  if (!isInitialized) {
    isInitialized = true;
    init();
  }
}

// 뒤로가기/앞으로가기 시 페이지 복원 처리 (bfcache)
window.addEventListener("pageshow", (event) => {
  // bfcache에서 복원된 경우
  if (event.persisted) {
    console.log("Page restored from bfcache, reinitializing...");
    // 상태 초기화
    isInitialized = false;
    // 페이지 재초기화
    if (!isInitialized) {
      isInitialized = true;
      init();
    }
  }
});

// 페이지 언로드 시 정리
window.addEventListener("pagehide", cleanup);
