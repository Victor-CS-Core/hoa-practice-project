import { makeAutoObservable, runInAction } from 'mobx';
import { Account } from '../api/agent';
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
        localStorage.setItem('jwt', user.token);
    };

    register = async (values: RegisterFormValues) => {
        const user = await Account.register(values);
        runInAction(() => {
            this.user = user;
        });
        localStorage.setItem('jwt', user.token);
    };

    logout = () => {
        localStorage.removeItem('jwt');
        this.user = null;
    };

    getCurrentUser = async () => {
        const token = localStorage.getItem('jwt');
        if (!token) {
            runInAction(() => {
                this.user = null;
                this.loadingUser = false;
            });
            return;
        }

        runInAction(() => {
            this.loadingUser = true;
        });
        try {
            const user = await Account.current();
            runInAction(() => {
                this.user = user;
            });
        } catch {
            this.logout();
        } finally {
            runInAction(() => {
                this.loadingUser = false;
            });
        }
    };
}
