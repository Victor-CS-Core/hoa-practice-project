import axios, { AxiosError } from 'axios';
import type { EventFilter, HoaEvent } from '../../types/event';
import type { LoginFormValues, RegisterFormValues, User } from '../../types/user';

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
            localStorage.removeItem('jwt');
        }
        return Promise.reject(error);
    }
);

const responseBody = <T>(response: { data: T }) => response.data;

const requests = {
    get: <T>(url: string) => agent.get<T>(url).then(responseBody),
    post: <T>(url: string, body: object) => agent.post<T>(url, body).then(responseBody),
    getWithParams: <T>(url: string, params: object) => agent.get<T>(url, { params }).then(responseBody),
};

export const Account = {
    login: (values: LoginFormValues) => requests.post<User>('/account/login', values),
    register: (values: RegisterFormValues) => requests.post<User>('/account/register', values),
    current: () => requests.get<User>('/account/current'),
};

export const Events = {
    list: (filter: EventFilter) => requests.getWithParams<HoaEvent[]>('/events', filter),
    detail: (id: string) => requests.get<HoaEvent>(`/events/${id}`),
};