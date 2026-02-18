const express = require('express');
const app = express();
const port = 3000;

let bumpers = [
    { id: 1, name: 'Передний бампер на BMW E46', price: 8500 },
    { id: 2, name: 'Задний бампер на BMW E36', price: 7200 },
    { id: 3, name: 'Передний бампер M-Sport на BMW E90', price: 12400 },
];

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Сервер работает');
});

app.post('/bumpers', (req, res) => {
    const { name, price } = req.body;
    const newBumper = {
        id: Date.now(),
        name: name,
        price: price
    };
    bumpers.push(newBumper);
    res.status(201).json(newBumper);
});

app.get('/bumpers', (req, res) => {
    res.json(bumpers);
});

app.get('/bumpers/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const bumper = bumpers.find(b => b.id === id);
    res.json(bumper);
});

app.patch('/bumpers/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { name, price } = req.body;
    const bumperIndex = bumpers.findIndex(b => b.id === id);
    if (name !== undefined) {
        bumpers[bumperIndex].name = name;
    }
    if (price !== undefined) {
        bumpers[bumperIndex].price = price;
    }
    res.json(bumpers[bumperIndex]);
});

app.delete('/bumpers/:id', (req, res) => {
    const id = parseInt(req.params.id);
    bumpers = bumpers.filter(b => b.id !== id);
    res.send('Ok');
});

app.listen(port, () => {
    console.log(`http://localhost:${port}`);
});