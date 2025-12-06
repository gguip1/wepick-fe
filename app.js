const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Static file serving
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Routers
const postRouter = require('./routes/posts');
const userRouter = require('./routes/users');
const wepickRouter = require('./routes/wepick');

app.use('/community/posts', postRouter);
app.use('/users', userRouter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// WePick routes (루트 경로에 마운트 - 반드시 마지막에)
app.use('/', wepickRouter);

// 404 handler - must be last
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'pages', 'error', '404.html'));
})

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});