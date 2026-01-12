"use client"

import { useEffect, useRef, useState } from "react"

const CHARS = "-_~`!@#$%^&*()+=[]{}|;:,.<>?"

interface ScrambleTextProps {
    children: string
    className?: string
    hovered?: boolean
}

export function ScrambleText({ children, className, hovered }: ScrambleTextProps) {
    const [text, setText] = useState(children)
    const intervalRef = useRef<NodeJS.Timeout>(null)
    const cyclesRef = useRef(0)

    // We start scrambling when hovered becomes true
    useEffect(() => {
        if (!hovered) {
            // Reset to original text immediately when not hovered
            // Or we could finish the animation, but instant reset feels snappier for "mouse leave"
            if (intervalRef.current) clearInterval(intervalRef.current)
            setText(children)
            return
        }

        // Start scrambling
        cyclesRef.current = 0

        if (intervalRef.current) clearInterval(intervalRef.current)

        intervalRef.current = setInterval(() => {
            setText((currentText) => {
                const scrambled = children.split("").map((char, index) => {
                    if (index < cyclesRef.current) {
                        return children[index]
                    }

                    if (char === " ") return " "

                    return CHARS[Math.floor(Math.random() * CHARS.length)]
                }).join("")

                if (cyclesRef.current >= children.length) {
                    clearInterval(intervalRef.current!)
                }

                cyclesRef.current += 1 / 3 // Slower reveal speed: 3 frames per character roughly

                return scrambled
            })
        }, 30) // 30ms per frame

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [hovered, children])

    return <span className={className}>{text}</span>
}
