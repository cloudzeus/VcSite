import { SlidingMenu } from "@/components/menu/sliding-menu"

export default function HomePage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <SlidingMenu />

            <main className="container mx-auto px-8 py-20">
                <h1 className="text-6xl font-bold mb-8">V.NAKIS</h1>
                <p className="text-xl text-gray-400 max-w-2xl">
                    Film Director & Cinematographer
                </p>
            </main>
        </div>
    )
}
