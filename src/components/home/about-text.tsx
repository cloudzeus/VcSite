"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform, useInView } from "framer-motion"
import { cfHelveticaCondensed } from "@/lib/fonts"

const content = [
    "VCULTURE is a leading-edge Greek video production powerhouse specializing in high-impact visual storytelling. Born from the creative vision of Vagelis Nakis and the strategic infrastructure of PSDM ATHENS, VCULTURE bridges the gap between cinematic excellence and social consciousness.",
    "With a portfolio exceeding 10 million views, we produce content that demands attention. From award-winning short films in collaboration with 'The Smile of the Child' to international European Union campaigns (Missing Child Europe, Be Aware Project), our work spans across Greece, Martinique, and Portugal. We don't just create videos; we create cultural movements that resonate with Generation Z and beyond.",
    "Core Services:",
    "Cinematic Short Films: Socially conscious narratives focusing on critical issues (Bullying, LGBTQ+ rights, Mental Health).",
    "European Project Documentaries: Specialized production for EU-funded programs and international tenders.",
    "Digital-First Content: High-engagement Reels and social media campaigns with proven viral reach.",
    "Corporate & Institutional Storytelling: Presenting complex social concepts through a modern, human-centric lens."
]

export function AboutText() {
    const container = useRef(null)
    const { scrollYProgress } = useScroll({
        target: container,
        offset: ["start end", "end start"]
    })

    // Parallax effect: moves slightly faster than scroll
    const y = useTransform(scrollYProgress, [0, 1], [0, -100])

    return (
        <div ref={container} className={`w-[70%] mx-auto py-24 -mt-[150vh] relative z-20 bg-white ${cfHelveticaCondensed.className}`}>
            <motion.div style={{ y }} className="flex flex-col gap-8">
                {content.map((paragraph, i) => (
                    <Paragraph key={i}>{paragraph}</Paragraph>
                ))}
            </motion.div>
        </div>
    )
}

function Paragraph({ children }: { children: string }) {
    const element = useRef(null)
    const isInView = useInView(element, { amount: 0.8, once: true })
    const words = children.split(" ")

    return (
        <p
            ref={element}
            className="text-4xl md:text-5xl leading-[1.1] flex flex-wrap gap-x-3 gap-y-1 text-black"
        >
            {words.map((word, i) => (
                <Word key={i} index={i} isInView={isInView}>{word}</Word>
            ))}
        </p>
    )
}

function Word({ children, index, isInView }: { children: string, index: number, isInView: boolean }) {
    const variants = {
        initial: {
            y: "100%"
        },
        enter: {
            y: "0%",
            transition: {
                duration: 0.5,
                delay: 0.01 * index,
                ease: [0.33, 1, 0.68, 1] as [number, number, number, number]
            }
        }
    }

    return (
        <span className="relative overflow-hidden inline-flex">
            <motion.span
                variants={variants}
                initial="initial"
                animate={isInView ? "enter" : "initial"}
            >
                {children}
            </motion.span>
        </span>
    )
}
