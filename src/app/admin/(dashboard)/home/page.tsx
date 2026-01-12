import { getHomePage } from "@/app/actions/home"
import { prisma } from "@/lib/prisma"
import { HomeClientPage } from "./client-page"

export default async function AdminHomePage() {
    const home = await getHomePage()

    // Fetch options for select
    const films = await prisma.film.findMany({
        where: { published: true },
        select: { id: true, slug: true },
        orderBy: { releaseDate: 'desc' }
    })

    const press = await prisma.pressItem.findMany({
        where: { published: true },
        select: {
            id: true,
            outlet: true,
            translations: { select: { title: true, lang: true } }
        },
        orderBy: { publishedAt: 'desc' }
    })

    // Format press items for clearer selection (Outlet - Title)
    const formattedPress = press.map(p => {
        const title = p.translations.find(t => t.lang === 'el')?.title || p.translations[0]?.title || "Untitled"
        return {
            id: p.id,
            label: `${p.outlet || 'Unknown'} - ${title}`
        }
    })

    return <HomeClientPage home={home} films={films} press={formattedPress} />
}
