"use client"

import { useScroll, useTransform, motion, useInView, useMotionValueEvent } from "framer-motion"
import { useRef } from "react"
import { cfHelveticaCondensed, cfHelvetica } from "@/lib/fonts"
import { useLogo } from "@/context/logo-context"

interface HeroMaskProps {
    videoUrl?: string
    maskUrl?: string
    text?: string
}

export function HeroMask({
    videoUrl = "/video/nefeli.mp4",
    maskUrl = "/initialmask.svg",
    text
}: HeroMaskProps) {
    // If text is provided, use it. Otherwise default (but defaults are removed from here to separate file if dynamic)
    // For now, if no text, fallback to empty array or previously hardcoded?
    // User wants dynamic.
    const dynamicContent = text ? text.split("\n").filter(Boolean) : [
        "VCULTURE is a leading-edge Greek video production powerhouse specializing in high-impact visual storytelling.",
        "With a portfolio exceeding 10 million views, we produce content that demands attention."
    ]

    const containerRef = useRef(null)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    })
    const { setLogoType } = useLogo()

    // Switch logo based on scroll position
    // Always 'dark' (Start Video + White Panel) - Next Section (Cards) is White too.
    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        setLogoType("dark")
    })

    // Animation phases (250vh container - significantly reduced from 500vh)
    // 0 -> 0.4: Mask Zoom
    // 0.2 -> 0.6: Panel Slide Up
    // 0.8 -> 0.95: Text Fade Out
    const maskSize = useTransform(scrollYProgress, [0, 0.4], ["65%", "4000%"])
    const panelY = useTransform(scrollYProgress, [0.2, 0.6], ["100%", "0%"])
    const textOpacity = useTransform(scrollYProgress, [0.8, 0.95], [1, 0])

    return (
        <div ref={containerRef} className="h-[250vh] relative bg-black">
            <div className="sticky top-0 h-screen w-full overflow-hidden bg-black">
                {/* Video Layer */}
                <motion.div
                    className="absolute inset-0 w-full h-full"
                    style={{
                        maskImage: `url('${maskUrl}')`,
                        WebkitMaskImage: `url('${maskUrl}')`,
                        maskPosition: "center",
                        WebkitMaskPosition: "center",
                        maskRepeat: "no-repeat",
                        WebkitMaskRepeat: "no-repeat",
                        maskSize,
                        WebkitMaskSize: maskSize,
                    }}
                >
                    <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                    >
                        <source src={videoUrl} type="video/mp4" />
                    </video>
                </motion.div>

                {/* White Panel Layer (Slides Up) */}
                <motion.div
                    style={{ y: panelY }}
                    className={`absolute inset-0 bg-white z-20 flex flex-col justify-center items-center ${cfHelvetica.className}`}
                >
                    <motion.div
                        style={{ opacity: textOpacity }}
                        className="w-[90%] md:w-[70%] flex flex-col gap-8 text-black text-left lg:text-justify hyphens-auto"
                    >
                        {dynamicContent.map((paragraph, i) => (
                            <Paragraph key={i}>{paragraph}</Paragraph>
                        ))}
                    </motion.div>
                </motion.div>
            </div>
        </div>
    )
}

function Paragraph({ children }: { children: string }) {
    const element = useRef(null)
    const isInView = useInView(element, { amount: 0.5 })
    const words = children.split(" ")

    return (
        <p
            ref={element}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-none text-left lg:text-justify hyphens-auto font-extrabold tracking-tighter"
        >
            {words.map((word, i) => {
                return (
                    <span key={i} className="inline">
                        <Word index={i} isInView={isInView} isRed={word.toUpperCase().includes("VCULTURE")}>{word}</Word>
                        {" "}
                    </span>
                )
            })}
        </p>
    )
}

function Word({ children, index, isInView, isRed }: { children: string, index: number, isInView: boolean, isRed?: boolean }) {
    const variants = {
        initial: {
            y: "110%"
        },
        enter: {
            y: "0%",
            transition: {
                duration: 1,
                delay: 0.02 * index,
                ease: [0.33, 1, 0.68, 1] as [number, number, number, number]
            }
        }
    }

    return (
        <span className="relative overflow-hidden inline-flex translate-y-1 pb-1">
            <motion.span
                variants={variants}
                initial="initial"
                animate={isInView ? "enter" : "initial"}
                className={`inline-block ${isRed ? "text-[#FF3333]" : ""}`}
            >
                {children}
            </motion.span>
        </span>
    )
}
