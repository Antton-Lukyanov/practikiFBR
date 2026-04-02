// Элементы DOM
const form = document.getElementById('note-form');
const input = document.getElementById('note-input');
const list = document.getElementById('notes-list');
const clearAllBtn = document.getElementById('clear-all-btn');
const onlineStatusSpan = document.getElementById('onlineStatus');
const swStatusSpan = document.getElementById('swStatus');

// Ключ для localStorage
const STORAGE_KEY = 'notes_app';

// Загрузка заметок из localStorage
function loadNotes() {
    const notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    if (notes.length === 0) {
        list.innerHTML = '<li class="empty-message">Нет заметок. Добавьте первую!</li>';
        return;
    }
    
    list.innerHTML = notes.map((note, index) => `
        <li>
            <span class="note-text">${escapeHtml(note)}</span>
            <button class="delete-note" data-index="${index}">✕</button>
        </li>
    `).join('');
    
    // Добавляем обработчики на кнопки удаления
    document.querySelectorAll('.delete-note').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(btn.dataset.index);
            deleteNote(index);
        });
    });
}

// Сохранение заметки
function addNote(text) {
    const notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    notes.push(text);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    loadNotes();
}

// Удаление заметки
function deleteNote(index) {
    const notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    notes.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    loadNotes();
}

// Очистка всех заметок
function clearAllNotes() {
    if (confirm('Удалить все заметки?')) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        loadNotes();
    }
}

// Экранирование HTML спецсимволов
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Обновление статуса онлайн/офлайн
function updateOnlineStatus() {
    if (navigator.onLine) {
        onlineStatusSpan.textContent = 'Онлайн';
        onlineStatusSpan.className = 'status-value online';
    } else {
        onlineStatusSpan.textContent = 'Офлайн';
        onlineStatusSpan.className = 'status-value offline';
    }
}

// Регистрация Service Worker
async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        swStatusSpan.textContent = 'Не поддерживается';
        swStatusSpan.className = 'status-value inactive';
        console.log('Service Worker не поддерживается');
        return;
    }
    
    try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker зарегистрирован:', registration.scope);
        
        if (registration.active) {
            swStatusSpan.textContent = 'Активен';
            swStatusSpan.className = 'status-value active';
        } else if (registration.installing) {
            swStatusSpan.textContent = 'Установка...';
            swStatusSpan.className = 'status-value inactive';
        } else if (registration.waiting) {
            swStatusSpan.textContent = 'Ожидание...';
            swStatusSpan.className = 'status-value inactive';
        }
        
        // Следим за изменением состояния SW
        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'activated') {
                    swStatusSpan.textContent = 'Активен';
                    swStatusSpan.className = 'status-value active';
                }
            });
        });
        
    } catch (err) {
        console.error('Ошибка регистрации Service Worker:', err);
        swStatusSpan.textContent = 'Ошибка';
        swStatusSpan.className = 'status-value inactive';
    }
}

// Обработка отправки формы
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (text) {
        addNote(text);
        input.value = '';
        input.focus();
    }
});

// Очистка всех заметок
clearAllBtn.addEventListener('click', clearAllNotes);

// Следим за статусом сети
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// Первоначальная загрузка
loadNotes();
updateOnlineStatus();

// Регистрация Service Worker после загрузки страницы
window.addEventListener('load', () => {
    registerServiceWorker();
});