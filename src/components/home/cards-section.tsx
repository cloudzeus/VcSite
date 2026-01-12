"use client"

import { useRef, useState, useEffect } from "react"
import { useScroll, useMotionValueEvent } from "framer-motion"
import { cfHelvetica } from "@/lib/fonts"
import { useLogo } from "@/context/logo-context"
import { useLang } from "@/context/lang-context"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { cn } from "@/lib/utils"
import Link from "next/link"

gsap.registerPlugin(ScrollTrigger)

interface CardsSectionProps {
    films?: {
        id: string
        slug: string
        heroVideo?: { url: string; kind: 'VIDEO' | 'IMAGE' } | null
        media?: { url: string, kind: string }[]
        translations?: { lang: string, title: string, logline?: string | null, synopsis?: string | null }[]
    }[]
}

export function CardsSection({ films = [] }: CardsSectionProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLDivElement>(null)
    const sliderRef = useRef<HTMLDivElement>(null)

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    })
    const { setLogoType } = useLogo()
    const { lang } = useLang()

    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        if (latest > 0.1 && latest < 0.9) {
            setLogoType("light")
        }
    })

    const heading = lang === 'en' ? "The movies" : "Οι Ταινίες μας"

    useGSAP(() => {
        if (!sliderRef.current || !triggerRef.current) return;

        const totalWidth = sliderRef.current.scrollWidth
        const windowWidth = window.innerWidth
        const scrollLimit = totalWidth - windowWidth + (windowWidth * 0.1)

        if (totalWidth <= windowWidth) {
            gsap.set(sliderRef.current, { x: 0 })
            return
        }

        gsap.to(sliderRef.current, {
            x: -scrollLimit,
            ease: "none",
            scrollTrigger: {
                trigger: triggerRef.current,
                pin: true,
                scrub: 1,
                start: "top top",
                end: () => `+=${totalWidth}`,
                invalidateOnRefresh: true,
            }
        })
    }, { scope: containerRef, dependencies: [films] })

    return (
        <div ref={containerRef} className="relative z-30 bg-[#FF3333]">
            <div ref={triggerRef} className="h-screen flex flex-col justify-center overflow-hidden py-10 md:py-0">
                <div className={`w-full max-w-[90vw] mx-auto mb-8 md:mb-16 ${cfHelvetica.className}`}>
                    <h2 className="text-5xl md:text-8xl font-extrabold text-white text-center tracking-tighter">
                        {heading}
                    </h2>
                </div>

                <div
                    ref={sliderRef}
                    className="flex items-center gap-4 md:gap-8 px-4 md:px-12 w-max"
                >
                    {films.map((film) => (
                        <Card key={film.id} film={film} lang={lang} />
                    ))}
                    {films.length === 0 && (
                        <div className="w-[90vw] flex items-center justify-center text-white/50 h-[40vh]">
                            No featured films selected in dashboard.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function Card({ film, lang }: { film: any, lang: string }) {
    const [videoError, setVideoError] = useState(false)
    const t = film.translations?.find((t: any) => t.lang === lang) || film.translations?.[0]
    const title = t?.title || film.slug
    const description = t?.synopsis || t?.logline || ""
    const image = film.media?.find((m: any) => m.kind === 'IMAGE') || film.media?.[0]
    const imageUrl = image?.url

    // Attempt to identify if it's an iframe embed link
    const isIframe = film.heroVideo?.url?.includes('iframe') || film.heroVideo?.url?.includes('/play/')

    return (
        <Link
            href={`/films/${film.slug}`}
            className="relative flex-shrink-0 w-[85vw] md:w-[60vw] lg:w-[45vw] aspect-[4/3] md:aspect-[16/9] bg-black/20 rounded-xl overflow-hidden group border border-white/10 block cursor-pointer"
        >
            {/* Base Image */}
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt={title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 text-white/30 text-sm">
                    No Image
                </div>
            )}

            {/* Video Layer */}
            {film.heroVideo?.url && film.heroVideo?.kind === 'VIDEO' && !videoError && (
                <div className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none">
                    {/* If we detect it's an iframe URL */}
                    {isIframe ? (
                        <iframe
                            src={film.heroVideo.url + (film.heroVideo.url.includes('?') ? '&' : '?') + 'autoplay=true&muted=true&muted=1&background=true&controls=0&loop=true'}
                            className="w-full h-full object-cover border-none"
                            allow="autoplay; encrypted-media"
                            onError={() => setVideoError(true)}
                            tabIndex={-1}
                        />
                    ) : (
                        <video
                            autoPlay
                            muted
                            loop
                            playsInline
                            poster={imageUrl}
                            preload="auto"
                            className="w-full h-full object-cover"
                            onError={() => setVideoError(true)}
                        >
                            <source src={film.heroVideo.url} type="video/mp4" />
                        </video>
                    )}
                </div>
            )}

            {/* Content Overlay */}
            <div className="absolute inset-0 z-20 p-8 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/20 to-transparent">
                <div className="transform transition-transform duration-500 ease-out group-hover:translate-y-[-10px] md:group-hover:translate-y-[-20%]">
                    <h3
                        className={cn(
                            "text-3xl md:text-5xl font-extrabold text-white mb-4 leading-none uppercase tracking-tighter origin-bottom-left transition-all duration-500 block",
                            cfHelvetica.className
                        )}
                    >
                        {title}
                    </h3>

                    <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-500 ease-in-out">
                        <div className="overflow-hidden">
                            <p className="text-sm md:text-lg text-gray-200 font-medium leading-relaxed max-w-[90%] opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100">
                                {description}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    )
}
