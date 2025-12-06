const express = require('express');
const path = require('path');
const router = express.Router();

// 이용약관 페이지
router.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'policy', 'terms.html'));
});

// 개인정보 처리방침 페이지
router.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'policy', 'privacy.html'));
});

module.exports = router;
