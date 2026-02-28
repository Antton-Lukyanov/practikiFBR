const express = require('express');
const { nanoid } = require('nanoid');
const cors = require('cors');

// ========== ДОБАВЛЯЕМ SWAGGER ==========
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

// ========== ТВОИ ДИСКИ (НЕ МЕНЯЕМ) ==========
let products = [
  { id: nanoid(6), name: 'Диск BMW Style 42', category: 'Штатные', description: 'R17, 5x120, ET20', price: 45000, stock: 3 },
  { id: nanoid(6), name: 'Alufelgen SF-71', category: 'Литые', description: 'R18, 5x120, ET35', price: 72000, stock: 5 },
  { id: nanoid(6), name: 'BBS LM', category: 'Кованые', description: 'R19, 5x120, ET40', price: 120000, stock: 2 },
  { id: nanoid(6), name: 'BMW Style 135', category: 'Штатные', description: 'R18, 5x120, ET34', price: 68000, stock: 4 },
  { id: nanoid(6), name: 'OZ Racing', category: 'Литые', description: 'R18, 5x120, ET38', price: 89000, stock: 3 },
  { id: nanoid(6), name: 'AC Schnitzer', category: 'Тюнинг', description: 'R19, 5x120, ET42', price: 115000, stock: 1 },
  { id: nanoid(6), name: 'BMW Style 433', category: 'Штатные', description: 'R18, 5x112, ET30', price: 59000, stock: 6 },
  { id: nanoid(6), name: 'Vossen CVT', category: 'Литые', description: 'R20, 5x120, ET45', price: 105000, stock: 2 },
  { id: nanoid(6), name: 'BMW Style 269', category: 'Штатные', description: 'R19, 5x120, ET31', price: 82000, stock: 3 },
  { id: nanoid(6), name: 'Breyton GTS', category: 'Литые', description: 'R19, 5x120, ET37', price: 78000, stock: 4 }
];

// ========== НАСТРОЙКИ SWAGGER (ДОБАВЛЯЕМ) ==========
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API управления дисками BMW',
      version: '1.0.0',
      description: 'API для интернет-магазина дисков на BMW'
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Локальный сервер'
      }
    ]
  },
  apis: ['./server.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ========== SWAGGER-КОММЕНТАРИИ (ДОБАВЛЯЕМ НАД КАЖДЫМ МАРШРУТОМ) ==========

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - category
 *         - description
 *         - price
 *         - stock
 *       properties:
 *         id:
 *           type: string
 *           description: Автоматически сгенерированный ID
 *         name:
 *           type: string
 *           description: Название диска
 *         category:
 *           type: string
 *           description: Категория (Оригинал, Литые, Кованые)
 *         description:
 *           type: string
 *           description: Описание (R18, 5x120, ET и т.д.)
 *         price:
 *           type: integer
 *           description: Цена в рублях
 *         stock:
 *           type: integer
 *           description: Количество на складе
 *       example:
 *         id: "abc123"
 *         name: "Диск BMW Style 42"
 *         category: "Оригинал"
 *         description: "R17, 5x120, ET20"
 *         price: 45000
 *         stock: 3
 */

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Управление дисками
 */

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать новый диск
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - description
 *               - price
 *               - stock
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: integer
 *               stock:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Диск создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */
app.post('/api/products', (req, res) => {
  const { name, category, description, price, stock } = req.body;
  const newProduct = {
    id: nanoid(6),
    name: name.trim(),
    category: category.trim(),
    description: description.trim(),
    price: Number(price),
    stock: Number(stock)
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить все диски
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список дисков
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get('/api/products', (req, res) => {
  res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить диск по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID диска
 *     responses:
 *       200:
 *         description: Данные диска
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Диск не найден
 */
app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: Обновить диск
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID диска
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: integer
 *               stock:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Обновленный диск
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Нет данных для обновления
 *       404:
 *         description: Диск не найден
 */
app.patch('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const { name, category, description, price, stock } = req.body;
  if (!name && !category && !description && !price && !stock) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  if (name) product.name = name.trim();
  if (category) product.category = category.trim();
  if (description) product.description = description.trim();
  if (price) product.price = Number(price);
  if (stock) product.stock = Number(stock);

  res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить диск
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID диска
 *     responses:
 *       204:
 *         description: Диск удален
 *       404:
 *         description: Диск не найден
 */
app.delete('/api/products/:id', (req, res) => {
  const exists = products.some(p => p.id === req.params.id);
  if (!exists) return res.status(404).json({ error: 'Product not found' });

  products = products.filter(p => p.id !== req.params.id);
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Сервер запущен: http://localhost:${port}`);
  console.log(`Swagger UI: http://localhost:${port}/api-docs`);
});