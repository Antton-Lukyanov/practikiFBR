// Подключаем Sequelize (ORM для работы с SQL базами)
const { Sequelize } = require('sequelize');
// Подключаем dotenv для чтения переменных из .env файла
const dotenv = require('dotenv');

// Загружаем переменные окружения из .env
dotenv.config();

// Создаем экземпляр Sequelize для подключения к PostgreSQL
// process.env.XXX - это способ достать значение из .env файла
const sequelize = new Sequelize(
    process.env.DB_NAME,      // Имя базы данных (user_api_db)
    process.env.DB_USER,      // Имя пользователя (postgres)
    process.env.DB_PASSWORD,  // Пароль от PostgreSQL
    {
        host: process.env.DB_HOST,  // localhost (компьютер, где стоит PostgreSQL)
        dialect: 'postgres',        // Тип базы данных
        logging: false,              // Отключаем вывод SQL запросов в консоль
    }
);

// Функция для проверки подключения и синхронизации моделей с БД
const connectDB = async () => {
    try {
        // Проверяем подключение
        await sequelize.authenticate();
        console.log('PostgreSQL подключена успешно');
        
        // Синхронизируем модели с БД (создаем таблицы, если их нет)
        // { alter: true } - обновляет структуру таблицы, не удаляя данные
        await sequelize.sync({ alter: true });
        console.log('Таблицы созданы/обновлены');
    } catch (error) {
        console.error('Ошибка подключения к PostgreSQL:', error);
    }
};

// Экспортируем sequelize и функцию подключения для использования в других файлах
module.exports = { sequelize, connectDB };