// Подключаем Express (фреймворк для создания сервера)
const express = require('express');
// Подключаем модель User (чтобы работать с БД)
const User = require('./models/User');
// Подключаем функцию подключения к БД
const { connectDB } = require('./config/database');

// Создаем приложение Express
const app = express();

// Middleware - позволяет Express понимать JSON в теле запроса
app.use(express.json());

// --- ЗАПУСК СЕРВЕРА (только после подключения к БД) ---
const startServer = async () => {
    // Ждем подключения к базе данных
    await connectDB();
    
    // Берем порт из .env или используем 3000 по умолчанию
    const PORT = process.env.PORT || 3000;
    
    // Запускаем сервер
    app.listen(PORT, () => {
        console.log(`Сервер запущен на http://localhost:${PORT}`);
    });
};

// Запускаем сервер
startServer();

// ========== CRUD ОПЕРАЦИИ (эндпоинты API) ==========

// 1️ POST /api/users - СОЗДАНИЕ нового пользователя
app.post('/api/users', async (req, res) => {
    try {
        // Получаем данные из тела запроса (JSON)
        const { first_name, last_name, age } = req.body;
        
        // Создаем пользователя в БД
        const user = await User.create({ first_name, last_name, age });
        
        // Отправляем ответ с кодом 201 (Created) и созданным пользователем
        res.status(201).json(user);
    } catch (err) {
        // Если ошибка - отправляем 400 (Bad Request) с текстом ошибки
        res.status(400).json({ error: err.message });
    }
});

// 2️ GET /api/users - ПОЛУЧЕНИЕ списка всех пользователей
app.get('/api/users', async (req, res) => {
    try {
        // findAll() - получаем всех пользователей из БД
        const users = await User.findAll();
        
        // Отправляем список пользователей
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3️ GET /api/users/:id - ПОЛУЧЕНИЕ одного пользователя по ID
app.get('/api/users/:id', async (req, res) => {
    try {
        // findByPk (Find by Primary Key) - ищем по id
        const user = await User.findByPk(req.params.id);
        
        // Если пользователь не найден
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
        
        // Отправляем найденного пользователя
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4️ PATCH /api/users/:id - ОБНОВЛЕНИЕ пользователя
app.patch('/api/users/:id', async (req, res) => {
    try {
        // Сначала находим пользователя
        const user = await User.findByPk(req.params.id);
        
        // Если не нашли
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
        
        // Обновляем пользователя (update автоматически обновит updated_at через наш хук)
        await user.update(req.body);
        
        // Отправляем обновленного пользователя
        res.json(user);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 5️ DELETE /api/users/:id - УДАЛЕНИЕ пользователя
app.delete('/api/users/:id', async (req, res) => {
    try {
        // Находим пользователя
        const user = await User.findByPk(req.params.id);
        
        // Если не нашли
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
        
        // Удаляем пользователя
        await user.destroy();
        
        // Отправляем подтверждение
        res.json({ message: 'Пользователь успешно удален' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});