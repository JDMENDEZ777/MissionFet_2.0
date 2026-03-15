import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api', // La URL de tu Laravel
});

export default api;