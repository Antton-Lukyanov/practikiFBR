import React, { useState, useEffect } from 'react';

export default function ProductModal({ mode, product, onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: '', category: '', description: '', price: '', stock: ''
  });

  useEffect(() => {
    if (product) {
      setForm(product);
    }
  }, [product]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      price: Number(form.price),
      stock: Number(form.stock)
    });
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                  background: 'rgba(0,0,0,0.5)', display: 'flex', 
                  alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', width: '400px' }}>
        <h2>{mode === 'create' ? 'Добавить' : 'Редактировать'}</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '10px' }}>
            <input
              placeholder="Название"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              style={{ width: '100%', padding: '8px' }}
              required
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <input
              placeholder="Категория"
              value={form.category}
              onChange={e => setForm({...form, category: e.target.value})}
              style={{ width: '100%', padding: '8px' }}
              required
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <textarea
              placeholder="Описание"
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              style={{ width: '100%', padding: '8px' }}
              required
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="number"
              placeholder="Цена"
              value={form.price}
              onChange={e => setForm({...form, price: e.target.value})}
              style={{ width: '100%', padding: '8px' }}
              required
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="number"
              placeholder="Количество"
              value={form.stock}
              onChange={e => setForm({...form, stock: e.target.value})}
              style={{ width: '100%', padding: '8px' }}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose}>Отмена</button>
            <button type="submit">Сохранить</button>
          </div>
        </form>
      </div>
    </div>
  );
}