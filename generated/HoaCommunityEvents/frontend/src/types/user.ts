export type User = {
    displayName: string;
    username: string;
    email: string;
    token: string;
    role: string;
    profileImageUrl?: string | null;
};

export type LoginFormValues = {
    email: string;
    password: string;
};

export type RegisterFormValues = {
    email: string;
    username: string;
    displayName: string;
    password: string;
};
