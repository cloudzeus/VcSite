"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

interface SettingsUpdate {
    siteTitle?: string
    contactEmail?: string | null
    socialInstagram?: string | null
    socialVimeo?: string | null
    socialLinkedin?: string | null
    socialFacebook?: string | null
    homepageHeroVideoId?: string | null
}

export async function getSettings() {
    return prisma.siteSettings.upsert({
        where: { id: "singleton" },
        update: {},
        create: { id: "singleton" },
        include: { homepageHeroVideo: true }
    })
}

export async function updateSettings(data: SettingsUpdate) {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
        throw new Error("Unauthorized")
    }

    await prisma.siteSettings.update({
        where: { id: "singleton" },
        data
    })

    revalidatePath("/", "layout")
}
