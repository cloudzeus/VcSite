"use server"
import { signIn, signOut } from "@/auth"

export async function login(prevState: string | undefined, formData: FormData) {
    try {
        await signIn("credentials", { ...Object.fromEntries(formData), redirectTo: "/admin" })
    } catch (error) {
        if ((error as Error).message.includes("CredentialsSignin")) {
            return "Invalid credentials."
        }
        throw error
    }
}

export async function logout() {
    await signOut()
}
