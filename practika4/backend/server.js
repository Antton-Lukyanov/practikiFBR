const express = require('express');
const { nanoid } = require('nanoid');
const cors = require('cors');
const app = express();
const port = 3000;

// 10 дисков на BMW (просто массив)
let products = [
  { id: nanoid(6), name: 'Диск BMW Style 42', category: 'Оригинал', description: 'R17, 5x120', price: 45000, stock: 3 },
  { id: nanoid(6), name: 'Alufelgen SF-71', category: 'Литые', description: 'R18, 5x120', price: 72000, stock: 5 },
  { id: nanoid(6), name: 'BBS LM', category: 'Кованые', description: 'R19, 5x120', price: 120000, stock: 2 },
  { id: nanoid(6), name: 'BMW Style 135', category: 'Оригинал', description: 'R18, 5x120', price: 68000, stock: 4 },
  { id: nanoid(6), name: 'OZ Racing', category: 'Литые', description: 'R18, 5x120', price: 89000, stock: 3 },
  { id: nanoid(6), name: 'AC Schnitzer', category: 'Тюнинг', description: 'R19, 5x120', price: 115000, stock: 1 },
  { id: nanoid(6), name: 'BMW Style 433', category: 'Оригинал', description: 'R18, 5x112', price: 59000, stock: 6 },
  { id: nanoid(6), name: 'Vossen CVT', category: 'Литые', description: 'R20, 5x120', price: 105000, stock: 2 },
  { id: nanoid(6), name: 'BMW Style 269', category: 'Оригинал', description: 'R19, 5x120', price: 82000, stock: 3 },
  { id: nanoid(6), name: 'Breyton GTS', category: 'Литые', description: 'R19, 5x120', price: 78000, stock: 4 }
];

app.use(express.json());
app.use(cors());

// GET все товары
app.get('/api/products', (req, res) => {
  res.json(products);
});

// GET один товар
app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(product);
});

// POST создать товар
app.post('/api/products', (req, res) => {
  const { name, category, description, price, stock } = req.body;
  const newProduct = {
    id: nanoid(6),
    name, category, description,
    price: Number(price),
    stock: Number(stock)
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// PATCH обновить товар
app.patch('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  
  const { name, category, description, price, stock } = req.body;
  if (name) product.name = name;
  if (category) product.category = category;
  if (description) product.description = description;
  if (price) product.price = Number(price);
  if (stock) product.stock = Number(stock);
  
  res.json(product);
});

// DELETE удалить товар
app.delete('/api/products/:id', (req, res) => {
  products = products.filter(p => p.id !== req.params.id);
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});