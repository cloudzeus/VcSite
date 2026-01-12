"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export type Lang = 'en' | 'el'

interface LangContextType {
    lang: Lang
    setLang: (lang: Lang) => void
    t: (en: string, el: string) => string
}

const LangContext = createContext<LangContextType | undefined>(undefined)

export function LangProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLangState] = useState<Lang>('el') // Default to EL per original
    const router = useRouter()

    useEffect(() => {
        const match = document.cookie.match(new RegExp('(^| )NEXT_LOCALE=([^;]+)'))
        if (match && (match[2] === 'en' || match[2] === 'el')) {
            setLangState(match[2] as Lang)
        }
    }, [])

    const setLang = (newLang: Lang) => {
        setLangState(newLang)
        document.cookie = `NEXT_LOCALE=${newLang}; path=/; max-age=31536000` // 1 year
        router.refresh()
    }

    const t = (en: string, el: string) => {
        return lang === 'en' ? en : el
    }

    return (
        <LangContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LangContext.Provider>
    )
}

export const useLang = () => {
    const context = useContext(LangContext)
    if (!context) throw new Error("useLang must be within LangProvider")
    return context
}
