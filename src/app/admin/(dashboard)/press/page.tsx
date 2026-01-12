import { prisma } from "@/lib/prisma"
import { PressClientPage } from "./client-page"

export const dynamic = 'force-dynamic'

export default async function PressPage() {
    const items = await prisma.pressItem.findMany({
        include: {
            translations: true,
            image: true,
            gallery: { orderBy: { order: 'asc' }, include: { hashtags: true } },
            films: { select: { id: true } }
        },
        orderBy: [{ order: 'asc' }, { publishedAt: 'desc' }]
    })

    // We need film list for the select box in the modal
    const allFilms = await prisma.film.findMany({
        select: { id: true, slug: true },
        orderBy: { releaseDate: 'desc' }
    })

    return <PressClientPage items={items} allFilms={allFilms} />
}
