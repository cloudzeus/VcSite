"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

export async function getHomePage() {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
        // Return null or throw?
        // Admin page calls this.
        return null
    }

    const home = await prisma.homePage.findUnique({
        where: { id: "singleton" },
        include: {
            translations: true,
            svgMask: true,
            video: true,
            featuredFilms: true,
            featuredPress: {
                include: {
                    translations: true,
                    image: true
                }
            }
        }
    })

    return home
}

interface HomePageData {
    svgMaskId?: string
    videoId?: string
    filmIds: string[]
    pressIds: string[]
    el: { title: string; heroText: string }
    en: { title: string; heroText: string }
}

export async function updateHomePage(data: HomePageData) {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
        throw new Error("Unauthorized")
    }

    const { svgMaskId, videoId, filmIds, pressIds, el, en } = data

    await prisma.homePage.upsert({
        where: { id: "singleton" },
        create: {
            id: "singleton",
            svgMaskId: svgMaskId || null,
            videoId: videoId || null,
            featuredFilms: { connect: filmIds.map(id => ({ id })) },
            featuredPress: { connect: pressIds.map(id => ({ id })) },
            translations: {
                create: [
                    { lang: 'el', ...el },
                    { lang: 'en', ...en }
                ]
            }
        },
        update: {
            svgMaskId: svgMaskId || null,
            videoId: videoId || null,
            // Use set to replace connections
            featuredFilms: { set: filmIds.map(id => ({ id })) },
            featuredPress: { set: pressIds.map(id => ({ id })) },
            translations: {
                upsert: [
                    {
                        where: { homePageId_lang: { homePageId: "singleton", lang: "el" } },
                        create: { lang: "el", ...el },
                        update: el
                    },
                    {
                        where: { homePageId_lang: { homePageId: "singleton", lang: "en" } },
                        create: { lang: "en", ...en },
                        update: en
                    }
                ]
            }
        }
    })

    revalidatePath("/")
    revalidatePath("/admin/home")
}
