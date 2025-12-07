/**
 * WePick Today Choice Page
 * 오늘의 선택/결과 페이지 로직
 *
 * API 응답 형식 (GET /api/topics/today):
 * {
 *   topicId: number,
 *   title: string,
 *   description: string,
 *   targetDate: "YYYY-MM-DD",
 *   status: "OPEN" | "CLOSED",
 *   options: [
 *     { optionId, label: "A", text, description, voteCount, percent },
 *     { optionId, label: "B", text, description, voteCount, percent }
 *   ],
 *   totalVotes: number,
 *   votedOptionId: number | null
 * }
 */

import { TopicsAPI } from '/shared/api/topics.js';
import { auth } from '/shared/utils/auth.js';
import { GaugeBar } from '/shared/components/gauge-bar.js';
import { initHeaderAuth } from '/shared/utils/header-init.js';
import { loadHeader, loadFooter } from '/shared/utils/component-loader.js';
import { showMessage } from '/shared/utils/message.js';

const PAGE_ID = "wepick-today";

// Page state
let currentTopic = null;
let selectedOptionId = null;
let gaugeBar = null;
let currentUser = null;

// DOM Elements
let loadingSkeleton, voteContent, voteSection, topicQuestion;
let mainGaugeBar, voteCardsContainer, voteCards, voteButton;
let resultStats, shareButton;

/**
 * Initialize page
 */
async function init() {
  try {
    // Load header and footer
    await loadHeader();
    await loadFooter();

    // Initialize DOM elements
    initializeDOMElements();

    // Initialize header auth state
    const user = await initHeaderAuth();
    if (user) {
      currentUser = user;
    }

    // Fetch today's topic
    const response = await TopicsAPI.getTodayTopic();

    // Hide loading skeleton
    loadingSkeleton.style.display = 'none';

    // 404: 오늘의 토픽이 없는 경우
    if (response.status === 404 || (!response.data && !response.error)) {
      showNoTopicUI();
      return;
    }

    // 기타 에러
    if (response.error) {
      showError('오늘의 토픽을 불러오는데 실패했습니다.');
      voteContent.removeAttribute('hidden');
      return;
    }

    currentTopic = response.data;

    // Show content
    voteContent.removeAttribute('hidden');

    // Update UI with topic data
    updateTopicUI(currentTopic);

    // Check vote status from API response
    checkVoteStatus(currentTopic);

    // Setup event listeners
    setupEventListeners();

    // Listen for logout event
    window.addEventListener('userLoggedOut', handleLogout);

  } catch (error) {
    console.error('Failed to initialize page:', error);
    loadingSkeleton.style.display = 'none';
    voteContent.removeAttribute('hidden');
    showError('페이지를 불러오는데 실패했습니다.');
  }
}

/**
 * Handle logout
 */
function handleLogout() {
  currentUser = null;
  // 로그아웃 시 투표 UI로 전환 (퍼센트 숨김)
  showVoteUI();
}

/**
 * Get option by label (A or B)
 */
function getOptionByLabel(topic, label) {
  return topic.options.find(opt => opt.label === label);
}

/**
 * Get option by ID
 */
function getOptionById(topic, optionId) {
  return topic.options.find(opt => opt.optionId === optionId);
}

/**
 * Update UI with topic data
 */
function updateTopicUI(topic) {
  // Update question (title)
  topicQuestion.textContent = topic.title;

  const optionA = getOptionByLabel(topic, 'A');
  const optionB = getOptionByLabel(topic, 'B');

  // Update Option A
  document.getElementById('optionATitle').textContent = optionA.text;
  document.getElementById('optionADescription').textContent = optionA.description;

  // Update Option B
  document.getElementById('optionBTitle').textContent = optionB.text;
  document.getElementById('optionBDescription').textContent = optionB.description;

  // Update gauge labels
  document.getElementById('gaugeOptionALabel').textContent = optionA.text;
  document.getElementById('gaugeOptionBLabel').textContent = optionB.text;

  // Store optionId in data attributes for voting
  const cardA = document.querySelector('.vote-card[data-choice="A"]');
  const cardB = document.querySelector('.vote-card[data-choice="B"]');
  if (cardA) cardA.dataset.optionId = optionA.optionId;
  if (cardB) cardB.dataset.optionId = optionB.optionId;
}

/**
 * Check vote status from API response
 * votedOptionId가 있으면 이미 투표한 것
 */
function checkVoteStatus(topic) {
  const optionA = getOptionByLabel(topic, 'A');
  const optionB = getOptionByLabel(topic, 'B');

  // 퍼센트 값 추출 (숫자로 변환)
  const percentA = optionA ? Number(optionA.percent) : 0;
  const percentB = optionB ? Number(optionB.percent) : 0;

  if (topic.votedOptionId !== null && topic.votedOptionId !== undefined) {
    // User has voted - show results
    const votedOption = getOptionById(topic, topic.votedOptionId);

    showResultUI({
      percentageA: percentA,
      percentageB: percentB,
      totalVotes: topic.totalVotes,
      userChoice: votedOption ? votedOption.label : null,
      userChoiceText: votedOption ? votedOption.text : null
    });
  } else {
    // Not voted - show vote UI (퍼센트 숨김)
    showVoteUI();
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Vote card click
  voteCards.forEach(card => {
    card.addEventListener('click', handleCardClick);
    card.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        handleCardClick.call(card, e);
      }
    });
  });

  // Vote button click
  voteButton.addEventListener('click', handleVoteSubmit);

  // Share button click
  shareButton.addEventListener('click', handleShareClick);
}

/**
 * Handle vote card click
 */
function handleCardClick(e) {
  const card = e.currentTarget;
  const choice = card.dataset.choice;
  const optionId = parseInt(card.dataset.optionId, 10);

  // Remove selection from all cards
  voteCards.forEach(c => c.classList.remove('selected'));

  // Add selection to clicked card
  card.classList.add('selected');

  // Update selected option
  selectedOptionId = optionId;

  // Highlight corresponding gauge bar option
  mainGaugeBar.classList.remove('highlight-a', 'highlight-b');
  mainGaugeBar.classList.add(`highlight-${choice.toLowerCase()}`);

  // Enable vote button
  voteButton.disabled = false;
  voteButton.textContent = '투표하기';
}

/**
 * Handle vote submit
 */
async function handleVoteSubmit() {
  if (!selectedOptionId) {
    return;
  }

  // Check login status
  const user = await auth.getAuthUser();

  if (!user) {
    // Redirect to login with return URL
    const currentPath = window.location.pathname + window.location.search;
    window.location.href = `/users/signin?redirect=${encodeURIComponent(currentPath)}&action=vote`;
    return;
  }

  // Disable button during submission
  voteButton.disabled = true;
  voteButton.textContent = '투표 중...';

  try {
    // Submit vote with optionId
    const response = await TopicsAPI.submitVote(currentTopic.topicId, selectedOptionId);

    if (response.error) {
      // Handle specific errors
      if (response.status === 409) {
        showError('이미 투표하셨습니다.');
        // Refresh to show results
        const refreshResponse = await TopicsAPI.getTodayTopic();
        if (refreshResponse.data) {
          currentTopic = refreshResponse.data;
          checkVoteStatus(currentTopic);
        }
      } else if (response.status === 404) {
        showError('투표 기간이 만료되었습니다.');
      } else {
        showError(response.error.message || '투표에 실패했습니다.');
      }
      voteButton.disabled = false;
      voteButton.textContent = '투표하기';
      return;
    }

    // Vote successful - refresh topic data to get updated results
    const refreshResponse = await TopicsAPI.getTodayTopic();
    if (refreshResponse.data) {
      currentTopic = refreshResponse.data;
      checkVoteStatus(currentTopic);
      showMessage('투표가 완료되었습니다!', 'success');
    }

  } catch (error) {
    console.error('Vote submission error:', error);
    showError('투표 처리 중 오류가 발생했습니다.');
    voteButton.disabled = false;
    voteButton.textContent = '투표하기';
  }
}

/**
 * Handle share button click
 */
function handleShareClick() {
  if (currentTopic && currentTopic.topicId) {
    window.location.href = `/topics/${currentTopic.topicId}/chat`;
  }
}

/**
 * Show vote UI (before voting)
 * 투표 전에는 퍼센트를 숨기고 ??%로 표시
 */
function showVoteUI() {
  // Add 'before-vote' class to gauge bar
  mainGaugeBar.classList.add('before-vote');

  // 투표 전에는 퍼센트 숨김 (??% 표시)
  const percentageAEl = mainGaugeBar.querySelector('[data-option="a"]');
  const percentageBEl = mainGaugeBar.querySelector('[data-option="b"]');
  const barFill = mainGaugeBar.querySelector('[data-fill="a"]');

  if (percentageAEl) percentageAEl.textContent = '??%';
  if (percentageBEl) percentageBEl.textContent = '??%';
  if (barFill) barFill.style.width = '50%';

  // Show vote elements
  voteCardsContainer.style.display = 'grid';
  voteCardsContainer.removeAttribute('hidden');
  voteButton.style.display = 'block';
  voteButton.removeAttribute('hidden');

  // Reset vote button state
  voteButton.disabled = true;
  voteButton.textContent = '선택지를 골라주세요';

  // Reset card selection
  voteCards.forEach(c => c.classList.remove('selected'));
  selectedOptionId = null;

  // Hide result elements
  resultStats.setAttribute('hidden', '');
  shareButton.setAttribute('hidden', '');
}

/**
 * Show result UI (after voting)
 */
function showResultUI(results) {
  // Remove 'before-vote' class
  mainGaugeBar.classList.remove('before-vote');

  // Hide vote elements
  voteCardsContainer.style.display = 'none';
  voteButton.style.display = 'none';

  // Show result elements
  resultStats.removeAttribute('hidden');
  shareButton.removeAttribute('hidden');

  // Update statistics
  document.getElementById('totalVotes').textContent = results.totalVotes.toLocaleString();

  // Get choice text
  let choiceText = results.userChoiceText;
  if (!choiceText && results.userChoice) {
    const option = getOptionByLabel(currentTopic, results.userChoice);
    choiceText = option ? option.text : results.userChoice;
  }

  const userChoiceElement = document.getElementById('userChoice');
  userChoiceElement.textContent = choiceText || '-';

  // Add color class based on user's choice
  userChoiceElement.className = results.userChoice === 'A' ? 'choice-a' : 'choice-b';

  // 퍼센트 값 보장 (숫자로 변환, 0은 유지)
  const percentA = Number(results.percentageA) ?? 0;
  const percentB = Number(results.percentageB) ?? 0;

  // 즉시 DOM 요소 업데이트 (GaugeBar 생성 전에도 값 표시)
  const percentageAEl = mainGaugeBar.querySelector('[data-option="a"]');
  const percentageBEl = mainGaugeBar.querySelector('[data-option="b"]');
  const barFill = mainGaugeBar.querySelector('[data-fill="a"]');

  if (percentageAEl) percentageAEl.textContent = `${percentA}%`;
  if (percentageBEl) percentageBEl.textContent = `${percentB}%`;
  if (barFill) barFill.style.width = `${percentA}%`;

  // Initialize/Update Gauge Bar with animation
  setTimeout(() => {
    if (!gaugeBar) {
      gaugeBar = new GaugeBar('#mainGaugeBar', {
        percentageA: percentA,
        percentageB: percentB,
        animate: true,
        autoUpdate: false
      });
    } else {
      gaugeBar.update(percentA, percentB);
    }
  }, 100);
}

/**
 * Show "no topic" UI when there's no topic for today
 */
function showNoTopicUI() {
  // Hide vote content
  voteContent.setAttribute('hidden', '');

  // Create and show "no topic" message
  const noTopicContainer = document.createElement('div');
  noTopicContainer.className = 'no-topic-container';
  noTopicContainer.innerHTML = `
    <div class="no-topic-content">
      <div class="no-topic-icon">📭</div>
      <h2 class="no-topic-title">오늘의 토픽이 없습니다</h2>
      <p class="no-topic-description">
        아직 오늘의 투표 주제가 준비되지 않았어요.<br>
        잠시 후 다시 확인해주세요!
      </p>
      <a href="/" class="no-topic-button">홈으로 돌아가기</a>
    </div>
  `;

  // Insert after loading skeleton
  const voteSection = document.getElementById('voteSection');
  voteSection.appendChild(noTopicContainer);
}

/**
 * Show error message
 */
function showError(message) {
  showMessage(message, 'error');
}

/**
 * Initialize DOM elements
 */
function initializeDOMElements() {
  loadingSkeleton = document.getElementById('loadingSkeleton');
  voteContent = document.getElementById('voteContent');
  voteSection = document.getElementById('voteSection');
  topicQuestion = document.getElementById('topicQuestion');
  mainGaugeBar = document.getElementById('mainGaugeBar');
  voteCardsContainer = document.getElementById('voteCards');
  voteCards = document.querySelectorAll('.vote-card');
  voteButton = document.getElementById('voteButton');
  resultStats = document.getElementById('resultStats');
  shareButton = document.getElementById('shareButton');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
