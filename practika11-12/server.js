const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const PORT = 3000;
const ACCESS_SECRET = 'access_secret_123';
const REFRESH_SECRET = 'refresh_secret_456';
const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

// Роли: guest, user, seller, admin
const ROLES = {
    GUEST: 'guest',
    USER: 'user',
    SELLER: 'seller',
    ADMIN: 'admin'
};

// Базы данных
const users = [];
const products = [];
const refreshTokens = new Set();

// Вспомогательные функции
async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}

async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}

function generateAccessToken(user) {
    return jwt.sign(
        { sub: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role },
        ACCESS_SECRET,
        { expiresIn: ACCESS_EXPIRES_IN }
    );
}

function generateRefreshToken(user) {
    return jwt.sign(
        { sub: user.id, role: user.role },
        REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRES_IN }
    );
}

// Middleware: проверка аутентификации
function authMiddleware(req, res, next) {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    try {
        const payload = jwt.verify(token, ACCESS_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

// Middleware: проверка ролей
function roleMiddleware(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
        }
        next();
    };
}

// ========== АУТЕНТИФИКАЦИЯ ==========

// Регистрация (доступ: Гость)
app.post('/api/auth/register', async (req, res) => {
    const { email, first_name, last_name, password } = req.body;

    if (!email || !first_name || !last_name || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await hashPassword(password);
    const newUser = {
        id: nanoid(8),
        email,
        first_name,
        last_name,
        password: hashedPassword,
        role: ROLES.ADMIN,  // по умолчанию обычный пользователь
        isActive: true      // для блокировки
    };

    users.push(newUser);
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
});

// Вход (доступ: Гость)
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = users.find(u => u.email === email);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    if (!user.isActive) {
        return res.status(403).json({ error: 'Account is blocked' });
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    refreshTokens.add(refreshToken);

    res.json({ accessToken, refreshToken });
});

// Обновление токенов (доступ: Гость)
app.post('/api/auth/refresh', (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
    }

    if (!refreshTokens.has(refreshToken)) {
        return res.status(401).json({ error: 'Invalid refresh token' });
    }

    try {
        const payload = jwt.verify(refreshToken, REFRESH_SECRET);
        const user = users.find(u => u.id === payload.sub);

        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'User not found or blocked' });
        }

        refreshTokens.delete(refreshToken);
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
        refreshTokens.add(newRefreshToken);

        res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
});

// Получить текущего пользователя (доступ: Пользователь+)
app.get('/api/auth/me', authMiddleware, (req, res) => {
    const user = users.find(u => u.id === req.user.sub);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
});

// ========== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ (только Администратор) ==========

// Получить список всех пользователей
app.get('/api/users', authMiddleware, roleMiddleware([ROLES.ADMIN]), (req, res) => {
    const usersList = users.map(({ password, ...rest }) => rest);
    res.json(usersList);
});

// Получить пользователя по ID
app.get('/api/users/:id', authMiddleware, roleMiddleware([ROLES.ADMIN]), (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
});

// Обновить информацию пользователя
app.put('/api/users/:id', authMiddleware, roleMiddleware([ROLES.ADMIN]), async (req, res) => {
    const userIndex = users.findIndex(u => u.id === req.params.id);
    if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
    }

    const { first_name, last_name, role, isActive } = req.body;
    const user = users[userIndex];

    if (first_name !== undefined) user.first_name = first_name;
    if (last_name !== undefined) user.last_name = last_name;
    if (role !== undefined && [ROLES.USER, ROLES.SELLER, ROLES.ADMIN].includes(role)) {
        user.role = role;
    }
    if (isActive !== undefined) user.isActive = isActive;

    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
});

// Блокировать/удалить пользователя
app.delete('/api/users/:id', authMiddleware, roleMiddleware([ROLES.ADMIN]), (req, res) => {
    const userIndex = users.findIndex(u => u.id === req.params.id);
    if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
    }

    users.splice(userIndex, 1);
    res.status(204).send();
});

// ========== УПРАВЛЕНИЕ ТОВАРАМИ ==========

// Создать товар (доступ: Продавец, Админ)
app.post('/api/products', authMiddleware, roleMiddleware([ROLES.SELLER, ROLES.ADMIN]), (req, res) => {
    const { title, category, description, price } = req.body;

    if (!title || !category || !description || price === undefined) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const newProduct = {
        id: nanoid(8),
        title,
        category,
        description,
        price: Number(price),
        createdBy: req.user.sub
    };

    products.push(newProduct);
    res.status(201).json(newProduct);
});

// Получить все товары (доступ: Пользователь+)
app.get('/api/products', authMiddleware, roleMiddleware([ROLES.USER, ROLES.SELLER, ROLES.ADMIN]), (req, res) => {
    res.json(products);
});

// Получить товар по ID (доступ: Пользователь+)
app.get('/api/products/:id', authMiddleware, roleMiddleware([ROLES.USER, ROLES.SELLER, ROLES.ADMIN]), (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
});

// Обновить товар (доступ: Продавец, Админ)
app.put('/api/products/:id', authMiddleware, roleMiddleware([ROLES.SELLER, ROLES.ADMIN]), (req, res) => {
    const productIndex = products.findIndex(p => p.id === req.params.id);
    if (productIndex === -1) {
        return res.status(404).json({ error: 'Product not found' });
    }

    const product = products[productIndex];
    if (product.createdBy !== req.user.sub && req.user.role !== ROLES.ADMIN) {
        return res.status(403).json({ error: 'You can only edit your own products' });
    }

    const { title, category, description, price } = req.body;
    products[productIndex] = {
        ...product,
        title: title || product.title,
        category: category || product.category,
        description: description || product.description,
        price: price !== undefined ? Number(price) : product.price
    };

    res.json(products[productIndex]);
});

// Удалить товар (доступ: Админ)
app.delete('/api/products/:id', authMiddleware, roleMiddleware([ROLES.ADMIN]), (req, res) => {
    const productIndex = products.findIndex(p => p.id === req.params.id);
    if (productIndex === -1) {
        return res.status(404).json({ error: 'Product not found' });
    }

    products.splice(productIndex, 1);
    res.status(204).send();
});

// Создать продавца (только для админа)
app.post('/api/users/seller', authMiddleware, roleMiddleware([ROLES.ADMIN]), async (req, res) => {
    const { email, first_name, last_name, password } = req.body;

    if (!email || !first_name || !last_name || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await hashPassword(password);
    const newUser = {
        id: nanoid(8),
        email,
        first_name,
        last_name,
        password: hashedPassword,
        role: ROLES.SELLER,
        isActive: true
    };

    users.push(newUser);
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    console.log(`Роли: guest (неавторизован), user, seller, admin`);
});