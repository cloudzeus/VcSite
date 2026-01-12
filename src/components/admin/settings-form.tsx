"use client"

import { useState } from "react"
import { SiteSettings, MediaAsset } from "@prisma/client"
import { updateSettings } from "@/app/actions/settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UploadWidget } from "@/components/admin/upload-widget"
import { toast } from "sonner"
import { Save, Loader2 } from "lucide-react"

type SettingsWithRelations = SiteSettings & {
    homepageHeroVideo: MediaAsset | null
}

export function SettingsForm({ settings }: { settings: SettingsWithRelations }) {
    const [loading, setLoading] = useState(false)
    const [heroVideo, setHeroVideo] = useState<MediaAsset | null>(settings.homepageHeroVideo)

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)

        const data = {
            siteTitle: formData.get("siteTitle") as string,
            contactEmail: formData.get("contactEmail") as string,
            socialInstagram: formData.get("socialInstagram") as string,
            socialVimeo: formData.get("socialVimeo") as string,
            socialLinkedin: formData.get("socialLinkedin") as string,
            socialFacebook: formData.get("socialFacebook") as string,
            homepageHeroVideoId: heroVideo?.id || null
        }

        try {
            await updateSettings(data)
            toast.success("Settings saved")
        } catch (err) {
            console.error(err)
            toast.error("Failed to save settings")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={onSubmit} className="max-w-4xl space-y-8">
            <div className="bg-white/50 p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
                <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2">General Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Site Title</Label>
                        <Input name="siteTitle" defaultValue={settings.siteTitle} className="text-[11px] font-medium" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Contact Email</Label>
                        <Input name="contactEmail" defaultValue={settings.contactEmail || ""} className="text-[11px]" />
                    </div>
                </div>
            </div>

            <div className="bg-white/50 p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
                <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2">Social Media</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Instagram URL</Label>
                        <Input name="socialInstagram" defaultValue={settings.socialInstagram || ""} className="text-[11px]" placeholder="https://instagram.com/..." />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Vimeo URL</Label>
                        <Input name="socialVimeo" defaultValue={settings.socialVimeo || ""} className="text-[11px]" placeholder="https://vimeo.com/..." />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">LinkedIn URL</Label>
                        <Input name="socialLinkedin" defaultValue={settings.socialLinkedin || ""} className="text-[11px]" placeholder="https://linkedin.com/..." />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Facebook URL</Label>
                        <Input name="socialFacebook" defaultValue={settings.socialFacebook || ""} className="text-[11px]" placeholder="https://facebook.com/..." />
                    </div>
                </div>
            </div>

            <div className="bg-white/50 p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
                <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2">Homepage Media</h3>
                <div className="space-y-2">
                    <Label className="text-[10px] uppercase text-gray-400 font-bold tracking-wider block mb-2">Homepage Hero Video</Label>
                    <div className="max-w-md">
                        <UploadWidget
                            kind="VIDEO"
                            initialAsset={heroVideo}
                            onUpload={setHeroVideo}
                        />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2">This video will play in the background of the homepage hero section.</p>
                </div>
            </div>

            <div className="flex justify-end">
                <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[150px]">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Settings
                </Button>
            </div>
        </form>
    )
}
