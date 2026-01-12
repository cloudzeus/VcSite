
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { FilmClientPage } from "./client-page"
import { Metadata } from "next"

export const dynamic = 'force-dynamic'

interface Props {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    const film = await prisma.film.findUnique({
        where: { slug },
        include: { translations: true }
    })

    if (!film) return {}

    const t = film.translations.find(tr => tr.lang === 'el') || film.translations[0]

    return {
        title: t?.metaTitle || t?.title || 'Film',
        description: t?.metaDescription || t?.logline || t?.synopsis?.slice(0, 160),
        keywords: t?.keywords?.split(',').map(k => k.trim()) || film.tags as string[],
        openGraph: {
            title: t?.metaTitle || t?.title || 'Film',
            description: t?.metaDescription || t?.logline || t?.synopsis?.slice(0, 160),
            // images: film.heroVideoId ? ... : [] // Could fetch hero video/image url if needed, but simpler for now
        }
    }
}

export default async function FilmPage({ params }: Props) {
    const { slug } = await params
    const film = await prisma.film.findUnique({
        where: { slug },
        include: {
            translations: true,
            heroVideo: true,
            media: {
                orderBy: { order: 'asc' }
            },
            pressItems: {
                include: {
                    translations: true,
                    image: true
                },
                orderBy: { order: 'asc' }
            }
        }
    })

    if (!film) notFound()

    return <FilmClientPage film={film} />
}
