import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth'; // Replace with your actual API URL

const authService = {
  register: async (userData) => {
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data;
  },

  login: async (email, password) => {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    if (response.data.token) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  },

  refreshToken: async () => {
    const user = authService.getCurrentUser();
    if (user && user.refreshToken) {
      const response = await axios.post(`${API_URL}/refresh`, {
        refreshToken: user.refreshToken,
      });
      if (response.data.accessToken) {
        user.token = response.data.accessToken;
        localStorage.setItem('user', JSON.stringify(user));
      }
      return response.data;
    }
    return null;
  },
};

export default authService;
