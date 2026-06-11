import axios from 'axios';

export const api = axios.create({
  baseURL: '/api'
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'An unknown error occurred';
    return Promise.reject(new Error(message));
  }
);
