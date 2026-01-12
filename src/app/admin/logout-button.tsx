"use client"

import { logout } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"

export function LogoutButton() {
    return (
        <Button variant="ghost" onClick={() => logout()} className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
            Logout
        </Button>
    )
}
