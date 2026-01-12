"use client"

import { useRef } from "react"
import { useScroll, useMotionValueEvent } from "framer-motion"
import { cfHelvetica } from "@/lib/fonts"
import { useLogo } from "@/context/logo-context"

import { useLang } from "@/context/lang-context"

interface PressSectionProps {
    items: any[]
}

export function PressSection({ items = [] }: PressSectionProps) {
    const containerRef = useRef(null)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    })
    const { setLogoType } = useLogo()
    const { lang } = useLang()

    // Switch to Light Logo when this black section dominates
    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        if (latest > 0.1 && latest < 0.9) {
            setLogoType("light")
        }
    })

    const heading = lang === 'en' ? "LATEST PRESS" : "ΤΥΠΟΣ"

    return (
        <div ref={containerRef} className="h-[200vh] relative z-20 -mt-[100vh]">
            <div className="sticky top-0 h-screen w-full bg-black flex items-center justify-center overflow-hidden">
                <div className={`w-full max-w-7xl px-4 flex flex-col gap-8 md:gap-12 ${cfHelvetica.className}`}>
                    <h2 className="text-6xl md:text-8xl font-bold text-white text-center mb-4 md:mb-8">
                        {heading}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {items.map((item, i) => {
                            // Find relevant translation
                            const trans = item.translations.find((t: any) => t.lang === lang) || item.translations.find((t: any) => t.lang === 'el') || item.translations[0]

                            return (
                                <a
                                    key={item.id}
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group bg-neutral-900/50 border border-neutral-800 hover:border-neutral-600 p-6 rounded-2xl text-white transition-all hover:bg-neutral-900"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest border border-neutral-800 rounded-full px-2 py-1 bg-neutral-950">
                                            {item.outlet || "Publication"}
                                        </div>
                                        {item.publishedAt && (
                                            <div className="text-[10px] text-neutral-600 font-mono">
                                                {new Date(item.publishedAt).toLocaleDateString("en-GB")}
                                            </div>
                                        )}
                                    </div>

                                    <h3 className="text-xl md:text-2xl font-bold mb-3 line-clamp-2 leading-tight group-hover:text-indigo-400 transition-colors">
                                        {trans?.title || "Untitled"}
                                    </h3>

                                    <p className="text-sm text-neutral-400 line-clamp-3 leading-relaxed">
                                        {trans?.description || trans?.metaDescription || ""}
                                    </p>
                                </a>
                            )
                        })}
                        {items.length === 0 && (
                            <div className="col-span-full text-center text-neutral-600 py-10">
                                No press items selected.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
