// Подключаем Mongoose
const mongoose = require('mongoose');

// Схема пользователя (такая же, как в практике 20)
const userSchema = new mongoose.Schema({
    first_name: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
    },
    last_name: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
    },
    age: {
        type: Number,
        min: 0,
        max: 150,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
});

// Хук: обновляем updated_at перед сохранением
userSchema.pre('save', function(next) {
    this.updated_at = Date.now();
    next();
});

module.exports = mongoose.model('User', userSchema);