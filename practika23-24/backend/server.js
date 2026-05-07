const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
const SERVER_ID = process.env.SERVER_ID || 'unknown';

app.get('/', (req, res) => {
    res.json({
        message: 'Response from backend server',
        server_id: SERVER_ID,
        container: process.env.HOSTNAME || 'unknown',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', server_id: SERVER_ID });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Backend ${SERVER_ID} running on port ${PORT}`);
});