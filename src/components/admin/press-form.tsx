"use client"

import { useState, useEffect } from "react"
import { PressItem, PressItemTranslation, MediaAsset } from "@prisma/client"
import { upsertPress, deletePress } from "@/app/actions/press"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { GalleryEditor } from "@/components/admin/gallery-editor"
import { MultiSelect } from "@/components/ui/multi-select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings, Trash, Save, Sparkles, Loader2, Camera } from "lucide-react"
import { generateSEO, generatePressContent } from "@/app/actions/ai"
import { captureScreenshot } from "@/app/actions/screenshot"
import { toast } from "sonner"

type PressWithRelations = PressItem & {
    translations: PressItemTranslation[]
    image: MediaAsset | null
    gallery: (MediaAsset & { hashtags?: { text: string }[] })[]
    films: { id: string }[]
}

interface PressFormProps {
    item?: PressWithRelations | null
    films: { id: string, slug: string }[]
    onSuccess?: () => void
    onCancel?: () => void
}

export function PressForm({ item, films, onSuccess, onCancel }: PressFormProps) {
    const [isDeleting, setIsDeleting] = useState(false)
    const isNew = !item?.id

    const ele = item?.translations.find(t => t.lang === 'el')
    const eng = item?.translations.find(t => t.lang === 'en')

    const [elContent, setElContent] = useState({
        title: ele?.title || "",
        description: ele?.description || "",
        metaTitle: ele?.metaTitle || "",
        metaDescription: ele?.metaDescription || "",
        keywords: ele?.keywords || ""
    })
    const [enContent, setEnContent] = useState({
        title: eng?.title || "",
        description: eng?.description || "",
        metaTitle: eng?.metaTitle || "",
        metaDescription: eng?.metaDescription || "",
        keywords: eng?.keywords || ""
    })

    const [loadingEl, setLoadingEl] = useState(false)
    const [loadingEn, setLoadingEn] = useState(false)
    const [capturingScreenshot, setCapturingScreenshot] = useState(false)
    const [generatingContent, setGeneratingContent] = useState(false)
    const [urlValue, setUrlValue] = useState(item?.url || "")
    const [outlet, setOutlet] = useState(item?.outlet || "")

    async function handleGenerateSEO(lang: 'el' | 'en') {
        const content = lang === 'el' ? elContent : enContent
        const setContent = lang === 'el' ? setElContent : setEnContent
        const setLoading = lang === 'el' ? setLoadingEl : setLoadingEn

        const baseText = `Title: ${content.title}\nDescription: ${content.description}`
        if (content.title.length < 2) {
            toast.error("Please fill in Title first")
            return
        }

        setLoading(true)
        try {
            const res = await generateSEO(baseText)
            setContent(prev => ({
                ...prev,
                metaTitle: res.title,
                metaDescription: res.description,
                keywords: res.keywords
            }))
            toast.success("SEO Metadata generated")
        } catch (e) {
            console.error(e)
            toast.error("Failed to generate SEO")
        } finally {
            setLoading(false)
        }
    }

    async function handleCaptureScreenshot() {
        if (!urlValue || urlValue.length < 5) {
            toast.error("Please enter a valid URL first")
            return
        }

        if (!item?.id || item.id === 'new') {
            toast.error("Please save the press item first before capturing screenshot")
            return
        }

        setCapturingScreenshot(true)
        try {
            const result = await captureScreenshot(urlValue, item.id)
            if (result.success) {
                // Add to gallery state immediately
                const newAsset = {
                    id: result.assetId,
                    url: result.url,
                    kind: 'IMAGE',
                    hashtags: [],
                    filename: 'screenshot.jpg',
                    mimeType: 'image/jpeg',
                    size: 0,
                    width: 0,
                    height: 0,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }

                setGallery(prev => [...prev, newAsset as any])
                setImageId(result.assetId)
                toast.success("Screenshot captured and set as default image!")
            }
        } catch (e) {
            console.error(e)
            toast.error("Failed to capture screenshot. Make sure SCREENSHOT_API_KEY is configured.")
        } finally {
            setCapturingScreenshot(false)
        }
    }

    async function handleGenerateFromUrl() {
        if (!urlValue || urlValue.length < 5) {
            toast.error("Please enter a valid URL first")
            return
        }

        setGeneratingContent(true)
        try {
            const res = await generatePressContent(urlValue)

            if (res.outlet) setOutlet(res.outlet)

            setElContent(prev => ({
                ...prev,
                title: res.el.title,
                description: res.el.long,
                metaDescription: res.el.short
            }))

            setEnContent(prev => ({
                ...prev,
                title: res.en.title,
                description: res.en.long,
                metaDescription: res.en.short
            }))

            toast.success("Content generated from URL!")
        } catch (e) {
            console.error(e)
            toast.error("Failed to generate content from URL")
        } finally {
            setGeneratingContent(false)
        }
    }

    const [imageId, setImageId] = useState(item?.imageId || "")
    const [gallery, setGallery] = useState(item?.gallery || [])
    const [selectedFilms, setSelectedFilms] = useState<string[]>(item?.films.map(f => f.id) || [])

    useEffect(() => {
        setImageId(item?.imageId || "")
        setGallery(item?.gallery || [])
        setSelectedFilms(item?.films.map(f => f.id) || [])
    }, [item])

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        const data = {
            id: isNew ? 'new' : item?.id,
            kind: (formData.get("kind") as any),
            outlet: (formData.get("outlet") as string) || "",
            url: (formData.get("url") as string) || "",
            published: formData.get("published") === "on",
            publishedAt: (formData.get("publishedAt") as string) || undefined,
            imageId,
            galleryIds: gallery.map(g => g.id),
            relatedFilmIds: selectedFilms,
            el: {
                title: (formData.get("el.title") as string) || "",
                description: (formData.get("el.description") as string) || "",
                metaTitle: (formData.get("el.metaTitle") as string) || "",
                metaDescription: (formData.get("el.metaDescription") as string) || "",
                keywords: (formData.get("el.keywords") as string) || "",
            },
            en: {
                title: (formData.get("en.title") as string) || "",
                description: (formData.get("en.description") as string) || "",
                metaTitle: (formData.get("en.metaTitle") as string) || "",
                metaDescription: (formData.get("en.metaDescription") as string) || "",
                keywords: (formData.get("en.keywords") as string) || "",
            }
        }

        await upsertPress(data)
        onSuccess?.()
    }

    return (
        <form onSubmit={onSubmit} className="space-y-6" key={item?.id || 'new'}>
            <div className="flex justify-between items-center bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">
                    {isNew ? 'New Press Item' : `Editing ${item?.outlet}`}
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 text-[10px]">
                                <Settings className="mr-2 h-3 w-3" /> Actions
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Manage Item</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => setImageId("")}>
                                Clear Main Image
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setGallery([])}>
                                Clear Gallery
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setSelectedFilms([])}>
                                Clear Related Films
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {!isNew && (
                                <DropdownMenuItem className="text-red-600" onSelect={async () => {
                                    if (item?.id && confirm("Delete this item?")) {
                                        setIsDeleting(true)
                                        await deletePress(item.id)
                                        onSuccess?.()
                                    }
                                }}>
                                    <Trash className="mr-2 h-3 w-3" /> Delete Item
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    {onCancel && <Button type="button" variant="ghost" size="sm" className="h-8 text-[10px]" onClick={onCancel}>Cancel</Button>}
                    <Button type="submit" size="sm" className="h-8 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200">
                        <Save className="mr-2 h-3 w-3" /> Save Changes
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white/50 p-4 rounded-xl border border-gray-100 space-y-4 shadow-sm">
                        <h3 className="font-bold text-[10px] uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2 mb-2">Content</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Greek Title</Label>
                                <Input name="el.title" value={elContent.title} onChange={e => setElContent({ ...elContent, title: e.target.value })} required className="text-[11px] h-8 font-medium" />

                                <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Description (EL)</Label>
                                <Textarea name="el.description" value={elContent.description} onChange={e => setElContent({ ...elContent, description: e.target.value })} rows={3} className="text-[11px] min-h-[60px]" />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">English Title</Label>
                                <Input name="en.title" value={enContent.title} onChange={e => setEnContent({ ...enContent, title: e.target.value })} className="text-[11px] h-8" />

                                <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Description (EN)</Label>
                                <Textarea name="en.description" value={enContent.description} onChange={e => setEnContent({ ...enContent, description: e.target.value })} rows={3} className="text-[11px] min-h-[60px]" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/50 p-4 rounded-xl border border-gray-100 space-y-4 shadow-sm">
                        <h3 className="font-bold text-[10px] uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2 mb-2">Media Gallery</h3>
                        <GalleryEditor
                            assets={gallery}
                            onChange={setGallery}
                            defaultId={imageId}
                            onSetDefault={setImageId}
                            folder="press"
                        />
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white/50 p-4 rounded-xl border border-gray-100 space-y-4 shadow-sm sticky top-4">
                        <h3 className="font-bold text-[10px] uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2 mb-2">Metadata</h3>
                        <div>
                            <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Outlet / Publication</Label>
                            <Input name="outlet" value={outlet} onChange={e => setOutlet(e.target.value)} required className="text-[11px] h-8 font-bold text-gray-700" />
                        </div>
                        <div>
                            <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">External URL</Label>
                            <div className="flex gap-2">
                                <Input
                                    name="url"
                                    value={urlValue}
                                    onChange={(e) => setUrlValue(e.target.value)}
                                    required
                                    className="text-[11px] h-8 text-blue-600"
                                    placeholder="https://..."
                                />
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-3 text-[10px] whitespace-nowrap text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100"
                                    onClick={handleGenerateFromUrl}
                                    disabled={generatingContent}
                                    title="Auto-fill content using AI"
                                >
                                    {generatingContent ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                                </Button>
                                {!isNew && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="h-8 px-3 text-[10px] whitespace-nowrap"
                                        onClick={handleCaptureScreenshot}
                                        disabled={capturingScreenshot}
                                        title="Capture screenshot and set as default image"
                                    >
                                        {capturingScreenshot ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <Camera className="h-3 w-3" />
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div>
                            <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Kind</Label>
                            <select name="kind" defaultValue={item?.kind || "PUBLICATION"} className="flex h-8 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-[11px]">
                                <option value="PUBLICATION">Publication</option>
                                <option value="REVIEW">Review</option>
                                <option value="INTERVIEW">Interview</option>
                                <option value="NEWS">News</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded bg-indigo-50/50 border border-indigo-100">
                            <input type="checkbox" name="published" id={`published-press-${item?.id}`} defaultChecked={item?.published} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                            <Label htmlFor={`published-press-${item?.id}`} className="text-[10px] font-bold text-indigo-900 cursor-pointer">Published</Label>
                        </div>
                        <div>
                            <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Published Date</Label>
                            <Input type="date" name="publishedAt" defaultValue={item?.publishedAt ? new Date(item.publishedAt).toISOString().split('T')[0] : ''} className="text-[11px] h-8" />
                        </div>

                        <div>
                            <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Related Films</Label>
                            <MultiSelect
                                options={films.map(f => ({ label: f.slug, value: f.id }))}
                                defaultValue={selectedFilms}
                                onValueChange={setSelectedFilms}
                                placeholder="Select related films..."
                                className="text-[11px]"
                            />
                        </div>

                        <div className="pt-4 border-t border-gray-100 mt-2">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-gray-400 mb-3">SEO configuration</h4>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Greek (EL)</div>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            className="h-5 px-2 text-[9px] text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                            onClick={() => handleGenerateSEO('el')}
                                            disabled={loadingEl}
                                        >
                                            {loadingEl ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                                            Generate AI
                                        </Button>
                                    </div>
                                    <div className="space-y-2 pl-2 border-l-2 border-indigo-100">
                                        <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Meta Title</Label>
                                        <Input name="el.metaTitle" value={elContent.metaTitle} onChange={e => setElContent({ ...elContent, metaTitle: e.target.value })} className="text-[11px] h-8" placeholder="SEO Title" />

                                        <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Meta Description</Label>
                                        <Textarea name="el.metaDescription" value={elContent.metaDescription} onChange={e => setElContent({ ...elContent, metaDescription: e.target.value })} rows={2} className="text-[11px] min-h-[50px]" placeholder="SEO Description" />

                                        <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Keywords</Label>
                                        <Textarea name="el.keywords" value={elContent.keywords} onChange={e => setElContent({ ...elContent, keywords: e.target.value })} rows={2} className="text-[11px] min-h-[50px]" placeholder="Keywords, comma separated" />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">English (EN)</div>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            className="h-5 px-2 text-[9px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                            onClick={() => handleGenerateSEO('en')}
                                            disabled={loadingEn}
                                        >
                                            {loadingEn ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                                            Generate AI
                                        </Button>
                                    </div>
                                    <div className="space-y-2 pl-2 border-l-2 border-emerald-100">
                                        <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Meta Title</Label>
                                        <Input name="en.metaTitle" value={enContent.metaTitle} onChange={e => setEnContent({ ...enContent, metaTitle: e.target.value })} className="text-[11px] h-8" placeholder="SEO Title" />

                                        <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Meta Description</Label>
                                        <Textarea name="en.metaDescription" value={enContent.metaDescription} onChange={e => setEnContent({ ...enContent, metaDescription: e.target.value })} rows={2} className="text-[11px] min-h-[50px]" placeholder="SEO Description" />

                                        <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Keywords</Label>
                                        <Textarea name="en.keywords" value={enContent.keywords} onChange={e => setEnContent({ ...enContent, keywords: e.target.value })} rows={2} className="text-[11px] min-h-[50px]" placeholder="Keywords, comma separated" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    )
}
