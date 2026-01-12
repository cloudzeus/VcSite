"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { GalleryEditor } from "@/components/admin/gallery-editor"
import { MultiSelect } from "@/components/ui/multi-select"
import { updateHomePage } from "@/app/actions/home"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"
import { MediaAsset } from "@prisma/client"

type AssetWithTags = MediaAsset & { hashtags?: { text: string }[] }

export function HomeClientPage({ home, films, press }: { home: any, films: any[], press: any[] }) {
    const [loading, setLoading] = useState(false)

    // Visuals (GalleryEditor expects array, we use 0 or 1 item)
    const [mask, setMask] = useState<AssetWithTags[]>(home?.svgMask ? [home.svgMask] : [])
    const [video, setVideo] = useState<AssetWithTags[]>(home?.video ? [home.video] : [])

    // Content
    const ele = home?.translations?.find((t: any) => t.lang === 'el')
    const eng = home?.translations?.find((t: any) => t.lang === 'en')

    const [elContent, setElContent] = useState({
        title: ele?.title || "",
        heroText: ele?.heroText || ""
    })
    const [enContent, setEnContent] = useState({
        title: eng?.title || "",
        heroText: eng?.heroText || ""
    })

    // Featured (IDs)
    const [selectedFilms, setSelectedFilms] = useState<string[]>(home?.featuredFilms?.map((f: any) => f.id) || [])
    const [selectedPress, setSelectedPress] = useState<string[]>(home?.featuredPress?.map((p: any) => p.id) || [])

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        try {
            await updateHomePage({
                svgMaskId: mask[0]?.id,
                videoId: video[0]?.id,
                filmIds: selectedFilms,
                pressIds: selectedPress,
                el: elContent,
                en: enContent
            })
            toast.success("Home Page updated successfully")
        } catch (error) {
            console.error(error)
            toast.error("Failed to update Home Page")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={onSubmit} className="max-w-5xl mx-auto space-y-8 pb-20">
            <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Home Page</h1>
                    <p className="text-xs text-gray-500">Manage landing page content and featured items</p>
                </div>
                <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Visuals Section */}
                <div className="space-y-6 md:col-span-2">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                        <h3 className="font-bold text-xs uppercase tracking-widest text-gray-400 border-b pb-2">Hero Visuals</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-gray-500">Mask (SVG)</Label>
                                <div className="border border-dashed border-gray-200 rounded-xl p-4 bg-gray-50/50">
                                    <GalleryEditor
                                        assets={mask}
                                        onChange={(newAssets) => setMask(newAssets.slice(0, 1))} // Limit to 1
                                        folder="home/masks"
                                        accept="image/svg+xml"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-2 text-center">Upload the SVG mask for the hero animation.</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-gray-500">Video Banner</Label>
                                <div className="border border-dashed border-gray-200 rounded-xl p-4 bg-gray-50/50">
                                    <GalleryEditor
                                        assets={video}
                                        onChange={(newAssets) => setVideo(newAssets.slice(0, 1))} // Limit to 1
                                        folder="home/videos"
                                        accept="video/*"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-2 text-center">Upload the background video.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="space-y-6 md:col-span-2">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                        <h3 className="font-bold text-xs uppercase tracking-widest text-gray-400 border-b pb-2">Hero Text</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Greek */}
                            <div className="space-y-4">
                                <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 inline-block px-2 py-1 rounded">Greek (EL)</div>
                                <div>
                                    <Label className="text-xs">Title</Label>
                                    <Input
                                        value={elContent.title}
                                        onChange={e => setElContent({ ...elContent, title: e.target.value })}
                                        className="mt-1"
                                        placeholder="Main Title"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Text (Hero Section)</Label>
                                    <Textarea
                                        value={elContent.heroText}
                                        onChange={e => setElContent({ ...elContent, heroText: e.target.value })}
                                        className="mt-1 min-h-[100px]"
                                        placeholder="Text displayed below the mask..."
                                    />
                                </div>
                            </div>

                            {/* English */}
                            <div className="space-y-4">
                                <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 inline-block px-2 py-1 rounded">English (EN)</div>
                                <div>
                                    <Label className="text-xs">Title</Label>
                                    <Input
                                        value={enContent.title}
                                        onChange={e => setEnContent({ ...enContent, title: e.target.value })}
                                        className="mt-1"
                                        placeholder="Main Title"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Text (Hero Section)</Label>
                                    <Textarea
                                        value={enContent.heroText}
                                        onChange={e => setEnContent({ ...enContent, heroText: e.target.value })}
                                        className="mt-1 min-h-[100px]"
                                        placeholder="Text displayed below the mask..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Featured Section */}
                <div className="space-y-6 md:col-span-2">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                        <h3 className="font-bold text-xs uppercase tracking-widest text-gray-400 border-b pb-2">Selection</h3>

                        <div className="space-y-4">
                            <Label className="text-xs font-bold uppercase text-gray-500">Featured Videos (Select 4)</Label>
                            <MultiSelect
                                options={films.map((f: any) => ({ label: f.slug, value: f.id }))}
                                defaultValue={selectedFilms}
                                onValueChange={(val) => {
                                    if (val.length <= 4) setSelectedFilms(val)
                                    else toast.error("Maximum 4 videos allowed")
                                }}
                                placeholder="Select videos..."
                            />
                            <p className="text-[10px] text-gray-400">Selected: {selectedFilms.length} / 4</p>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-gray-50">
                            <Label className="text-xs font-bold uppercase text-gray-500">Featured Press (Select 6)</Label>
                            <MultiSelect
                                options={press.map((p: any) => ({ label: p.label, value: p.id }))}
                                defaultValue={selectedPress}
                                onValueChange={(val) => {
                                    if (val.length <= 6) setSelectedPress(val)
                                    else toast.error("Maximum 6 press items allowed")
                                }}
                                placeholder="Select press items..."
                            />
                            <p className="text-[10px] text-gray-400">Selected: {selectedPress.length} / 6</p>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    )
}
