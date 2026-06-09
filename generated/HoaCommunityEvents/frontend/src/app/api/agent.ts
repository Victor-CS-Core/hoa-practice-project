import axios, { AxiosError } from 'axios';

const baseURL = import.meta.env.VITE_API_URL;

export const agent = axios.create({
    baseURL,
    withCredentials: false,
});

agent.interceptors.request.use((config) => {
    const token = localStorage.getItem('jwt');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

agent.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            console.error('Unauthorized request');
        }
        return Promise.reject(error);
    }
);