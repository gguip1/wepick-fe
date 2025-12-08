const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/signin', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'features', 'users', 'pages', 'user-signin.html'));
});

router.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'features', 'users', 'pages', 'user-signup.html'));
});

router.get('/mypage', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'features', 'users', 'pages', 'mypage.html'));
});

// 더 구체적인 라우트를 먼저 정의 (Express 라우트 매칭 순서)
router.get('/edit/profile-img', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'features', 'users', 'pages', 'user-edit-profile-img.html'));
});

router.get('/edit/nickname', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'features', 'users', 'pages', 'user-edit-nickname.html'));
});

router.get('/edit/password', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'features', 'users', 'pages', 'user-edit-password.html'));
});

module.exports = router;
