"use client"

import { useState, useEffect } from "react"
import { MediaAsset } from "@prisma/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MultiSelect } from "@/components/ui/multi-select"
import { updateMediaAsset, getAllHashtags } from "@/app/actions/media"
import { removeBackground } from "@/app/actions/ai"
import { toast } from "sonner"
import { Loader2, Wand2 } from "lucide-react"

type MediaAssetWithHashtags = MediaAsset & {
    hashtags?: { text: string }[]
}

interface ImageDetailsDialogProps {
    asset: MediaAssetWithHashtags | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave?: (asset: MediaAssetWithHashtags) => void
}

export function ImageDetailsDialog({
    asset,
    open,
    onOpenChange,
    onSave
}: ImageDetailsDialogProps) {
    const [alt, setAlt] = useState(asset?.alt || "")
    const [tags, setTags] = useState<string[]>(asset?.hashtags?.map((h: { text: string }) => h.text) || [])
    const [availableTags, setAvailableTags] = useState<{ label: string, value: string }[]>([])
    const [loading, setLoading] = useState(false)
    const [bgLoading, setBgLoading] = useState(false)

    useEffect(() => {
        if (open) {
            setAlt(asset?.alt || "")
            setTags(asset?.hashtags?.map((h: { text: string }) => h.text) || [])
        }
    }, [asset, open])

    useEffect(() => {
        async function loadTags() {
            try {
                const allTags = await getAllHashtags()
                setAvailableTags(allTags.map(t => ({ label: t, value: t })))
            } catch (e) {
                console.error("Failed to load hashtags", e)
            }
        }
        if (open) {
            loadTags()
        }
    }, [open])

    async function handleRemoveBg() {
        if (!asset) return
        if (!confirm("This will replace the background with transparency. Continue?")) return

        setBgLoading(true)
        try {
            const res = await removeBackground(asset.id)
            if (res.success) {
                toast.success("Background removed successfully")
                if (onSave) {
                    onSave({
                        ...asset,
                        url: res.url
                    })
                }
            }
        } catch (e) {
            console.error(e)
            toast.error("Failed to remove background")
        } finally {
            setBgLoading(false)
        }
    }

    async function handleSave() {
        if (!asset) return
        setLoading(true)
        try {
            await updateMediaAsset(asset.id, { alt, hashtags: tags })
            toast.success("Image details updated")
            if (onSave) {
                onSave({
                    ...asset,
                    alt,
                    hashtags: tags.map(t => ({ text: t }))
                })
            }
            onOpenChange(false)
        } catch (e) {
            console.error(e)
            toast.error("Failed to update image")
        } finally {
            setLoading(false)
        }
    }

    if (!asset) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold">Image Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex justify-center bg-gray-50 rounded-lg p-4 border border-gray-100 relative group">
                        {asset.url ? (
                            <>
                                <img src={asset.url} alt={alt} className="max-h-48 object-contain rounded" />
                                <div className="absolute bottom-2 right-2">
                                    <Button
                                        size="sm"
                                        className="h-6 text-[9px] bg-white/90 hover:bg-white text-indigo-600 shadow-sm border border-indigo-100"
                                        onClick={handleRemoveBg}
                                        disabled={bgLoading}
                                    >
                                        {bgLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Wand2 className="w-3 h-3 mr-1" />}
                                        Remove BG
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="text-gray-400 text-sm">No image URL available</div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Alt Text</Label>
                        <Input
                            value={alt}
                            onChange={e => setAlt(e.target.value)}
                            placeholder="Describe the image..."
                            className="text-[10px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Hashtags</Label>
                        <MultiSelect
                            options={availableTags}
                            defaultValue={tags}
                            onValueChange={setTags}
                            placeholder="Add tags..."
                            className="text-[10px]"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-[10px]">Cancel</Button>
                        <Button size="sm" onClick={handleSave} disabled={loading} className="text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white">
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
