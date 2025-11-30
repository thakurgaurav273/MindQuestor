import { create } from 'zustand'

const userStore = (set: any) => ({
  user: null,
  setUser: (user: any) => set({ user }),
})
export const useUserStore = create(userStore);
