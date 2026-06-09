import { configure } from 'mobx';
import { createContext, useContext } from 'react';
import { AuthStore } from './authStore';

configure({ enforceActions: 'never' });

export class RootStore {
	authStore = new AuthStore(this);
}

export const store = new RootStore();
export const StoreContext = createContext(store);

export function useStore() {
	return useContext(StoreContext);
}