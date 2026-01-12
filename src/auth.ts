import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { authConfig } from "./auth.config"

const credentialsSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma),
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(raw) {
                const { email, password } = credentialsSchema.parse(raw)

                const user = await prisma.user.findUnique({ where: { email } })
                if (!user?.passwordHash) return null

                const ok = await bcrypt.compare(password, user.passwordHash)
                if (!ok) return null

                return { id: user.id, email: user.email, name: user.name, role: user.role }
            },
        }),
    ],
})
