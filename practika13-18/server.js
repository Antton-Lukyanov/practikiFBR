const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const socketIo = require('socket.io');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');

// Читаем VAPID ключи из файлов
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
const reminders = new Map();

// HTTPS сервер
const server = https.createServer(
    {
        key: fs.readFileSync(path.join(__dirname, 'certs', 'localhost+2-key.pem')),
        cert: fs.readFileSync(path.join(__dirname, 'certs', 'localhost+2.pem'))
    },
    app
);

const io = socketIo(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

io.on('connection', function(socket) {
    console.log('Client connected:', socket.id);

    // Обычная задача (без напоминания) - push отправляется сразу
    socket.on('newTask', function(task) {
        console.log('New task:', task.text);
        io.emit('taskAdded', task);

        const payload = JSON.stringify({
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

    // Задача с напоминанием - push отправляется через таймер
    socket.on('newReminder', function(reminder) {
        console.log('=== NEW REMINDER RECEIVED ===');
        console.log('Text:', reminder.text);
        console.log('Time:', new Date(reminder.reminderTime).toLocaleString());
        
        const delay = reminder.reminderTime - Date.now();
        console.log('Delay (ms):', delay);
        
        if (delay <= 0) {
            console.log('Reminder time is in the past, ignoring');
            return;
        }

        const timeoutId = setTimeout(function() {
            console.log('=== SENDING PUSH FOR REMINDER ===');
            console.log('Text:', reminder.text);
            console.log('Active subscriptions:', subscriptions.length);
            
            const payload = JSON.stringify({
                title: ' Reminder',
                body: reminder.text,
                reminderId: reminder.id
            });

            if (subscriptions.length === 0) {
                console.log('No active subscriptions, push not sent');
                return;
            }

            subscriptions.forEach(function(sub) {
                webpush.sendNotification(sub, payload)
                    .then(() => {
                        console.log(' Push sent successfully for:', reminder.text);
                    })
                    .catch(function(err) {
                        console.error(' Push error:', err.statusCode, err.body);
                        if (err.statusCode === 410) {
                            subscriptions = subscriptions.filter(function(s) {
                                return s.endpoint !== sub.endpoint;
                            });
                        }
                    });
            });

            reminders.delete(reminder.id);
        }, delay);

        reminders.set(reminder.id, {
            timeoutId: timeoutId,
            text: reminder.text,
            reminderTime: reminder.reminderTime
        });
        
        console.log('Reminder scheduled, total active reminders:', reminders.size);
    });

    socket.on('disconnect', function() {
        console.log('Client disconnected:', socket.id);
    });
});

app.post('/subscribe', function(req, res) {
    const subscription = req.body;
    // Проверяем, нет ли уже такой подписки
    const exists = subscriptions.some(s => s.endpoint === subscription.endpoint);
    if (!exists) {
        subscriptions.push(subscription);
        console.log('Subscription saved, total:', subscriptions.length);
    } else {
        console.log('Subscription already exists, total:', subscriptions.length);
    }
    res.status(201).json({ message: 'Subscribed' });
});

app.post('/unsubscribe', function(req, res) {
    const endpoint = req.body.endpoint;
    const beforeCount = subscriptions.length;
    subscriptions = subscriptions.filter(function(sub) {
        return sub.endpoint !== endpoint;
    });
    console.log('Unsubscribed. Was:', beforeCount, 'Now:', subscriptions.length);
    res.status(200).json({ message: 'Unsubscribed' });
});

app.post('/snooze', function(req, res) {
    const reminderId = parseInt(req.query.reminderId, 10);
    
    console.log('Snooze request for reminderId:', reminderId);
    
    if (!reminderId || !reminders.has(reminderId)) {
        console.log('Reminder not found:', reminderId);
        return res.status(400).json({ error: 'Reminder not found' });
    }

    const reminder = reminders.get(reminderId);
    clearTimeout(reminder.timeoutId);
    
    const snoozeDelay = 5 * 60 * 1000;
    const newReminderTime = Date.now() + snoozeDelay;
    
    const newTimeoutId = setTimeout(function() {
        console.log('=== SENDING SNOOZED PUSH ===');
        console.log('Text:', reminder.text);
        console.log('Active subscriptions:', subscriptions.length);
        
        const payload = JSON.stringify({
            title: ' Reminder (snoozed)',
            body: reminder.text,
            reminderId: reminderId
        });

        if (subscriptions.length === 0) {
            console.log('No active subscriptions, push not sent');
            return;
        }

        subscriptions.forEach(function(sub) {
            webpush.sendNotification(sub, payload)
                .then(() => {
                    console.log(' Snoozed push sent successfully');
                })
                .catch(function(err) {
                    console.error(' Snoozed push error:', err.statusCode);
                    if (err.statusCode === 410) {
                        subscriptions = subscriptions.filter(function(s) {
                            return s.endpoint !== sub.endpoint;
                        });
                    }
                });
        });

        reminders.delete(reminderId);
    }, snoozeDelay);

    reminders.set(reminderId, {
        timeoutId: newTimeoutId,
        text: reminder.text,
        reminderTime: newReminderTime
    });

    console.log('Reminder snoozed for 5 minutes, new time:', new Date(newReminderTime).toLocaleString());
    res.status(200).json({ message: 'Reminder snoozed for 5 minutes' });
});

var PORT = 3001;
server.listen(PORT, function() {
    console.log('Mode: HTTPS (mkcert certificates loaded)');
    console.log('Server running: https://localhost:' + PORT);
});