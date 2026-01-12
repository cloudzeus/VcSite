"use client"

import { useRef } from "react"
import { useScroll, useMotionValueEvent } from "framer-motion"
import { cfHelvetica } from "@/lib/fonts"
import { useLogo } from "@/context/logo-context"

interface ColorSectionProps {
    color: string
    text: string
    logoType?: "dark" | "light"
    zIndex: number
}

export function ColorSection({ color, text, logoType = "light", zIndex }: ColorSectionProps) {
    const containerRef = useRef(null)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    })
    const { setLogoType } = useLogo()

    // Switch logo when this section covers the viewport (approx > 0.1)
    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        if (latest > 0.1 && latest < 0.9) {
            setLogoType(logoType)
        }
    })

    return (
        <div
            ref={containerRef}
            className={`h-[150vh] relative -mt-[100vh]`}
            style={{ zIndex }}
        >
            <div className={`sticky top-0 h-screen w-full ${color} flex items-center justify-center overflow-hidden`}>
                <div className={`text-center ${cfHelvetica.className}`}>
                    <h2 className={`text-6xl md:text-9xl font-bold ${logoType === 'light' ? 'text-white' : 'text-black'} mb-8`}>
                        {text}
                    </h2>
                    <p className={`text-xl ${logoType === 'light' ? 'text-white/80' : 'text-black/80'}`}>
                        Sticky Overlap Test
                    </p>
                </div>
            </div>
        </div>
    )
}
