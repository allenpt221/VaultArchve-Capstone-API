import axios from 'axios';

const getBaseURL = () => {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000/api';
  }

  if (typeof window === 'undefined') {
    const port = process.env.PORT || 3000;
    return `http://localhost:${port}/api`;
  }

  return '/api';
};

const axiosIntance = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
});

export default axiosIntance;