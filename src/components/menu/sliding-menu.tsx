"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Stairs } from "./stairs"
import { cfHelvetica } from "@/lib/fonts"
import { ScrambleText } from "@/components/ui/scramble-text"
import { useLogo } from "@/context/logo-context"
import { useLang } from "@/context/lang-context"

const baseMenuItems = [
    { key: "HOME", href: "/", src: "https://images.unsplash.com/photo-1480044965905-835469032d54?q=80&w=2070&auto=format&fit=crop" },
    { key: "FILMS", href: "/films", src: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025&auto=format&fit=crop" },
    { key: "ABOUT", href: "/about", src: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop" },
    { key: "PRESS", href: "/press", src: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2070&auto=format&fit=crop" },
    { key: "CONTACT", href: "/contact", src: "https://images.unsplash.com/photo-1596524430615-b46475ddff6e?q=80&w=2070&auto=format&fit=crop" },
]

const menuLabels = {
    en: { HOME: "HOME", FILMS: "FILMS", ABOUT: "ABOUT", PRESS: "PRESS", CONTACT: "CONTACT" },
    el: { HOME: "ΑΡΧΙΚΗ", FILMS: "ΤΑΙΝΙΕΣ", ABOUT: "ΣΧΕΤΙΚΑ", PRESS: "ΤΥΠΟΣ", CONTACT: "ΕΠΙΚΟΙΝΩΝΙΑ" }
}

const socialLinks = [
    { name: "IG", href: "#" },
    { name: "FB", href: "#" },
    { name: "LI", href: "#" },
    { name: "VI", href: "#" },
]

const menuVariants = {
    initial: {
        opacity: 0
    },
    enter: {
        opacity: 1,
        transition: {
            duration: 0.5,
            delay: 0.4,
            ease: [0.76, 0, 0.24, 1] as [number, number, number, number]
        }
    },
    exit: {
        opacity: 0,
        transition: {
            duration: 0.3,
            ease: [0.76, 0, 0.24, 1] as [number, number, number, number]
        }
    }
}

const linkAnimation = {
    initial: {
        y: 80,
        opacity: 0
    },
    enter: (i: number) => ({
        y: 0,
        opacity: 1,
        transition: {
            duration: 0.8,
            delay: 0.5 + (i * 0.1),
            ease: [0.76, 0, 0.24, 1] as [number, number, number, number]
        }
    }),
    exit: {
        y: 80,
        opacity: 0,
        transition: {
            duration: 0.3,
            ease: [0.76, 0, 0.24, 1] as [number, number, number, number]
        }
    }
}

export function SlidingMenu() {
    const { lang, setLang } = useLang()
    const menuItems = baseMenuItems.map(item => ({
        ...item,
        title: menuLabels[lang][item.key as keyof typeof menuLabels.en]
    }))

    const [isOpen, setIsOpen] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const [isAnimationComplete, setIsAnimationComplete] = useState(false)
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

    // Mouse follower logic
    const mouse = {
        x: useMotionValue(0),
        y: useMotionValue(0)
    }

    // Smooth spring animation for the image movement
    const smoothMouse = {
        x: useSpring(mouse.x, { stiffness: 150, damping: 15, mass: 0.1 }),
        y: useSpring(mouse.y, { stiffness: 150, damping: 15, mass: 0.1 })
    }

    const manageMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e
        mouse.x.set(clientX)
        mouse.y.set(clientY)
    }

    const { logoType } = useLogo()
    const pathname = usePathname()

    // Close menu when route changes
    useEffect(() => {
        setIsOpen(false)
        setIsAnimationComplete(false)
    }, [pathname])

    // Handle animation complete state
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                setIsAnimationComplete(true)
            }, 1000) // Wait for entrance animation to finish (max delay ~0.9s + duration)
            return () => clearTimeout(timer)
        } else {
            setIsAnimationComplete(false)
        }
    }, [isOpen])

    // Don't render on admin pages or login
    if (pathname?.startsWith('/admin') || pathname?.startsWith('/sign-in') || pathname?.startsWith('/login')) {
        return null
    }

    return (
        <>
            {/* Logo */}
            <Link href="/" className="fixed top-0 left-0 z-[110] w-[75px] h-[75px] block relative">
                <AnimatePresence mode="wait">
                    <motion.img
                        key={logoType}
                        src={logoType === 'dark' ? "/logo-dark.svg" : "/logo-lite.svg"}
                        alt="V.NAKIS Logo"
                        className="w-full h-full object-contain absolute inset-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    />
                </AnimatePresence>
            </Link>

            {/* Burger Button */}
            <div className="fixed right-0 top-0 z-[110]">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className="relative flex items-center justify-center w-[100px] h-[40px] md:w-[150px] md:h-[80px] bg-white rounded-bl-3xl overflow-hidden group cursor-pointer"
                >
                    {/* Background Animation - Red on Hover/Open */}
                    <motion.div
                        initial={{ top: "-100%" }}
                        animate={{ top: isOpen || isHovered ? "0%" : "-100%" }}
                        transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
                        className="absolute w-full h-full bg-[#FF3333]"
                    />

                    {/* Button Content */}
                    <div className={`relative w-full h-full flex items-center justify-center gap-4 px-4 transition-colors duration-500 ${isOpen || isHovered ? "text-white" : "text-black"}`}>
                        <div className={`flex flex-col items-end gap-[5px] transition-all duration-300 ${isOpen ? "rotate-45" : ""}`}>
                            {isOpen ? (
                                // Close X Icon
                                <div className="relative w-8 h-8 flex items-center justify-center">
                                    <span className="absolute w-full h-[2px] bg-current rotate-0" />
                                    <span className="absolute w-full h-[2px] bg-current rotate-90" />
                                </div>
                            ) : (
                                // Burger Lines SVG
                                <svg width="40" height="9" viewBox="0 0 56 7" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[30px] md:w-[40px]">
                                    <line x1="56" y1="0.5" x2="0" y2="0.5" stroke="currentColor" strokeWidth="2" />
                                    <line x1="56" y1="6.5" x2="28" y2="6.5" stroke="currentColor" strokeWidth="2" />
                                </svg>
                            )}
                        </div>

                        <p className={`hidden md:block text-sm font-medium uppercase tracking-wider transition-all duration-500 ${isOpen ? "opacity-0" : "opacity-100"}`}>
                            Menu
                        </p>
                    </div>
                </button>
            </div>

            {/* Menu Overlay */}
            <AnimatePresence mode="wait">
                {isOpen && (
                    <>
                        <Stairs />
                        <motion.div
                            variants={menuVariants}
                            initial="initial"
                            animate="enter"
                            exit="exit"
                            className="fixed inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none"
                        >
                            <div className="w-full flex justify-center pointer-events-auto relative" onMouseMove={manageMouseMove}>

                                {/* Floating Image Preview - Following Mouse */}
                                <motion.div
                                    style={{ left: smoothMouse.x, top: smoothMouse.y }}
                                    className="fixed pointer-events-none hidden md:block z-[10] overflow-hidden rounded-lg w-[200px] h-[250px] -translate-x-1/2 -translate-y-1/2"
                                >
                                    <AnimatePresence mode="wait">
                                        {hoveredIndex !== null && (
                                            <motion.img
                                                key={hoveredIndex}
                                                src={menuItems[hoveredIndex].src}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                transition={{ duration: 0.3 }}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </AnimatePresence>
                                </motion.div>

                                <nav className="flex flex-col items-start gap-6 md:gap-12 relative z-[50] mix-blend-difference">
                                    {menuItems.map((item, i) => (
                                        <div key={item.key} className={`${isAnimationComplete ? "" : "overflow-hidden"}`}>
                                            <motion.div
                                                custom={i}
                                                variants={linkAnimation}
                                                initial="initial"
                                                animate="enter"
                                                exit="exit"
                                            >
                                                <Link
                                                    href={item.href}
                                                    onClick={() => setIsOpen(false)}
                                                    onMouseEnter={() => setHoveredIndex(i)}
                                                    onMouseLeave={() => setHoveredIndex(null)}
                                                    className={`${cfHelvetica.className} font-sans text-4xl sm:text-6xl md:text-8xl font-light text-black hover:text-[#FF3333] transition-all duration-300 tracking-widest flex items-center gap-4 sm:gap-6 group hover:scale-110 origin-left`}
                                                >
                                                    <span className="text-lg sm:text-2xl md:text-3xl font-mono text-[#FF3333] transition-colors duration-300 mt-1 sm:mt-2 md:mt-4 tracking-normal">0{i + 1}</span>
                                                    <div className="relative">
                                                        <span className="invisible">{item.title}</span>
                                                        <span className="absolute left-0 top-0 w-full h-full">
                                                            <ScrambleText hovered={hoveredIndex === i} className="relative z-10">
                                                                {item.title}
                                                            </ScrambleText>
                                                        </span>
                                                    </div>
                                                </Link>
                                            </motion.div>
                                        </div>
                                    ))}
                                </nav>
                            </div>

                            {/* Social Links & Footer */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ delay: 0.8, duration: 0.5 }}
                                className="absolute bottom-10 left-10 md:left-[10vw] flex flex-col md:flex-row gap-8 md:gap-20 text-gray-500 text-xs uppercase font-medium pointer-events-auto"
                            >
                                <div className="flex flex-col gap-2">
                                    <span className="text-black mb-2 font-bold">Socials</span>
                                    <div className="flex gap-4">
                                        {socialLinks.map((social) => (
                                            <a key={social.name} href={social.href} className="hover:text-[#FF3333] transition-colors">{social.name}</a>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <span className="text-black mb-2 font-bold">Languages</span>
                                    <div className="flex gap-4">
                                        <span onClick={() => setLang('en')} className={`cursor-pointer ${lang === 'en' ? 'text-black font-bold' : 'hover:text-[#FF3333] transition-colors'}`}>EN</span>
                                        <span onClick={() => setLang('el')} className={`cursor-pointer ${lang === 'el' ? 'text-black font-bold' : 'hover:text-[#FF3333] transition-colors'}`}>EL</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <span className="text-black mb-2 font-bold">Design</span>
                                    <span>Vangelis Nakis</span>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <span className="text-black mb-2 font-bold">Location</span>
                                    <span>Athens, Greece</span>
                                </div>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}
