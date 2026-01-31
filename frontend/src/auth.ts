import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { authOptions } from "@/lib/auth" // Your full options with Database/Adapter

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  ...authOptions, // This contains the 'crypto' dependent code
})