import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { CreateEventFormValues, EditEventFormValues, EventFilter, HoaEvent, PagedResult } from '../../types/event';
import type { Attendee } from '../../types/attendee';
import type { Profile, UpdateProfileValues } from '../../types/profile';
import type { AdminUser, DeleteUserValues, LoginFormValues, PromoteUserToAdminValues, RegisterFormValues, User } from '../../types/user';

export const agent = axios.create({
    baseURL: '/api',
    withCredentials: true,
});

let csrfToken: string | null = null;
let csrfTokenRequest: Promise<string> | null = null;

export function resetCsrfTokenCache() {
    csrfToken = null;
    csrfTokenRequest = null;
}

async function getCsrfToken() {
    if (csrfToken) return csrfToken;

    csrfTokenRequest ??= agent.get<{ requestToken: string }>('/security/csrf')
        .then((response) => {
            csrfToken = response.data.requestToken;
            return csrfToken;
        })
        .finally(() => {
            csrfTokenRequest = null;
        });

    return csrfTokenRequest;
}

agent.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() ?? '')) {
        config.headers['X-CSRF-TOKEN'] = await getCsrfToken();
    }
    return config;
});

agent.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401 && error.config?.url !== '/account/current') {
            sessionStorage.setItem('sessionExpired', '1');
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

export type CloudinaryUploadSignature = {
    cloudName: string;
    apiKey: string;
    timestamp: number;
    folder: string;
    publicId: string;
    signature: string;
};

export type CloudinaryUploadScope = 'event' | 'profile';
export type CloudinaryProfileAssetType = 'avatar' | 'banner';

type ValidationEnvelope = {
    code?: string;
    message?: string;
    details?: Record<string, string[]>;
    traceId?: string;
};

type AdminPolicyProbeResult = {
    status: number;
    code?: string;
    message?: string;
};

export const Account = {
    login: async (values: LoginFormValues) => {
        const user = await requests.post<User>('/account/login', values);
        resetCsrfTokenCache();
        return user;
    },
    register: async (values: RegisterFormValues) => {
        const user = await requests.post<User>('/account/register', values);
        resetCsrfTokenCache();
        return user;
    },
    logout: async () => {
        await requests.postEmpty<void>('/account/logout');
        resetCsrfTokenCache();
    },
    current: () => requests.get<User>('/account/current'),
    listUsers: () => requests.get<AdminUser[]>('/account/users'),
    promoteAdmin: (values: PromoteUserToAdminValues) => requests.post<User>('/account/promote-admin', values),
    deleteUser: (values: DeleteUserValues) => requests.post<{ message: string }>('/account/delete-user', values),
};

export const Events = {
    list: (filter: EventFilter) => requests.getWithParams<PagedResult<HoaEvent>>('/events', filter),
    detail: (id: string) => requests.get<HoaEvent>(`/events/${id}`),
    create: (values: CreateEventFormValues) => requests.post<HoaEvent>('/events', values),
    edit: (id: string, values: EditEventFormValues) => requests.put<HoaEvent>(`/events/${id}`, values),
    cancel: (id: string) => requests.patch<HoaEvent>(`/events/${id}/cancel`),
    publish: (id: string) => requests.patch<HoaEvent>(`/events/${id}/publish`),
    unpublish: (id: string) => requests.patch<HoaEvent>(`/events/${id}/unpublish`),
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

export const Uploads = {
    getCloudinarySignature: (scope: CloudinaryUploadScope, profileAssetType?: CloudinaryProfileAssetType) =>
        requests.post<CloudinaryUploadSignature>('/uploads/cloudinary/signature', {
            scope,
            ...(scope === 'profile' && profileAssetType ? { profileAssetType } : {}),
        }),
};

export const Diagnostics = {
    health: () => axios.get<{ status?: string }>('/health').then(responseBody),
    invalidRegister: (values: RegisterFormValues) =>
        agent.post('/account/register', values)
            .then(() => null)
            .catch((error: AxiosError<ValidationEnvelope>) => error.response?.data ?? null),
    adminCreateProbe: (): Promise<AdminPolicyProbeResult> =>
        agent.post('/events', {
            title: '',
            description: '',
            category: '',
            locationWithinCommunity: '',
            startDate: '',
            endDate: '',
            maxAttendees: 0,
        })
            .then(() => ({
                status: 201,
                code: undefined,
                message: undefined,
            } satisfies AdminPolicyProbeResult))
            .catch((error: AxiosError<ValidationEnvelope>) => ({
                status: error.response?.status ?? 0,
                code: error.response?.data?.code,
                message: error.response?.data?.message,
            } satisfies AdminPolicyProbeResult)),
};
