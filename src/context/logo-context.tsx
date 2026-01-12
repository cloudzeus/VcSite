"use client"

import { createContext, useContext, useState } from "react"

type LogoType = "dark" | "light"

interface LogoContextType {
    logoType: LogoType
    setLogoType: (type: LogoType) => void
}

const LogoContext = createContext<LogoContextType | undefined>(undefined)

export function LogoProvider({ children }: { children: React.ReactNode }) {
    const [logoType, setLogoType] = useState<LogoType>("dark")

    return (
        <LogoContext.Provider value={{ logoType, setLogoType }}>
            {children}
        </LogoContext.Provider>
    )
}

export function useLogo() {
    const context = useContext(LogoContext)
    if (context === undefined) {
        throw new Error("useLogo must be used within a LogoProvider")
    }
    return context
}
