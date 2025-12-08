const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'features', 'posts', 'pages', 'post-list.html'));
});

router.get('/create', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'features', 'posts', 'pages', 'post-create.html'));
});

router.get('/edit/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'features', 'posts', 'pages', 'post-edit.html'));
});

router.get('/:id', (req, res, next) => {
    const id = req.params.id;
    if (!/^\d+$/.test(id)) return next();
    res.sendFile(path.join(__dirname, '..', 'public', 'features', 'posts', 'pages', 'post-detail.html'));
});

module.exports = router;
