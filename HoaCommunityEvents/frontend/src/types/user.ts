export type User = {
    displayName: string;
    username: string;
    email: string;
    role: string;
    profileImageUrl?: string | null;
    profileImagePositionX?: number;
    profileImagePositionY?: number;
    profileImageZoom?: number;
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

export type AdminUser = {
    displayName: string;
    username: string;
    email: string;
    role: string;
    profileImageUrl?: string | null;
    isMasterAdmin: boolean;
    canDelete: boolean;
};

export type PromoteUserToAdminValues = {
    email: string;
};

export type DeleteUserValues = {
    email: string;
};
