import React, { useState, useEffect } from 'react';
import ProductModal from '../components/ProductModal';
import * as api from '../api';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState({ open: false, mode: 'create', product: null });

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    const data = await api.getProducts();
    setProducts(data);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить?')) return;
    await api.deleteProduct(id);
    await loadProducts();
  };

  const handleSubmit = async (product) => {
    if (modal.mode === 'create') {
      await api.createProduct(product);
    } else {
      await api.updateProduct(product.id, product);
    }
    await loadProducts();
    setModal({ open: false, mode: 'create', product: null });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Диски на BMW</h1>
      <button onClick={() => setModal({ open: true, mode: 'create', product: null })}>
        Добавить
      </button>
      
      <div style={{ marginTop: '20px' }}>
        {products.map(p => (
          <div key={p.id} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px' }}>
            <div><strong>{p.name}</strong> ({p.category})</div>
            <div>{p.description}</div>
            <div>{p.price.toLocaleString()} ₽ | Склад: {p.stock} шт.</div>
            <div style={{ marginTop: '10px' }}>
              <button onClick={() => setModal({ open: true, mode: 'edit', product: p })}>
                Редактировать
              </button>
              <button onClick={() => handleDelete(p.id)} style={{ marginLeft: '10px' }}>
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>

      {modal.open && (
        <ProductModal
          mode={modal.mode}
          product={modal.product}
          onClose={() => setModal({ open: false, mode: 'create', product: null })}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}