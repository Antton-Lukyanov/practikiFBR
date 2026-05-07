// Подключаем Redis клиент
const redisClient = require('../redis/client');

/**
 * Функция-фабрика для создания middleware кэширования
 * @param {function} keyBuilder - функция, которая из req формирует ключ
 * @param {number} ttl - время жизни кэша в секундах
 * @returns middleware для Express
 */
function cacheMiddleware(keyBuilder, ttl) {
    return async (req, res, next) => {
        try {
            // Формируем ключ по переданной функции
            const key = keyBuilder(req);
            
            // Пытаемся получить данные из Redis
            const cachedData = await redisClient.get(key);
            
            if (cachedData) {
                // Данные найдены в кэше — возвращаем их
                return res.json({
                    source: 'cache',           // Помечаем, что ответ из кэша
                    data: JSON.parse(cachedData)
                });
            }
            
            // Данных в кэше нет — сохраняем ключ и TTL в req для последующего сохранения
            req.cacheKey = key;
            req.cacheTTL = ttl;
            next();  // Передаём управление дальше (в основной обработчик)
        } catch (err) {
            console.error('Cache read error:', err);
            next();  // При ошибке кэша просто пропускаем дальше
        }
    };
}

/**
 * Сохраняет данные в Redis
 * @param {string} key - ключ
 * @param {any} data - данные (будут преобразованы в JSON)
 * @param {number} ttl - время жизни в секундах
 */
async function saveToCache(key, data, ttl) {
    try {
        await redisClient.set(key, JSON.stringify(data), { EX: ttl });
        console.log(`Cached: ${key}`);
    } catch (err) {
        console.error('Cache save error:', err);
    }
}

/**
 * Инвалидация (очистка) кэша пользователей
 * @param {string|null} userId - если передан, удаляем и конкретного пользователя
 */
async function invalidateUsersCache(userId = null) {
    try {
        // Удаляем кэш списка всех пользователей
        await redisClient.del('users:all');
        
        // Если передан ID — удаляем кэш конкретного пользователя
        if (userId) {
            await redisClient.del(`users:${userId}`);
        }
        console.log('Users cache invalidated');
    } catch (err) {
        console.error('Cache invalidate error:', err);
    }
}

module.exports = { cacheMiddleware, saveToCache, invalidateUsersCache };