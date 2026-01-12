"use server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

interface PressTranslationData {
    title?: string
    description?: string
    metaTitle?: string
    metaDescription?: string
    keywords?: string
}

interface PressData {
    id?: string
    kind: string
    outlet: string
    url: string
    published: boolean
    publishedAt?: string
    imageId?: string
    relatedFilmIds?: string[]
    el: PressTranslationData
    en: PressTranslationData
    galleryIds?: string[]
}

export async function upsertPress(data: PressData) {
    const session = await auth()
    const role = session?.user?.role
    if (!session || (role !== 'ADMIN' && role !== 'EDITOR')) {
        throw new Error("Unauthorized")
    }

    const { id, kind, outlet, url, published, publishedAt, imageId, relatedFilmIds, el, en, galleryIds } = data

    const commonData = {
        kind,
        outlet,
        url,
        published,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
        imageId: imageId || null,
        films: relatedFilmIds ? { set: relatedFilmIds.map((fid: string) => ({ id: fid })) } : undefined,
        gallery: galleryIds ? { set: galleryIds.map((mid: string) => ({ id: mid })) } : undefined
    }

    // Auto-fill SEO fields if missing
    if (el) {
        if (!el.metaTitle && el.title) el.metaTitle = el.title.slice(0, 60)
        if (!el.metaDescription && el.description) el.metaDescription = el.description.slice(0, 160)
        if (!el.keywords) el.keywords = [outlet, kind].filter(Boolean).join(", ")
    }
    if (en) {
        if (!en.metaTitle && en.title) en.metaTitle = en.title.slice(0, 60)
        if (!en.metaDescription && en.description) en.metaDescription = en.description.slice(0, 160)
        if (!en.keywords) en.keywords = [outlet, kind].filter(Boolean).join(", ")
    }

    if (galleryIds && Array.isArray(galleryIds)) {
        await Promise.all(galleryIds.map((mid: string, idx: number) =>
            prisma.mediaAsset.update({ where: { id: mid }, data: { order: idx } })
        ))
    }

    if (!id || id === 'new') {
        await prisma.pressItem.create({
            data: {
                ...commonData,
                gallery: galleryIds ? { connect: galleryIds.map((mid: string) => ({ id: mid })) } : undefined,
                films: relatedFilmIds ? { connect: relatedFilmIds.map((fid: string) => ({ id: fid })) } : undefined,
                translations: {
                    create: [
                        { lang: 'el', ...el },
                        { lang: 'en', ...en }
                    ]
                }
            }
        })
    } else {
        await prisma.pressItem.update({
            where: { id },
            data: {
                ...commonData,
                translations: {
                    upsert: [
                        { where: { pressItemId_lang: { pressItemId: id, lang: 'el' } }, create: { lang: 'el', ...el }, update: el },
                        { where: { pressItemId_lang: { pressItemId: id, lang: 'en' } }, create: { lang: 'en', ...en }, update: en },
                    ]
                }
            }
        })
    }

    revalidatePath('/admin/press')
    redirect('/admin/press')
}

export async function deletePress(id: string) {
    const session = await auth()
    const role = session?.user?.role
    if (!session || (role !== 'ADMIN' && role !== 'EDITOR')) {
        throw new Error("Unauthorized")
    }

    await prisma.pressItem.delete({ where: { id } })
    revalidatePath('/admin/press')
}

export async function updatePressOrder(items: { id: string, order: number }[]) {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
        throw new Error("Unauthorized")
    }

    await prisma.$transaction(
        items.map((item) =>
            prisma.pressItem.update({
                where: { id: item.id },
                data: { order: item.order }
            })
        )
    )

    revalidatePath("/admin/press")
}

export async function updatePressTitle(id: string, title: string) {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
        throw new Error("Unauthorized")
    }

    // Update EL title by default for inline usage
    await prisma.pressItemTranslation.updateMany({
        where: { pressItemId: id, lang: 'el' },
        data: { title }
    })

    revalidatePath("/admin/press")
}
