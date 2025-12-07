/**
 * WePick Today Choice Page
 * 오늘의 선택/결과 페이지 로직
 */

import { TopicsAPI } from '../api/topics.js';
import { auth } from '../utils/auth.js';
import { GaugeBar } from '../components/gauge-bar.js';
import { initHeaderAuth } from '../utils/header-init.js';

// Page state
let currentTopic = null;
let selectedChoice = null;
let gaugeBar = null;
let currentUser = null; // 현재 사용자 정보

// DOM Elements (initialized after DOM is ready)
let loadingSkeleton, voteContent, voteSection, topicQuestion, mainGaugeBar;
let voteCardsContainer, voteCards, voteButton, resultStats, shareButton;

/**
 * Initialize page
 */
async function init() {
  try {
    // Load header and footer HTML
    await loadHeader();
    await loadFooter();

    // Initialize DOM elements
    initializeDOMElements();

    // Initialize header auth state and get current user (한 번만 호출)
    const user = await initHeaderAuth();
    if (user) {
      currentUser = user;
    }

    // Fetch today's topic
    const response = await TopicsAPI.getTodayTopic();

    if (!response.data) {
      showError('오늘의 토픽을 불러오는데 실패했습니다.');
      return;
    }

    currentTopic = response.data;

    // Hide loading skeleton and show actual content
    loadingSkeleton.style.display = 'none';
    voteContent.removeAttribute('hidden');

    // Update UI with topic data
    updateTopicUI(currentTopic);

    // Check if user has already voted
    await checkVoteStatus();

    // Setup event listeners
    setupEventListeners();

    // 로그아웃 이벤트 리스너
    window.addEventListener('userLoggedOut', handleLogout);

  } catch (error) {
    console.error('Failed to initialize page:', error);
    loadingSkeleton.style.display = 'none';
    voteContent.removeAttribute('hidden');
    showError('페이지를 불러오는데 실패했습니다.');
  }
}

/**
 * 로그아웃 처리
 */
function handleLogout() {
  // 현재 사용자 상태 초기화
  currentUser = null;

  // 투표 상태 초기화 및 UI 업데이트
  showVoteUI();
}

/**
 * Update UI with topic data
 */
function updateTopicUI(topic) {
  // Update question
  topicQuestion.textContent = topic.question;

  const optionAText = topic.optionA.text;
  const optionBText = topic.optionB.text;

  // Update Option A
  document.getElementById('optionATitle').textContent = optionAText;
  document.getElementById('optionADescription').textContent = topic.optionA.description;

  // Update Option B
  document.getElementById('optionBTitle').textContent = optionBText;
  document.getElementById('optionBDescription').textContent = topic.optionB.description;

  // Update gauge labels
  document.getElementById('gaugeOptionALabel').textContent = optionAText;
  document.getElementById('gaugeOptionBLabel').textContent = optionBText;
}

/**
 * Check if user has already voted
 */
async function checkVoteStatus() {
  // Check login status first
  if (!currentUser) {
    // Not logged in, show vote UI
    showVoteUI();
    return;
  }

  // Check if user voted
  const voteResponse = await TopicsAPI.checkUserVote(currentTopic.id);

  if (voteResponse.data && voteResponse.data.hasVoted) {
    // User has voted, show results
    const percentageA = Math.round((currentTopic.votesA / currentTopic.totalVotes) * 100);
    const percentageB = Math.round((currentTopic.votesB / currentTopic.totalVotes) * 100);

    showResultUI({
      percentageA,
      percentageB,
      totalVotes: currentTopic.totalVotes,
      userChoice: voteResponse.data.choice
    });
  } else {
    // User hasn't voted, show vote UI
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

  // Remove selection from all cards
  voteCards.forEach(c => c.classList.remove('selected'));

  // Add selection to clicked card
  card.classList.add('selected');

  // Update selected choice
  selectedChoice = choice;

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
  if (!selectedChoice) {
    return;
  }

  // TODO: 인증 연동 완료 후 주석 해제
  // Check login status
  // const user = await auth.getAuthUser();

  // if (!user) {
  //   // Redirect to login with return URL
  //   const currentPath = window.location.pathname + window.location.search;
  //   window.location.href = `/users/signin?redirect=${encodeURIComponent(currentPath)}&action=vote`;
  //   return;
  // }

  // Disable button during submission
  voteButton.disabled = true;
  voteButton.textContent = '투표 중...';

  try {
    // Submit vote
    const response = await TopicsAPI.submitVote(currentTopic.id, selectedChoice);

    if (response.data && response.data.success) {
      // Show results
      showResultUI(response.data.results);
    } else {
      showError('투표에 실패했습니다. 다시 시도해주세요.');
      voteButton.disabled = false;
      voteButton.textContent = '투표하기';
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
  if (currentTopic && currentTopic.id) {
    window.location.href = `/topics/${currentTopic.id}/chat`;
  }
}

/**
 * Show vote UI (before voting)
 */
function showVoteUI() {
  // Add 'before-vote' class to gauge bar for styling
  mainGaugeBar.classList.add('before-vote');

  // Show vote elements (reset display in case it was hidden with display:none)
  voteCardsContainer.style.display = 'grid';
  voteCardsContainer.removeAttribute('hidden');
  voteButton.style.display = 'block';
  voteButton.removeAttribute('hidden');

  // Hide result elements
  resultStats.setAttribute('hidden', '');
  shareButton.setAttribute('hidden', '');
}

/**
 * Show result UI (after voting)
 */
function showResultUI(results) {
  // Remove 'before-vote' class to trigger transition
  mainGaugeBar.classList.remove('before-vote');

  // Hide vote elements completely (use display:none for complete removal)
  voteCardsContainer.style.display = 'none';
  voteButton.style.display = 'none';

  // Show result elements
  resultStats.removeAttribute('hidden');
  shareButton.removeAttribute('hidden');

  // Update statistics
  document.getElementById('totalVotes').textContent = results.totalVotes.toLocaleString();

  const choiceText = results.userChoice === 'A'
    ? currentTopic.optionA.text
    : currentTopic.optionB.text;
  const userChoiceElement = document.getElementById('userChoice');
  userChoiceElement.textContent = choiceText;

  // Add color class based on user's choice
  userChoiceElement.className = results.userChoice === 'A' ? 'choice-a' : 'choice-b';

  // Initialize/Update Gauge Bar with animation
  setTimeout(() => {
    if (!gaugeBar) {
      gaugeBar = new GaugeBar('#mainGaugeBar', {
        percentageA: results.percentageA,
        percentageB: results.percentageB,
        animate: true,
        autoUpdate: false
      });
    } else {
      gaugeBar.update(results.percentageA, results.percentageB);
    }
  }, 100);
}

/**
 * Show error message
 */
function showError(message) {
  // TODO: Use toast notification system when available
  alert(message);
}

/**
 * Load header HTML
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
 * Load footer HTML
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
