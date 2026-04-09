const express = require('express');
const https = require('https');  // ← заменил http на https
const fs = require('fs');        // ← добавил fs для чтения файлов
const path = require('path');
const socketIo = require('socket.io');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');

// Читаем VAPID ключи из файлов (вместо прямого вписывания)
const VAPID_PUBLIC_KEY = fs.readFileSync(path.join(__dirname, 'keys', 'vapid-public.key'), 'utf8').trim();
const VAPID_PRIVATE_KEY = fs.readFileSync(path.join(__dirname, 'keys', 'vapid-private.key'), 'utf8').trim();

console.log('VAPID public key loaded:', VAPID_PUBLIC_KEY.substring(0, 30) + '...');

webpush.setVapidDetails(
    'mailto:your-email@example.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, './')));

let subscriptions = [];

// HTTPS сервер с сертификатами из папки certs
const server = https.createServer(
    {
        key: fs.readFileSync(path.join(__dirname, 'certs', 'localhost+1-key.pem')),
        cert: fs.readFileSync(path.join(__dirname, 'certs', 'localhost+1.pem'))
    },
    app
);

const io = socketIo(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

io.on('connection', function(socket) {
    console.log('Client connected:', socket.id);

    socket.on('newTask', function(task) {
        console.log('New task:', task.text);
        
        io.emit('taskAdded', task);

        var payload = JSON.stringify({
            title: 'New task',
            body: task.text
        });

        subscriptions.forEach(function(sub) {
            webpush.sendNotification(sub, payload).catch(function(err) {
                console.error('Push error:', err);
                if (err.statusCode === 410) {
                    subscriptions = subscriptions.filter(function(s) {
                        return s.endpoint !== sub.endpoint;
                    });
                }
            });
        });
    });

    socket.on('disconnect', function() {
        console.log('Client disconnected:', socket.id);
    });
});

app.post('/subscribe', function(req, res) {
    subscriptions.push(req.body);
    console.log('Subscription saved, total:', subscriptions.length);
    res.status(201).json({ message: 'Subscribed' });
});

app.post('/unsubscribe', function(req, res) {
    var endpoint = req.body.endpoint;
    subscriptions = subscriptions.filter(function(sub) {
        return sub.endpoint !== endpoint;
    });
    console.log('Unsubscribed, total:', subscriptions.length);
    res.status(200).json({ message: 'Unsubscribed' });
});

var PORT = 3001;
server.listen(PORT, function() {
    console.log('Mode: HTTPS (mkcert certificates loaded)');
    console.log('Server running: https://localhost:' + PORT);
    console.log('Open in browser: https://localhost:' + PORT);
});