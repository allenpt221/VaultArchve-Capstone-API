    import axios from 'axios';

    const axiosIntance = axios.create({
        baseURL: process.env.NODE_ENV === "development" ? 'http://localhost:5000/api' : '/api',
        withCredentials: true
    })

    export default axiosIntance;