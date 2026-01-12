"use client"

import { useRef } from "react"
import { useScroll, useMotionValueEvent } from "framer-motion"
import { cfHelvetica } from "@/lib/fonts"
import { useLogo } from "@/context/logo-context"

import { useLang } from "@/context/lang-context"

// ...

export function FinalSection() {
    const containerRef = useRef(null)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    })
    const { setLogoType } = useLogo()
    const { lang } = useLang()

    const content = {
        en: { title: "THE END.", subtitle: "Ready to start your project?" },
        el: { title: "ΤΕΛΟΣ.", subtitle: "Έτοιμοι να ξεκινήσουμε;" }
    }

    // Switch to Light Logo when this black section dominates
    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        if (latest > 0.1) {
            setLogoType("light")
        }
    })

    return (
        <div ref={containerRef} className="h-[100vh] relative z-30 -mt-[100vh]">
            <div className="sticky top-0 h-screen w-full bg-black flex items-center justify-center overflow-hidden">
                <div className={`text-center ${cfHelvetica.className}`}>
                    <h2 className="text-6xl md:text-9xl font-bold text-white mb-8">
                        {content[lang].title}
                    </h2>
                    <p className="text-xl text-neutral-400">
                        {content[lang].subtitle}
                    </p>
                </div>
            </div>
        </div>
    )
}
