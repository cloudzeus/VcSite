"use client"

import { useActionState } from "react"
import { login } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginForm() {
    const [state, action, isPending] = useActionState(login, undefined)

    return (
        <form action={action} className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    defaultValue="gkozyris@i4ria.com"
                    required
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                />
            </div>
            {state && <p className="text-sm text-red-500 font-medium">{state}</p>}
            <Button type="submit" className="w-full mt-2" disabled={isPending}>
                {isPending ? "Sign in..." : "Sign in"}
            </Button>
        </form>
    )
}
