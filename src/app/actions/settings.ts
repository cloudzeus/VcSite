"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

interface SettingsUpdate {
    siteTitle?: string
    contactEmail?: string
    socialInstagram?: string
    socialVimeo?: string
    socialLinkedin?: string
    socialFacebook?: string
    homepageHeroVideoId?: string
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
