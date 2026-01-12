import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function PressPublicPage() {
    const items = await prisma.pressItem.findMany({
        where: { published: true },
        orderBy: { publishedAt: 'desc' },
        include: { translations: true, image: true }
    })

    return (
        <div className="min-h-screen bg-white text-black p-8 md:p-20">
            <h1 className="text-5xl md:text-7xl font-bold mb-12 tracking-tighter">PRESS</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {items.map(item => (
                    <a href={item.url} target="_blank" key={item.id} className="block group space-y-4">
                        <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
                            {item.image ? (
                                <img src={item.image.url} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                            ) : (
                                <div className="w-full h-full bg-gray-200" />
                            )}
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{item.outlet}</div>
                            <h2 className="text-xl font-bold leading-tight group-hover:underline">{item.translations.find(t => t.lang === 'el')?.title}</h2>
                            <p className="text-gray-500 mt-2 line-clamp-2">{item.translations.find(t => t.lang === 'el')?.description}</p>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    )
}
