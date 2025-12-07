const express = require('express');
const path = require('path');
const router = express.Router();

/**
 * WePick 코어 기능 라우터
 * Bootstrap 없이 새로 구현된 페이지들
 */

// 랜딩 페이지 (루트 경로)
router.get('/', (req, res) => {
  res.sendFile(
    path.join(__dirname, '..', 'public', 'pages', 'wepick', 'landing.html')
  );
});

// 오늘의 선택/결과 페이지
router.get('/today', (req, res) => {
  res.sendFile(
    path.join(__dirname, '..', 'public', 'pages', 'wepick', 'today-choice.html')
  );
});

// 이전 토픽 리스트 (개발 중)
router.get('/topics', (req, res) => {
  res.sendFile(
    path.join(__dirname, '..', 'public', 'pages', 'error', 'coming-soon.html')
  );
});

// 이전 토픽 상세 (결과) (개발 중)
router.get('/topics/:topicId', (req, res, next) => {
  const topicId = req.params.topicId;

  // 'chat'은 다음 라우트로 넘김
  if (topicId === 'chat') return next();

  // 숫자 ID만 허용
  if (!/^\d+$/.test(topicId)) {
    return next();
  }

  res.sendFile(
    path.join(__dirname, '..', 'public', 'pages', 'error', 'coming-soon.html')
  );
});

// 진영 채팅 페이지 (개발 중)
router.get('/topics/:topicId/chat', (req, res) => {
  res.sendFile(
    path.join(__dirname, '..', 'public', 'pages', 'error', 'coming-soon.html')
  );
});

module.exports = router;
