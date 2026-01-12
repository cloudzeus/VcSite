"use client"

import { useRef } from "react"
import { Film, FilmTranslation, MediaAsset, PressItem, PressItemTranslation, MediaKind } from "@prisma/client"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ArrowDown } from "lucide-react"
import Link from "next/link"
import Lenis from 'lenis'

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger)
}

// Define the props interface
interface FilmClientPageProps {
    film: Film & {
        translations: FilmTranslation[]
        media: MediaAsset[]
        heroVideo: MediaAsset | null
        pressItems: (PressItem & {
            translations: PressItemTranslation[];
        })[];
    }
}

export function FilmClientPage({ film }: FilmClientPageProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const heroRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)

    const t = film.translations.find(tr => tr.lang === 'el') || film.translations[0]

    useGSAP(() => {
        // Hero Animation (Typewriter Effect)
        const tl = gsap.timeline()

        // Title Typewriter
        tl.to(".hero-title .char", {
            opacity: 1,
            duration: 0.3,
            stagger: 0.1,
            ease: "none",
        })

            // Subtitle Typewriter
            .to(".hero-subtitle .char", {
                opacity: 1,
                duration: 0.2,
                stagger: 0.05,
                ease: "none",
            }, "-=0.2")

            .from(".scroll-indicator", {
                opacity: 0,
                y: -20,
                duration: 1,
                ease: "circ.out",
                delay: 0.5
            })

        // Parallax Effects

        // Media (Back Layer)
        gsap.to(".hero-media", {
            scrollTrigger: {
                trigger: heroRef.current,
                start: "top top",
                end: "bottom top",
                scrub: 0.5
            },
            yPercent: 30,
            scale: 1.1
        })

        // Title Parallax (Mid Layer - Faster)
        gsap.to(".hero-title", {
            scrollTrigger: {
                trigger: heroRef.current,
                start: "top top",
                end: "bottom top",
                scrub: 0.5
            },
            yPercent: -50,
            opacity: 0
        })

        // Subtitle Parallax (Front Layer - Slower)
        gsap.to(".hero-subtitle", {
            scrollTrigger: {
                trigger: heroRef.current,
                start: "top top",
                end: "bottom top",
                scrub: 0.5
            },
            yPercent: -30,
            opacity: 0
        })

        // Reveal Words Animation (Synopsis)
        gsap.utils.toArray<HTMLElement>(".reveal-word").forEach((el, i) => {
            gsap.to(el, {
                scrollTrigger: {
                    trigger: ".synopsis-container",
                    start: "top 75%",
                    end: "bottom 80%",
                    toggleActions: "play none none reverse"
                },
                y: 0,
                opacity: 1,
                duration: 0.6,
                ease: "back.out(1.7)",
                delay: i * 0.005
            })
        })

        // Standard Reveal (Sections)
        gsap.utils.toArray<HTMLElement>(".reveal-section").forEach((el) => {
            gsap.from(el, {
                scrollTrigger: {
                    trigger: el,
                    start: "top 85%",
                    toggleActions: "play none none reverse"
                },
                y: 40,
                opacity: 0,
                duration: 0.8,
                ease: "power3.out"
            })
        })

    }, { scope: containerRef })

    const credits = film.credits as Record<string, string> | Record<string, string>[] | null

    // Helper to split text for animation
    const words = t?.synopsis ? t.synopsis.split(" ") : []
    const titleChars = t?.title ? t.title.split("") : []
    const loglineChars = t?.logline ? t.logline.split("") : []

    return (
        <div ref={containerRef} className="min-h-screen bg-black text-white selection:bg-[#FF3333]/30">
            {/* Hero Section */}
            <section ref={heroRef} className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 w-full h-full hero-media pointer-events-none">
                    {film.heroVideo ? (
                        film.heroVideo.kind === MediaKind.VIDEO ? (
                            <video
                                src={film.heroVideo.url}
                                className="w-full h-full object-cover opacity-70"
                                autoPlay
                                muted
                                loop
                                playsInline
                            />
                        ) : (
                            <img
                                src={film.heroVideo.url}
                                className="w-full h-full object-cover opacity-70"
                                alt={t?.title}
                            />
                        )
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-900" />
                    )}
                    <div className="absolute inset-0 bg-black/20" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 text-center pt-20">
                    <h1 className="hero-title text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-8 text-white mix-blend-overlay flex flex-wrap justify-center gap-x-4 gap-y-2">
                        {t?.title && t.title.split(" ").map((word, wIndex) => (
                            <div key={wIndex} className="inline-block whitespace-nowrap">
                                {word.split("").map((char, cIndex) => (
                                    <span key={cIndex} className="char opacity-0 inline-block">{char}</span>
                                ))}
                            </div>
                        ))}
                    </h1>
                    {t?.logline && (
                        <div className="hero-subtitle text-lg md:text-xl text-gray-200 font-light max-w-3xl mx-auto leading-relaxed drop-shadow-lg tracking-[0.15em] flex flex-wrap justify-center gap-x-2">
                            {t.logline.split(" ").map((word, wIndex) => (
                                <div key={wIndex} className="inline-block whitespace-nowrap">
                                    {word.split("").map((char, cIndex) => (
                                        <span key={cIndex} className="char opacity-0 inline-block">{char}</span>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 scroll-indicator">
                    <ArrowDown className="text-white/70 animate-bounce" size={32} />
                </div>
            </section>

            {/* Content Section */}
            <div ref={contentRef} className="max-w-7xl mx-auto px-6 py-32 space-y-40">

                {/* Synopsis */}
                <section className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start synopsis-container">
                    <div className="md:col-span-4 reveal-section">
                        <h2 className="text-sm font-bold tracking-[0.2em] text-[#FF3333] uppercase mb-4 sticky top-32">Synopsis</h2>
                    </div>
                    <div className="md:col-span-8">
                        <div className="text-2xl md:text-4xl font-light leading-snug text-gray-200">
                            {words.map((word, i) => (
                                <span key={i} className="inline-block mr-[0.25em] reveal-word opacity-0 translate-y-4">
                                    {word}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Credits */}
                {credits && (
                    <section className="grid grid-cols-1 md:grid-cols-12 gap-12 border-t border-white/10 pt-24 reveal-section">
                        <div className="md:col-span-4">
                            <h2 className="text-sm font-bold tracking-[0.2em] text-[#FF3333] uppercase mb-4 sticky top-32">Credits</h2>
                        </div>
                        <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
                            {Array.isArray(credits) ? (
                                credits.map((credit, idx) => (
                                    <div key={idx} className="flex flex-col group">
                                        <span className="text-xs text-gray-500 uppercase tracking-wider mb-2 group-hover:text-[#FF3333] transition-colors">{credit.role}</span>
                                        <span className="text-xl font-medium tracking-wide">{credit.name}</span>
                                    </div>
                                ))
                            ) : (
                                Object.entries(credits).map(([role, name]) => (
                                    <div key={role} className="flex flex-col group">
                                        <span className="text-xs text-gray-500 uppercase tracking-wider mb-2 group-hover:text-[#FF3333] transition-colors">{role}</span>
                                        <span className="text-xl font-medium tracking-wide">{String(name)}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                )}

                {/* Gallery Preview / Additional Media if any */}
                {film.media.length > 0 && (
                    <section className="space-y-12 reveal-section">
                        <h2 className="text-sm font-bold tracking-[0.2em] text-[#FF3333] uppercase">Gallery</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                            {film.media.map((media, i) => (
                                <div key={media.id} className={`aspect-square bg-gray-900 overflow-hidden group relative ${i % 3 === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}>
                                    {media.kind === MediaKind.VIDEO ? (
                                        <video src={media.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" muted loop playsInline />
                                    ) : (
                                        <img src={media.url} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                                    )}
                                    <div className="absolute inset-0 bg-[#FF3333]/0 group-hover:bg-[#FF3333]/10 transition-colors duration-500" />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Press & Awards */}
                {film.pressItems.length > 0 && (
                    <section className="border-t border-white/10 pt-24 reveal-section">
                        <h2 className="text-sm font-bold tracking-[0.2em] text-[#FF3333] uppercase mb-16 text-center">Press & Recognition</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {film.pressItems.map(item => {
                                const itemT = item.translations.find(tr => tr.lang === 'el') || item.translations[0]
                                return (
                                    <Link
                                        href={item.url}
                                        target="_blank"
                                        key={item.id}
                                        className="group block bg-white/5 p-10 rounded-sm hover:bg-white/10 transition-all duration-500 border border-white/5 hover:border-[#FF3333]/30 hover:-translate-y-2"
                                    >
                                        <div className="text-xs text-[#FF3333] uppercase tracking-wider mb-6 flex items-center gap-3">
                                            {item.outlet}
                                            <span className="w-1.5 h-1.5 bg-[#FF3333] rounded-full" />
                                            {item.publishedAt ? new Date(item.publishedAt).getFullYear() : ''}
                                        </div>
                                        <h3 className="text-2xl font-bold mb-4 leading-tight group-hover:text-white transition-colors text-gray-200">
                                            {itemT?.title}
                                        </h3>
                                        {itemT?.description && (
                                            <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed group-hover:text-gray-400">
                                                {itemT.description}
                                            </p>
                                        )}
                                    </Link>
                                )
                            })}
                        </div>
                    </section>
                )}
            </div>
        </div>
    )
}
