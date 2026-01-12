"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function updateMediaAsset(id: string, data: { alt?: string, hashtags?: string[] }) {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
        throw new Error("Unauthorized")
    }

    const transactions = []

    if (data.hashtags !== undefined) {
        transactions.push(prisma.mediaAsset.update({
            where: { id },
            data: { hashtags: { set: [] } }
        }))
    }

    transactions.push(prisma.mediaAsset.update({
        where: { id },
        data: {
            alt: data.alt,
            hashtags: data.hashtags ? {
                connectOrCreate: data.hashtags.map(tag => ({
                    where: { text: tag },
                    create: { text: tag }
                }))
            } : undefined
        }
    }))

    await prisma.$transaction(transactions)

    revalidatePath('/admin', 'layout')
    revalidatePath('/admin/films')
    revalidatePath('/admin/press')
}

export async function searchHashtags(query: string) {
    // No auth needed really, but good to have
    const tags = await prisma.hashtag.findMany({
        where: { text: { contains: query } },
        take: 20,
        orderBy: { text: 'asc' }
    })
    return tags.map((t: { text: string }) => t.text)
}

export async function getAllHashtags() {
    const tags = await prisma.hashtag.findMany({
        take: 100,
        orderBy: { text: 'asc' }
    })
    return tags.map((t: { text: string }) => t.text)
}
