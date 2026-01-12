"use server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

interface FilmTranslationData {
    title?: string
    logline?: string
    synopsis?: string
    metaTitle?: string
    metaDescription?: string
    keywords?: string
}

interface FilmData {
    id?: string
    slug: string
    published: boolean
    releaseDate?: string
    heroVideoId?: string
    tags?: string[]
    credits?: unknown
    el: FilmTranslationData
    en: FilmTranslationData
    galleryIds?: string[]
}

export async function upsertFilm(data: FilmData) {
    const session = await auth()
    const role = session?.user?.role
    if (!session || (role !== 'ADMIN' && role !== 'EDITOR')) {
        throw new Error("Unauthorized")
    }

    const { id, slug, published, releaseDate, heroVideoId, tags, credits, el, en, galleryIds } = data

    const commonData = {
        slug,
        published,
        releaseDate: releaseDate ? new Date(releaseDate) : null,
        heroVideoId: heroVideoId || null,
        tags: tags ? tags : undefined, // array of strings
        credits: credits ? credits : undefined, // object
        media: galleryIds ? { set: galleryIds.map((mid: string) => ({ id: mid })) } : undefined
    }

    // Auto-fill SEO fields if missing
    if (el) {
        if (!el.metaTitle && el.title) el.metaTitle = el.title.slice(0, 60)
        if (!el.metaDescription) el.metaDescription = (el.logline || el.synopsis || "").slice(0, 160)
        if (!el.keywords && tags && tags.length > 0) el.keywords = tags.join(", ")
    }
    if (en) {
        if (!en.metaTitle && en.title) en.metaTitle = en.title.slice(0, 60)
        if (!en.metaDescription) en.metaDescription = (en.logline || en.synopsis || "").slice(0, 160)
        if (!en.keywords && tags && tags.length > 0) en.keywords = tags.join(", ")
    }

    if (galleryIds && Array.isArray(galleryIds)) {
        await Promise.all(galleryIds.map((mid: string, idx: number) =>
            prisma.mediaAsset.update({ where: { id: mid }, data: { order: idx } })
        ))
    }

    if (!id || id === 'new') {
        await prisma.film.create({
            data: {
                ...commonData,
                media: galleryIds ? { connect: galleryIds.map((mid: string) => ({ id: mid })) } : undefined,
                translations: {
                    create: [
                        { lang: 'el', ...el },
                        { lang: 'en', ...en }
                    ]
                }
            }
        })
    } else {
        await prisma.film.update({
            where: { id },
            data: {
                ...commonData,
                translations: {
                    upsert: [
                        { where: { filmId_lang: { filmId: id, lang: 'el' } }, create: { lang: 'el', ...el }, update: el },
                        { where: { filmId_lang: { filmId: id, lang: 'en' } }, create: { lang: 'en', ...en }, update: en },
                    ]
                }
            }
        })
    }

    revalidatePath('/admin/films')
    redirect('/admin/films')
}

export async function deleteFilm(id: string) {
    const session = await auth()
    const role = session?.user?.role
    if (!session || (role !== 'ADMIN' && role !== 'EDITOR')) {
        throw new Error("Unauthorized")
    }

    await prisma.film.delete({ where: { id } })
    revalidatePath('/admin/films')
}

export async function updateFilmOrder(items: { id: string, order: number }[]) {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
        throw new Error("Unauthorized")
    }

    await prisma.$transaction(
        items.map((item) =>
            prisma.film.update({
                where: { id: item.id },
                data: { order: item.order }
            })
        )
    )

    revalidatePath("/admin/films")
}

export async function updateFilmTitle(id: string, title: string) {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
        throw new Error("Unauthorized")
    }

    // Update EL title by default for inline usage
    await prisma.filmTranslation.updateMany({
        where: { filmId: id, lang: 'el' },
        data: { title }
    })

    revalidatePath("/admin/films")
}
