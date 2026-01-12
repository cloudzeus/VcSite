import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function FilmsPublicPage() {
    const films = await prisma.film.findMany({
        where: { published: true },
        orderBy: { releaseDate: 'desc' },
        include: { translations: true, heroVideo: true }
    })

    return (
        <div className="min-h-screen bg-white text-black p-8 md:p-20">
            <h1 className="text-5xl md:text-7xl font-bold mb-12 tracking-tighter">FILMS</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-16">
                {films.map(film => (
                    <Link href={`/films/${film.slug}`} key={film.id} className="block group space-y-4">
                        <div className="aspect-video bg-gray-100 overflow-hidden relative">
                            {film.heroVideo ? (
                                <video src={film.heroVideo.url} muted playsInline className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gray-200" />
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold uppercase tracking-wide group-hover:underline">{film.translations.find(t => t.lang === 'el')?.title}</h2>
                            <p className="text-gray-500 mt-2">{film.translations.find(t => t.lang === 'el')?.logline}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
