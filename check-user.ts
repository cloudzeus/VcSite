import { prisma } from "./src/lib/prisma"
import bcrypt from "bcryptjs"

async function checkUser() {
    const email = process.env.ADMIN_EMAIL
    console.log("Checking user:", email)
    const user = await prisma.user.findUnique({ where: { email } })
    console.log("User found:", user)

    if (user && user.passwordHash) {
        const isValid = await bcrypt.compare(process.env.ADMIN_PASSWORD!, user.passwordHash)
        console.log("Password valid:", isValid)
    }
}

checkUser()
