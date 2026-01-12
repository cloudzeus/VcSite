"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function captureScreenshot(url: string, pressItemId: string) {
    const session = await auth()
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
        throw new Error("Unauthorized")
    }

    try {
        // Using ScreenshotOne API (requires both access key and secret key)
        const screenshotAccessKey = process.env.SCREENSHOT_ACCESS_KEY
        const screenshotSecretKey = process.env.SCREENSHOT_SECRET_KEY // Keep for potential future use or if other parts of the app use it

        if (!screenshotAccessKey) {
            throw new Error("Screenshot API key not configured. Need SCREENSHOT_ACCESS_KEY")
        }

        // Generate screenshot URL using ScreenshotOne
        // ScreenshotOne API documentation: https://screenshotone.com/docs/getting-started/
        const params = new URLSearchParams({
            access_key: screenshotAccessKey,
            url: url,
            viewport_width: '1200',
            viewport_height: '630',
            format: 'jpg',
            image_quality: '80',
            full_page: 'false',
            block_ads: 'true',
            block_cookie_banners: 'true',
            block_trackers: 'true',
        })

        const screenshotUrl = `https://api.screenshotone.com/take?${params.toString()}`

        console.log("Attempting to capture screenshot for URL:", url)
        console.log("Screenshot API URL (without keys):", screenshotUrl.replace(screenshotAccessKey, 'REDACTED'))

        // Fetch the screenshot
        const response = await fetch(screenshotUrl)

        if (!response.ok) {
            const errorText = await response.text()
            console.error("ScreenshotOne API Error Response:", {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            })
            throw new Error(`Screenshot API error (${response.status}): ${errorText || response.statusText}`)
        }

        const imageBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(imageBuffer)

        // Upload to Bunny Storage
        const bunnyZone = process.env.BUNNY_STORAGE_ZONE
        const bunnyKey = process.env.BUNNY_STORAGE_ACCESS_KEY
        const bunnyPullUrl = process.env.BUNNY_PULL_BASE_URL
        const bunnyEndpoint = "https://storage.bunnycdn.com" // Standard Bunny CDN endpoint

        if (!bunnyZone || !bunnyKey || !bunnyPullUrl) {
            throw new Error("Bunny CDN not configured. Need BUNNY_STORAGE_ZONE, BUNNY_STORAGE_ACCESS_KEY, and BUNNY_PULL_BASE_URL")
        }

        const filename = `press-screenshots/${pressItemId}-${Date.now()}.jpg`
        const uploadUrl = `${bunnyEndpoint}/${bunnyZone}/${filename}`

        const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'AccessKey': bunnyKey,
                'Content-Type': 'image/jpeg',
            },
            body: buffer,
        })

        if (!uploadResponse.ok) {
            throw new Error(`Bunny upload failed: ${uploadResponse.statusText}`)
        }

        const cdnUrl = `${bunnyPullUrl}/${filename}`

        // Create MediaAsset in database
        const mediaAsset = await prisma.mediaAsset.create({
            data: {
                kind: 'IMAGE',
                url: cdnUrl,
                alt: `Screenshot of ${url}`,
            }
        })

        // Update press item with the new image
        await prisma.pressItem.update({
            where: { id: pressItemId },
            data: {
                imageId: mediaAsset.id,
                gallery: { connect: { id: mediaAsset.id } }
            }
        })

        return {
            success: true,
            assetId: mediaAsset.id,
            url: cdnUrl
        }
    } catch (e) {
        console.error("Screenshot Capture Error", e)
        throw new Error("Failed to capture screenshot")
    }
}
