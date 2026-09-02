import { makeAutoObservable, runInAction } from 'mobx';
import { isAxiosError } from 'axios';
import { Account } from '../api/agent';
import { queryClient } from '../queryClient';
import type { LoginFormValues, RegisterFormValues, User } from '../../types/user';
import type { RootStore } from './store';

export class AuthStore {
    user: User | null = null;
    loadingUser = true;
    rootStore: RootStore;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
        makeAutoObservable(this);
    }

    get isLoggedIn() {
        return !!this.user;
    }

    get isAdmin() {
        return this.user?.role === 'hoa_admin';
    }

    login = async (values: LoginFormValues) => {
        const user = await Account.login(values);
        runInAction(() => {
            this.user = user;
        });
        queryClient.clear();
    };

    register = async (values: RegisterFormValues) => {
        const user = await Account.register(values);
        runInAction(() => {
            this.user = user;
        });
        queryClient.clear();
    };

    logout = async () => {
        await Account.logout();
        runInAction(() => {
            this.user = null;
        });
        queryClient.clear();
    };

    getCurrentUser = async () => {
        runInAction(() => {
            this.loadingUser = true;
        });
        try {
            const user = await Account.current();
            runInAction(() => {
                this.user = user;
            });
        } catch (error) {
            if (isAxiosError(error) && error.response?.status === 401) {
                runInAction(() => {
                    this.user = null;
                });
            }
        } finally {
            runInAction(() => {
                this.loadingUser = false;
            });
        }
    };
}
