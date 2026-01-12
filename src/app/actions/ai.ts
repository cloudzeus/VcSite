"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function generateSEO(content: string) {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
        throw new Error("Unauthorized")
    }

    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) throw new Error("Missing DeepSeek API Key")

    try {
        const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: "You are an SEO expert. Generate a JSON object with keys: title (max 60 chars), description (max 160 chars), and keywords (comma separated string). Output ONLY JSON."
                    },
                    {
                        role: "user",
                        content: `Generate SEO metadata for the following content:\n\n${content}`
                    }
                ],
                response_format: { type: "json_object" }
            })
        })

        if (!response.ok) {
            const err = await response.text()
            throw new Error(`DeepSeek API error: ${err}`)
        }

        const json = await response.json()
        const contentStr = json.choices[0].message.content
        return JSON.parse(contentStr) as { title: string, description: string, keywords: string }
    } catch (e) {
        console.error("SEO Generation Error", e)
        throw new Error("Failed to generate SEO")
    }
}

export async function generatePhrases(content: string, type: 'phrases' | 'mottos') {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
        throw new Error("Unauthorized")
    }

    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) throw new Error("Missing DeepSeek API Key")

    try {
        const systemPrompt = type === 'phrases'
            ? "You are a creative copywriter. Generate a JSON object with a 'phrases' key containing an array of 5-8 short, impactful phrases (3-6 words each) that capture the essence of the content. Output ONLY JSON."
            : "You are a creative copywriter. Generate a JSON object with a 'mottos' key containing an array of 3-5 memorable mottos or taglines (5-10 words each) based on the content. Output ONLY JSON."

        const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: `Generate ${type} for the following content:\n\n${content}`
                    }
                ],
                response_format: { type: "json_object" }
            })
        })

        if (!response.ok) {
            const err = await response.text()
            throw new Error(`DeepSeek API error: ${err}`)
        }

        const json = await response.json()
        const contentStr = json.choices[0].message.content
        const result = JSON.parse(contentStr) as { phrases?: string[], mottos?: string[] }
        return type === 'phrases' ? result.phrases || [] : result.mottos || []
    } catch (e) {
        console.error("Phrase Generation Error", e)
        throw new Error("Failed to generate phrases")
    }
}

export async function removeBackground(assetId: string) {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
        throw new Error("Unauthorized")
    }

    const claidKey = process.env.CLAID_API_KEY
    if (!claidKey) {
        console.error("CLAID_API_KEY is not set in environment variables")
        throw new Error("Background removal service is not configured. Please contact administrator.")
    }

    const asset = await prisma.mediaAsset.findUnique({ where: { id: assetId } })
    if (!asset || !asset.url) throw new Error("Asset not found")

    try {
        // 1. Call Claid to remove background
        const claidResp = await fetch("https://api.claid.ai/v1-beta1/image/edit", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${claidKey}`
            },
            body: JSON.stringify({
                input: asset.url,
                operations: {
                    background: { remove: true }
                },
                output: {
                    format: "png"
                }
            })
        })

        if (!claidResp.ok) {
            const err = await claidResp.text()
            console.error("Claid API error response:", err)
            throw new Error(`Claid API error: ${err}`)
        }

        const claidResult = await claidResp.json()
        console.log("Claid API response:", JSON.stringify(claidResult, null, 2))

        const processedUrl = claidResult?.output?.tmp_url || claidResult?.data?.output?.tmp_url

        if (!processedUrl) {
            console.error("Claid result structure:", claidResult)
            throw new Error(`No output URL from Claid. Response: ${JSON.stringify(claidResult)}`)
        }

        // 2. Fetch the processed image
        const imgResp = await fetch(processedUrl)
        if (!imgResp.ok) throw new Error("Failed to download processed image")
        const buffer = await imgResp.arrayBuffer()

        // 3. Upload to Bunny
        const zone = process.env.BUNNY_STORAGE_ZONE!
        const endpoint = process.env.BUNNY_STORAGE_ENDPOINT ?? "storage.bunnycdn.com"
        const accessKey = process.env.BUNNY_STORAGE_ACCESS_KEY!
        const pullBase = process.env.BUNNY_PULL_BASE_URL!

        const fileName = `bg_removed_${assetId}_${Date.now()}.png`
        const key = `processed/${fileName}`
        const putUrl = `https://${endpoint}/${zone}/${key}`

        const uploadResp = await fetch(putUrl, {
            method: "PUT",
            headers: {
                AccessKey: accessKey,
                "Content-Type": "image/png",
            },
            body: Buffer.from(buffer),
        })

        if (!uploadResp.ok) throw new Error("Failed to upload to storage")

        const finalUrl = `${pullBase.replace(/\/$/, "")}/${key}`

        // 4. Update Asset
        await prisma.mediaAsset.update({
            where: { id: assetId },
            data: { url: finalUrl }
        })

        revalidatePath('/admin', 'layout')
        return { success: true, url: finalUrl }

    } catch (e) {
        console.error("Background Removal Error", e)
        throw new Error("Failed to remove background")
    }
}

export async function generatePressContent(url: string) {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
        throw new Error("Unauthorized")
    }

    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) throw new Error("Missing DeepSeek API Key")

    try {
        // 1. Fetch URL Content
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            },
            next: { revalidate: 3600 }
        })

        if (!res.ok) throw new Error("Failed to fetch page content")
        const html = await res.text()

        // 2. Extract Text (Simple)
        // Remove scripts, styles, comments
        const noScript = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
            .replace(/<!--[\s\S]*?-->/g, "")

        // Remove tags and collapse whitespace
        const text = noScript.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 20000)

        // 3. Call DeepSeek
        const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: "You are an expert editor. Analyze the provided article text. Extract the Article Title and the Outlet/Publication name. Generate a 'short' logline (approx 20 words) and a 'long' summary (approx 50 words). Provide the Title, Short, and Long descriptions in both English and Greek. Output ONLY a JSON object with this structure: { el: { title, short, long }, en: { title, short, long }, outlet: string }."
                    },
                    {
                        role: "user",
                        content: `Analyze this content:\n\n${text}`
                    }
                ],
                response_format: { type: "json_object" }
            })
        })

        if (!response.ok) {
            const err = await response.text()
            throw new Error(`DeepSeek API error: ${err}`)
        }

        const json = await response.json()
        const contentStr = json.choices[0].message.content
        return JSON.parse(contentStr) as {
            el: { title: string, short: string, long: string },
            en: { title: string, short: string, long: string },
            outlet: string
        }
    } catch (e) {
        console.error("Content Gen Error", e)
        throw new Error("Failed to generate content from URL")
    }
}
