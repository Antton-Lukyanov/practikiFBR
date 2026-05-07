// Подключаем библиотеку Redis
const { createClient } = require('redis');
const dotenv = require('dotenv');

dotenv.config();

// Создаём клиента Redis
const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Обработка ошибок подключения
redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('Connected to Redis'));

// Подключаемся
redisClient.connect();

module.exports = redisClient;