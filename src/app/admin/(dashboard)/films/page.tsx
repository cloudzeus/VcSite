import { prisma } from "@/lib/prisma"
import { FilmsClientPage } from "./client-page"

export const dynamic = 'force-dynamic'

export default async function FilmsPage() {
    const films = await prisma.film.findMany({
        include: {
            translations: true,
            heroVideo: true,
            media: { orderBy: { order: 'asc' }, include: { hashtags: true } }
        },
        orderBy: [{ order: 'asc' }, { releaseDate: 'desc' }]
    })
    return (
        <FilmsClientPage films={films} />
    )
}
