import axios from 'axios';

const API_ENDPOINT = 'https://yumemi-frontend-engineer-codecheck-api.vercel.app';
const API_KEY = '8FzX5qLmN3wRtKjH7vCyP9bGdEaU4sYpT6cMfZnJ';

// APIクライアントのインスタンスを作成
const apiClient = axios.create({
  baseURL: API_ENDPOINT,
  headers: {
    'Content-Type': 'application/json',
    'X-API-KEY': API_KEY,
  },
});

export default apiClient;