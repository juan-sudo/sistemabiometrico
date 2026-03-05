"use client"

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useUserStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,

      setSession: ({ user, accessToken, refreshToken }) =>
        set({
          user,
          isAuthenticated: true,
          accessToken,
          refreshToken,
        }),

      setAccessToken: (accessToken) =>
        set((state) => ({
          ...state,
          accessToken,
        })),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
        }),
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useUserStore;
