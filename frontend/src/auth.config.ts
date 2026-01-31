// src/auth.config.ts
import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  providers: [], // You can leave this empty for now or add social providers later
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      return true // The middleware handles the actual redirect logic
    },
  },
} satisfies NextAuthConfig