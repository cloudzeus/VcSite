"use server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

interface MissionTranslationData {
    title?: string
    shortDescription?: string
    longDescription?: string
    phrases?: string[]
    mottos?: string[]
    metaTitle?: string
    metaDescription?: string
    keywords?: string
}

interface MissionData {
    id?: string
    slug: string
    published: boolean
    publishedDate?: string
    el: MissionTranslationData
    en: MissionTranslationData
}

export async function upsertMission(data: MissionData) {
    const session = await auth()
    const role = session?.user?.role
    if (!session || (role !== 'ADMIN' && role !== 'EDITOR')) {
        throw new Error("Unauthorized")
    }

    const { id, slug, published, publishedDate, el, en } = data

    const commonData = {
        slug,
        published,
        publishedDate: publishedDate ? new Date(publishedDate) : null,
    }

    // Auto-fill SEO fields if missing
    if (el) {
        if (!el.metaTitle && el.title) el.metaTitle = el.title.slice(0, 60)
        if (!el.metaDescription && el.shortDescription) el.metaDescription = el.shortDescription.slice(0, 160)
    }
    if (en) {
        if (!en.metaTitle && en.title) en.metaTitle = en.title.slice(0, 60)
        if (!en.metaDescription && en.shortDescription) en.metaDescription = en.shortDescription.slice(0, 160)
    }

    if (!id || id === 'new') {
        await prisma.missionStatement.create({
            data: {
                ...commonData,
                translations: {
                    create: [
                        {
                            lang: 'el',
                            ...el,
                            title: el.title || "",
                            shortDescription: el.shortDescription || "",
                            longDescription: el.longDescription || "",
                            phrases: el.phrases || [],
                            mottos: el.mottos || []
                        },
                        {
                            lang: 'en',
                            ...en,
                            title: en.title || "",
                            shortDescription: en.shortDescription || "",
                            longDescription: en.longDescription || "",
                            phrases: en.phrases || [],
                            mottos: en.mottos || []
                        }
                    ]
                }
            }
        })
    } else {
        await prisma.missionStatement.update({
            where: { id },
            data: {
                ...commonData,
                translations: {
                    upsert: [
                        {
                            where: { missionStatementId_lang: { missionStatementId: id, lang: 'el' } },
                            create: {
                                lang: 'el',
                                ...el,
                                title: el.title || "",
                                shortDescription: el.shortDescription || "",
                                longDescription: el.longDescription || "",
                                phrases: el.phrases || [],
                                mottos: el.mottos || []
                            },
                            update: {
                                ...el,
                                phrases: el.phrases || [],
                                mottos: el.mottos || []
                            }
                        },
                        {
                            where: { missionStatementId_lang: { missionStatementId: id, lang: 'en' } },
                            create: {
                                lang: 'en',
                                ...en,
                                title: en.title || "",
                                shortDescription: en.shortDescription || "",
                                longDescription: en.longDescription || "",
                                phrases: en.phrases || [],
                                mottos: en.mottos || []
                            },
                            update: {
                                ...en,
                                phrases: en.phrases || [],
                                mottos: en.mottos || []
                            }
                        },
                    ]
                }
            }
        })
    }

    revalidatePath('/admin/missions')
    redirect('/admin/missions')
}

export async function deleteMission(id: string) {
    const session = await auth()
    const role = session?.user?.role
    if (!session || (role !== 'ADMIN' && role !== 'EDITOR')) {
        throw new Error("Unauthorized")
    }

    await prisma.missionStatement.delete({ where: { id } })
    revalidatePath('/admin/missions')
}

export async function updateMissionOrder(items: { id: string, order: number }[]) {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
        throw new Error("Unauthorized")
    }

    await prisma.$transaction(
        items.map((item) =>
            prisma.missionStatement.update({
                where: { id: item.id },
                data: { order: item.order }
            })
        )
    )

    revalidatePath("/admin/missions")
}

export async function updateMissionTitle(id: string, title: string) {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
        throw new Error("Unauthorized")
    }

    // Update EL title by default for inline usage
    await prisma.missionStatementTranslation.updateMany({
        where: { missionStatementId: id, lang: 'el' },
        data: { title }
    })

    revalidatePath("/admin/missions")
}
