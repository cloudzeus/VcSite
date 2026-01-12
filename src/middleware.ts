import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    const { nextUrl } = req
    const isLoggedIn = !!req.auth
    const isTargetingAdmin = nextUrl.pathname.startsWith('/admin')
    const isLoginUrl = nextUrl.pathname === '/admin/login'

    if (isTargetingAdmin && !isLoginUrl) {
        if (!isLoggedIn) {
            return NextResponse.redirect(new URL("/admin/login", nextUrl))
        }
        const role = req.auth?.user?.role
        if (role !== "ADMIN" && role !== "EDITOR") {
            // Redirect to login or show error. 
            // For now preventing access loops, we might redirect to a 'not allowed' page or just login again.
            return NextResponse.redirect(new URL("/admin/login", nextUrl))
        }
    }
    return NextResponse.next()
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
