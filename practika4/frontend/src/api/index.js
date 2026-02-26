import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api'
});

export const getProducts = () => api.get('/products').then(res => res.data);
export const createProduct = (data) => api.post('/products', data).then(res => res.data);
export const updateProduct = (id, data) => api.patch(`/products/${id}`, data).then(res => res.data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);