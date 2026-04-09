// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
var STORAGE_KEY = 'notes_app';

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;');
}

// ========== APP SHELL НАВИГАЦИЯ ==========
var contentDiv = document.getElementById('app-content');
var homeBtn = document.getElementById('home-btn');
var aboutBtn = document.getElementById('about-btn');

function setActiveButton(activeId) {
    if (!homeBtn || !aboutBtn) return;
    homeBtn.classList.remove('active');
    aboutBtn.classList.remove('active');
    document.getElementById(activeId).classList.add('active');
}

async function loadContent(page) {
    if (!contentDiv) return;
    try {
        var response = await fetch('/content/' + page + '.html');
        var html = await response.text();
        contentDiv.innerHTML = html;
        if (page === 'home') {
            initHomePage();
        }
    } catch (err) {
        contentDiv.innerHTML = '<p class="error">Error loading page</p>';
        console.error('Load error:', err);
    }
}

// ========== ГЛАВНАЯ СТРАНИЦА (ЗАМЕТКИ) ==========
function initHomePage() {
    var form = document.getElementById('note-form');
    var input = document.getElementById('note-input');
    var list = document.getElementById('notes-list');
    var clearBtn = document.getElementById('clear-all-btn');
    
    if (!form || !input || !list) return;
    
    function renderNotes() {
        var notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        if (notes.length === 0) {
            list.innerHTML = '<li class="empty-message">No notes</li>';
            return;
        }
        var html = '';
        for (var i = 0; i < notes.length; i++) {
            html += '<li><span class="note-text">' + escapeHtml(notes[i]) + '</span><button class="delete-note" data-index="' + i + '">X</button></li>';
        }
        list.innerHTML = html;
        
        var deleteBtns = document.querySelectorAll('.delete-note');
        for (var j = 0; j < deleteBtns.length; j++) {
            deleteBtns[j].addEventListener('click', function(e) {
                var index = parseInt(this.dataset.index);
                var notesArr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
                notesArr.splice(index, 1);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(notesArr));
                renderNotes();
            });
        }
    }
    
    function addNote(text) {
        var notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        notes.push(text);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
        renderNotes();
        
        if (window.socket && window.socket.connected) {
            window.socket.emit('newTask', { text: text, id: Date.now() });
            console.log('Task sent via WebSocket:', text);
        } else {
            console.log('WebSocket not connected, task saved locally only');
        }
    }
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        var text = input.value.trim();
        if (text) {
            addNote(text);
            input.value = '';
            input.focus();
        }
    });
    
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            if (confirm('Delete all notes?')) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
                renderNotes();
            }
        });
    }
    
    renderNotes();
    
    // Обновляем статус WebSocket в интерфейсе
    var wsStatus = document.getElementById('wsStatus');
    if (wsStatus && window.socket) {
        if (window.socket.connected) {
            wsStatus.textContent = 'Connected';
            wsStatus.className = 'status-value online';
        } else {
            wsStatus.textContent = 'Disconnected';
            wsStatus.className = 'status-value offline';
        }
    }
}

// ========== WEBSOCKET (SOCKET.IO) ==========
window.socket = io('https://localhost:3001', {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000
});

window.socket.on('connect', function() {
    console.log('WebSocket connected:', window.socket.id);
    var wsStatus = document.getElementById('wsStatus');
    if (wsStatus) {
        wsStatus.textContent = 'Connected';
        wsStatus.className = 'status-value online';
    }
});

window.socket.on('disconnect', function() {
    console.log('WebSocket disconnected');
    var wsStatus = document.getElementById('wsStatus');
    if (wsStatus) {
        wsStatus.textContent = 'Disconnected';
        wsStatus.className = 'status-value offline';
    }
});

window.socket.on('connect_error', function(err) {
    console.error('WebSocket connection error:', err.message);
    var wsStatus = document.getElementById('wsStatus');
    if (wsStatus) {
        wsStatus.textContent = 'Error';
        wsStatus.className = 'status-value offline';
    }
});

window.socket.on('taskAdded', function(task) {
    console.log('Task from another client:', task);
    
    // Показываем всплывающее уведомление
    var toast = document.createElement('div');
    toast.textContent = 'New task: ' + task.text;
    toast.style.cssText = 'position:fixed; bottom:20px; right:20px; background:#2d8c5a; color:white; padding:10px 20px; border-radius:5px; z-index:9999; box-shadow:0 2px 10px rgba(0,0,0,0.3);';
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 3000);
});

// ========== PUSH-УВЕДОМЛЕНИЯ ==========
function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);
    for (var i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Публичный VAPID-ключ (должен совпадать с серверным)
var VAPID_PUBLIC_KEY = 'BIDB01PnYdYZUSxFyGaxpgzDtfRiXSbjaVb26H_28GghK2Y2P7R1LM9YhTpgacfE35siFkgqgMgprHf9G8geXpY';

async function subscribeToPush() {
    if (!('serviceWorker' in navigator)) {
        console.log('Service Worker not supported');
        return false;
    }
    if (!('PushManager' in window)) {
        console.log('Push Manager not supported');
        alert('Push notifications not supported in this browser');
        return false;
    }
    
    try {
        var registration = await navigator.serviceWorker.ready;
        var existingSubscription = await registration.pushManager.getSubscription();
        
        if (existingSubscription) {
            console.log('Already subscribed');
            return true;
        }
        
        var subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
        
        var response = await fetch('https://localhost:3001/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription)
        });
        
        if (response.ok) {
            console.log('Push subscription saved on server');
            return true;
        } else {
            console.error('Failed to save subscription on server');
            return false;
        }
    } catch (err) {
        console.error('Push subscription error:', err);
        return false;
    }
}

async function unsubscribeFromPush() {
    if (!('serviceWorker' in navigator)) return false;
    
    try {
        var registration = await navigator.serviceWorker.ready;
        var subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
            await fetch('https://localhost:3001/unsubscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint: subscription.endpoint })
            });
            await subscription.unsubscribe();
            console.log('Push unsubscribed');
            return true;
        }
        return false;
    } catch (err) {
        console.error('Unsubscribe error:', err);
        return false;
    }
}

// ========== SERVICE WORKER РЕГИСТРАЦИЯ ==========
async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        console.log('Service Worker not supported');
        return;
    }
    
    try {
        var registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration.scope);
        
        // Обновляем статус SW в интерфейсе
        var swStatus = document.getElementById('swStatus');
        if (swStatus) {
            swStatus.textContent = 'Active';
            swStatus.className = 'status-value active';
        }
        
        // Настраиваем кнопки push-уведомлений
        var enableBtn = document.getElementById('enable-push');
        var disableBtn = document.getElementById('disable-push');
        
        if (enableBtn && disableBtn) {
            // Проверяем текущую подписку
            var subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                enableBtn.style.display = 'none';
                disableBtn.style.display = 'inline-block';
            } else {
                enableBtn.style.display = 'inline-block';
                disableBtn.style.display = 'none';
            }
            
            // Включение уведомлений
            enableBtn.addEventListener('click', async function() {
                if (Notification.permission === 'denied') {
                    alert('Notifications are blocked. Please enable them in browser settings.');
                    return;
                }
                
                if (Notification.permission === 'default') {
                    var permission = await Notification.requestPermission();
                    if (permission !== 'granted') {
                        alert('Notifications permission denied');
                        return;
                    }
                }
                
                var success = await subscribeToPush();
                if (success) {
                    enableBtn.style.display = 'none';
                    disableBtn.style.display = 'inline-block';
                    console.log('Push notifications enabled');
                } else {
                    alert('Failed to enable push notifications');
                }
            });
            
            // Отключение уведомлений
            disableBtn.addEventListener('click', async function() {
                await unsubscribeFromPush();
                disableBtn.style.display = 'none';
                enableBtn.style.display = 'inline-block';
                console.log('Push notifications disabled');
            });
        }
        
    } catch (err) {
        console.error('Service Worker registration error:', err);
        var swStatus = document.getElementById('swStatus');
        if (swStatus) {
            swStatus.textContent = 'Error';
            swStatus.className = 'status-value inactive';
        }
    }
}

// ========== ОБНОВЛЕНИЕ СТАТУСА ОНЛАЙН ==========
function updateOnlineStatus() {
    var onlineSpan = document.getElementById('onlineStatus');
    if (onlineSpan) {
        if (navigator.onLine) {
            onlineSpan.textContent = 'Online';
            onlineSpan.className = 'status-value online';
        } else {
            onlineSpan.textContent = 'Offline';
            onlineSpan.className = 'status-value offline';
        }
    }
}

// ========== ЗАПУСК ПРИЛОЖЕНИЯ ==========
window.addEventListener('load', function() {
    // Настройка навигации
    if (homeBtn && aboutBtn) {
        homeBtn.addEventListener('click', function() {
            loadContent('home');
            setActiveButton('home-btn');
        });
        aboutBtn.addEventListener('click', function() {
            loadContent('about');
            setActiveButton('about-btn');
        });
    }
    
    // Следим за статусом сети
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
    
    // Загружаем главную страницу
    loadContent('home');
    setActiveButton('home-btn');
    
    // Регистрируем Service Worker
    registerServiceWorker();
});