"use client"

import { motion } from "framer-motion"

export function Stairs() {
    const height = {
        initial: {
            height: 0
        },
        enter: (i: number) => ({
            height: "100%",
            transition: { duration: 0.5, delay: 0.05 * i, ease: [0.33, 1, 0.68, 1] as [number, number, number, number] }
        }),
        exit: (i: number) => ({
            height: 0,
            transition: { duration: 0.5, delay: 0.05 * i, ease: [0.33, 1, 0.68, 1] as [number, number, number, number] }
        })
    }

    return (
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[90] flex flex-col justify-end">
            {/* Note: In olivier's code, stairs might be flex-row if vertical bars. 
                 If stripes are vertical, use flex-row. 
                 If stripes are horizontal, use flex-col.
                 User said "stripes". Usually vertical bars sliding down. 
                 Reference uses flex-row (vertical bars).
                 I'll use flex-row.
            */}
            <div className="flex w-full h-full">
                {[...Array(5)].map((_, i) => (
                    <motion.div
                        key={i}
                        variants={height}
                        {...{ initial: "initial", animate: "enter", exit: "exit" }}
                        custom={5 - i} /* Reverse staggered exit? Or standard */
                        className="relative w-full bg-white border-r border-gray-100 last:border-none"
                    />
                ))}
            </div>
        </div>
    )
}
