const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/signin', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'users', 'user-signin.html'));
});

router.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'users', 'user-signup.html'));
});

// 더 구체적인 라우트를 먼저 정의 (Express 라우트 매칭 순서)
router.get('/edit/profile-img', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'users', 'user-edit-profile-img.html'));
});

router.get('/edit/nickname', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'users', 'user-edit-nickname.html'));
});

router.get('/edit/password', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'users', 'user-edit-password.html'));
});

router.get('/edit', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'users', 'user-edit.html'));
});

module.exports = router;
