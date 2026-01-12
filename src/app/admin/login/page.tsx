import { LoginForm } from "./login-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"

export default function LoginPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 animate-gradient">
            <Card className="w-full max-w-sm shadow-xl border-t-4 border-t-primary rounded-xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
                    <CardDescription>Enter your credentials to access the dashboard</CardDescription>
                </CardHeader>
                <CardContent>
                    <LoginForm />
                </CardContent>
                <CardFooter className="flex justify-center text-xs text-muted-foreground">
                    Protected Area
                </CardFooter>
            </Card>
        </div>
    )
}
