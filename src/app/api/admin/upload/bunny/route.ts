import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Session } from "next-auth"

export const runtime = "nodejs"

function assertAdmin(session: Session | null) {
    const role = session?.user?.role
    if (!session || (role !== "ADMIN" && role !== "EDITOR")) {
        throw new Error("UNAUTHORIZED")
    }
}

export async function POST(req: Request) {
    const session = await auth()
    try {
        assertAdmin(session)
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const form = await req.formData()
    const file = form.get("file") as File | null
    const kind = (form.get("kind") as string | null) ?? "IMAGE"
    const folder = (form.get("folder") as string | null) ?? "uploads"

    if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const key = `${folder}/${Date.now()}_${safeName}`

    const zone = process.env.BUNNY_STORAGE_ZONE!
    const endpoint = process.env.BUNNY_STORAGE_ENDPOINT ?? "storage.bunnycdn.com"
    const accessKey = process.env.BUNNY_STORAGE_ACCESS_KEY!
    const pullBase = process.env.BUNNY_PULL_BASE_URL!

    const putUrl = `https://${endpoint}/${zone}/${key}`

    const res = await fetch(putUrl, {
        method: "PUT",
        headers: {
            AccessKey: accessKey,
            "Content-Type": "application/octet-stream",
        },
        body: buffer,
    })

    if (!res.ok) {
        const txt = await res.text().catch(() => "")
        return NextResponse.json(
            { error: "Bunny upload failed", details: txt },
            { status: 502 }
        )
    }

    const publicUrl = `${pullBase.replace(/\/$/, "")}/${key}`

    const asset = await prisma.mediaAsset.create({
        data: {
            kind: kind === "VIDEO" ? "VIDEO" : "IMAGE",
            url: publicUrl,
            alt: safeName,
        },
    })

    return NextResponse.json({ asset })
}
