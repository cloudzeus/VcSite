import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    cookies: {
        sessionToken: {
            name: process.env.NODE_ENV === "production" ? "__Secure-next-auth.session-token-v1" : "next-auth.session-token-v1",
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
            },
        },
    },
    secret: process.env.AUTH_SECRET,
    session: { strategy: "jwt" },
    providers: [], // Providers configured in auth.ts
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id ?? ""
                token.role = user.role ?? "USER"
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id
                session.user.role = token.role
            }
            return session
        },
    },
    trustHost: true,
} satisfies NextAuthConfig
