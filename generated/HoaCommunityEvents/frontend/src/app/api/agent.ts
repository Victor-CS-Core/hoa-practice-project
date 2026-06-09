import axios, { AxiosError } from 'axios';
import type { CreateEventFormValues, EditEventFormValues, EventFilter, HoaEvent, PagedResult } from '../../types/event';
import type { Attendee } from '../../types/attendee';
import type { Profile, UpdateProfileValues } from '../../types/profile';
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
    postEmpty: <T>(url: string) => agent.post<T>(url, {}).then(responseBody),
    put: <T>(url: string, body: object) => agent.put<T>(url, body).then(responseBody),
    patch: <T>(url: string) => agent.patch<T>(url).then(responseBody),
    del: (url: string) => agent.delete(url),
    delWithBody: <T>(url: string) => agent.delete<T>(url).then(responseBody),
    getWithParams: <T>(url: string, params: object) => agent.get<T>(url, { params }).then(responseBody),
};

type ValidationEnvelope = {
    code?: string;
    message?: string;
    details?: Record<string, string[]>;
    traceId?: string;
};

const getApiRoot = () => {
    if (!baseURL) {
        return '';
    }

    const trimmed = baseURL.replace(/\/$/, '');
    return trimmed.endsWith('/api') ? trimmed.slice(0, -4) : trimmed;
};

export const Account = {
    login: (values: LoginFormValues) => requests.post<User>('/account/login', values),
    register: (values: RegisterFormValues) => requests.post<User>('/account/register', values),
    current: () => requests.get<User>('/account/current'),
};

export const Events = {
    list: (filter: EventFilter) => requests.getWithParams<PagedResult<HoaEvent>>('/events', filter),
    detail: (id: string) => requests.get<HoaEvent>(`/events/${id}`),
    create: (values: CreateEventFormValues) => requests.post<HoaEvent>('/events', values),
    edit: (id: string, values: EditEventFormValues) => requests.put<HoaEvent>(`/events/${id}`, values),
    cancel: (id: string) => requests.patch<HoaEvent>(`/events/${id}/cancel`),
    delete: (id: string) => requests.del(`/events/${id}`),
};

export const Attendance = {
    join: (eventId: string) => requests.postEmpty<{ attendeeCount: number }>(`/attendance/${eventId}/join`),
    leave: (eventId: string) => requests.delWithBody<{ attendeeCount: number }>(`/attendance/${eventId}/leave`),
    list: (eventId: string) => requests.get<Attendee[]>(`/attendance/${eventId}`),
};

export const Profiles = {
    detail: (username: string) => requests.get<Profile>(`/profiles/${username}`),
    update: (username: string, values: UpdateProfileValues) => requests.put<Profile>(`/profiles/${username}`, values),
};

export const Diagnostics = {
    health: () => axios.get<{ status?: string }>(`${getApiRoot()}/health`).then(responseBody),
    invalidRegister: (values: RegisterFormValues) =>
        agent.post('/account/register', values)
            .then(() => null)
            .catch((error: AxiosError<ValidationEnvelope>) => error.response?.data ?? null),
};