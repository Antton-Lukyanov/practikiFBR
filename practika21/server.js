const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const redisClient = require('./redis/client');
const { cacheMiddleware, saveToCache, invalidateUsersCache } = require('./middleware/cache');

dotenv.config();

const app = express();
app.use(express.json());

mongoose.connect('mongodb://YourMongoAdmin:1234@localhost:27017/user_api_db?authSource=admin')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

const USERS_CACHE_TTL = 60; // 1 минута для списка пользователей

// GET /api/users — список всех пользователей (с кэшем 1 минута)
app.get(
    '/api/users',
    cacheMiddleware(() => 'users:all', USERS_CACHE_TTL),
    async (req, res) => {
        try {
            // Получаем всех пользователей из БД
            const users = await User.find();
            
            // Сохраняем в кэш (средний слой сохранит)
            await saveToCache(req.cacheKey, users, req.cacheTTL);
            
            res.json({
                source: 'database',  // Помечаем, что ответ из базы
                data: users
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
);

// GET /api/users/:id — один пользователь по ID (с кэшем 1 минута)
app.get(
    '/api/users/:id',
    cacheMiddleware((req) => `users:${req.params.id}`, USERS_CACHE_TTL),
    async (req, res) => {
        try {
            const user = await User.findById(req.params.id);
            if (!user) return res.status(404).json({ message: 'User not found' });
            
            await saveToCache(req.cacheKey, user, req.cacheTTL);
            
            res.json({
                source: 'database',
                data: user
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
);

// POST /api/users — создание пользователя (очищает кэш)
app.post('/api/users', async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        
        // При создании пользователя кэш становится неактуальным — удаляем его
        await invalidateUsersCache();
        
        res.status(201).json(user);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PATCH /api/users/:id — обновление пользователя (очищает кэш)
app.patch('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        // Очищаем кэш (и общий список, и конкретного пользователя)
        await invalidateUsersCache(user._id);
        
        res.json(user);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /api/users/:id — удаление пользователя (очищает кэш)
app.delete('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        // Очищаем кэш
        await invalidateUsersCache(user._id);
        
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});