// Подключаем Sequelize и DataTypes (для определения типов полей)
const { DataTypes } = require('sequelize');
// Подключаем наш экземпляр sequelize из database.js
const { sequelize } = require('../config/database');

// Определяем модель User (таблицу users)
// sequelize.define - метод для создания модели
const User = sequelize.define('User', {
    // Поле id (автоматически создается, но мы явно описываем)
    id: {
        type: DataTypes.INTEGER,     // Целое число
        autoIncrement: true,         // Автоматически увеличивается
        primaryKey: true,            // Первичный ключ (уникальный идентификатор)
    },
    // Имя пользователя (из задания: first_name)
    first_name: {
        type: DataTypes.STRING(100), // Строка длиной до 100 символов
        allowNull: false,             // NOT NULL - обязательно для заполнения
    },
    // Фамилия пользователя (из задания: last_name)
    last_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    // Возраст (из задания: age)
    age: {
        type: DataTypes.INTEGER,
        // Валидация (проверка) данных
        validate: {
            min: 0,   // Не меньше 0
            max: 150, // Не больше 150
        },
    },
    // Время создания (из задания: created_at)
    created_at: {
        type: DataTypes.DATE,        // Тип "дата и время"
        defaultValue: DataTypes.NOW, // По умолчанию - текущее время
    },
    // Время обновления (из задания: updated_at)
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'users',      // Имя таблицы в БД
    timestamps: false,       // Отключаем автоматические поля createdAt/updatedAt (мы свои создали)
    underscored: true,       // Используем snake_case (first_name вместо firstName)
});

// Хук (событие) - автоматически обновляет updated_at при изменении записи
// beforeUpdate - срабатывает ПЕРЕД обновлением данных
User.beforeUpdate((user) => {
    user.updated_at = new Date(); // Устанавливаем текущее время
});

// Экспортируем модель для использования в server.js
module.exports = User;