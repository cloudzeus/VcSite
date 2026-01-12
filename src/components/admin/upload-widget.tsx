"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface MediaAsset {
    id: string
    url: string
}

interface UploadWidgetProps {
    initialAsset?: MediaAsset | null
    kind: "IMAGE" | "VIDEO"
    onUpload: (asset: MediaAsset) => void
}

export function UploadWidget({ initialAsset, kind, onUpload }: UploadWidgetProps) {
    const [asset, setAsset] = useState<MediaAsset | null>(initialAsset ?? null)
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        setAsset(initialAsset ?? null)
    }, [initialAsset])

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        const formData = new FormData()
        formData.append("file", file)
        formData.append("kind", kind)
        formData.append("folder", kind === 'VIDEO' ? 'films' : 'press')

        try {
            const res = await fetch("/api/admin/upload/bunny", {
                method: "POST",
                body: formData
            })
            if (!res.ok) throw new Error("Upload failed")
            const data = await res.json()
            setAsset(data.asset)
            onUpload(data.asset)
            toast.success("Upload successful")
        } catch (err) {
            toast.error("Upload failed")
            console.error(err)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="border border-dashed p-4 rounded text-center bg-gray-50">
            {asset && (
                <div className="mb-4">
                    {kind === 'VIDEO' ? (
                        <div className="text-sm">
                            <span className="font-bold text-green-600 block mb-1">Video Uploaded</span>
                            <a href={asset.url} target="_blank" className="text-blue-600 underline text-xs break-all">{asset.url}</a>
                        </div>
                    ) : (
                        <img src={asset.url} alt="Preview" className="h-32 mx-auto object-cover rounded" />
                    )}
                </div>
            )}
            <Button variant="secondary" size="sm" disabled={uploading} asChild>
                <label className="cursor-pointer">
                    {uploading ? "Uploading..." : (asset ? "Replace File" : "Select File")}
                    <input type="file" className="hidden" accept={kind === 'VIDEO' ? "video/*" : "image/*"} onChange={handleUpload} />
                </label>
            </Button>
        </div>
    )
}
