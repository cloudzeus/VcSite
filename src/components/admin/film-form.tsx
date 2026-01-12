"use client"

import { useState, useEffect } from "react"
import { Film, FilmTranslation, MediaAsset } from "@prisma/client"
import { upsertFilm, deleteFilm } from "@/app/actions/films"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CreditsEditor } from "@/components/admin/credits-editor"
import { MultiSelect } from "@/components/ui/multi-select"
import { GalleryEditor } from "@/components/admin/gallery-editor"
import { UploadWidget } from "@/components/admin/upload-widget"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings, Trash, Save, Sparkles, Loader2 } from "lucide-react"
import { generateSEO } from "@/app/actions/ai"
import { toast } from "sonner"

type FilmWithRelations = Film & {
    translations: FilmTranslation[]
    heroVideo: MediaAsset | null
    media: (MediaAsset & { hashtags?: { text: string }[] })[]
}

interface FilmFormProps {
    film?: FilmWithRelations | null
    onSuccess?: () => void
    onCancel?: () => void
}

export function FilmForm({ film, onSuccess, onCancel }: FilmFormProps) {
    const [isDeleting, setIsDeleting] = useState(false)
    const isNew = !film?.id

    const [tags, setTags] = useState<string[]>(
        Array.isArray(film?.tags) ? (film.tags as string[]) : []
    )
    const [media, setMedia] = useState(film?.media || [])
    const [heroVideoId, setHeroVideoId] = useState(film?.heroVideoId || "")

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        const creditsStr = formData.get("credits") as string
        let credits = undefined
        try {
            if (creditsStr) credits = JSON.parse(creditsStr)
        } catch (e) {
            console.error("Error parsing credits", e)
        }

        const data = {
            id: isNew ? 'new' : film?.id,
            slug: formData.get("slug"),
            published: formData.get("published") === "on",
            releaseDate: formData.get("releaseDate"),
            heroVideoId,
            tags,
            credits,
            galleryIds: media.map(m => m.id),
            el: {
                title: formData.get("el.title"),
                logline: formData.get("el.logline"),
                synopsis: formData.get("el.synopsis"),
                metaTitle: formData.get("el.metaTitle"),
                metaDescription: formData.get("el.metaDescription"),
                keywords: formData.get("el.keywords"),
            },
            en: {
                title: formData.get("en.title"),
                logline: formData.get("en.logline"),
                synopsis: formData.get("en.synopsis"),
                metaTitle: formData.get("en.metaTitle"),
                metaDescription: formData.get("en.metaDescription"),
                keywords: formData.get("en.keywords"),
            }
        }

        await upsertFilm(data)
        onSuccess?.()
    }

    const tEl = film?.translations.find(t => t.lang === 'el')
    const tEn = film?.translations.find(t => t.lang === 'en')

    const [elContent, setElContent] = useState({
        title: tEl?.title || "",
        logline: tEl?.logline || "",
        synopsis: tEl?.synopsis || "",
        metaTitle: tEl?.metaTitle || "",
        metaDescription: tEl?.metaDescription || "",
        keywords: tEl?.keywords || ""
    })
    const [enContent, setEnContent] = useState({
        title: tEn?.title || "",
        logline: tEn?.logline || "",
        synopsis: tEn?.synopsis || "",
        metaTitle: tEn?.metaTitle || "",
        metaDescription: tEn?.metaDescription || "",
        keywords: tEn?.keywords || ""
    })

    const [loadingEl, setLoadingEl] = useState(false)
    const [loadingEn, setLoadingEn] = useState(false)

    async function handleGenerateSEO(lang: 'el' | 'en') {
        const content = lang === 'el' ? elContent : enContent
        const setContent = lang === 'el' ? setElContent : setEnContent
        const setLoading = lang === 'el' ? setLoadingEl : setLoadingEn

        const baseText = `Title: ${content.title}\nLogline: ${content.logline}\nSynopsis: ${content.synopsis}`
        // Simple validation to ensure we have something to work with
        if (content.title.length < 2 && content.logline.length < 5 && content.synopsis.length < 5) {
            toast.error("Please fill in Title, Logline or Synopsis first")
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

    useEffect(() => {
        setHeroVideoId(film?.heroVideoId || "")
        setMedia(film?.media || [])
        setTags(Array.isArray(film?.tags) ? (film.tags as string[]) : [])
    }, [film])

    return (
        <form onSubmit={onSubmit} className="space-y-6" key={film?.id || 'new'}>
            <div className="flex justify-between items-center bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">
                    {isNew ? 'Create New Film' : `Editing ${film?.slug}`}
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 text-[10px]">
                                <Settings className="mr-2 h-3 w-3" /> Actions
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Manage Film</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => setHeroVideoId("")}>
                                Clear Hero Video
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setMedia([])}>
                                Clear Gallery
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {!isNew && (
                                <DropdownMenuItem className="text-red-600" onSelect={async () => {
                                    if (film?.id && confirm("Delete this film?")) {
                                        setIsDeleting(true)
                                        await deleteFilm(film.id)
                                        onSuccess?.()
                                    }
                                }}>
                                    <Trash className="mr-2 h-3 w-3" /> Delete Film
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
                        <h3 className="font-bold text-[10px] uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2 mb-2">Primary Content</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Greek Title</Label>
                                <Input name="el.title" value={elContent.title} onChange={e => setElContent({ ...elContent, title: e.target.value })} required className="text-[11px] h-8 font-medium" />

                                <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Logline (EL)</Label>
                                <Textarea name="el.logline" value={elContent.logline} onChange={e => setElContent({ ...elContent, logline: e.target.value })} rows={2} required className="text-[11px] min-h-[60px]" />

                                <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Synopsis (EL)</Label>
                                <Textarea name="el.synopsis" value={elContent.synopsis} onChange={e => setElContent({ ...elContent, synopsis: e.target.value })} rows={4} required className="text-[11px]" />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">English Title</Label>
                                <Input name="en.title" value={enContent.title} onChange={e => setEnContent({ ...enContent, title: e.target.value })} className="text-[11px] h-8" />

                                <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Logline (EN)</Label>
                                <Textarea name="en.logline" value={enContent.logline} onChange={e => setEnContent({ ...enContent, logline: e.target.value })} rows={2} className="text-[11px] min-h-[60px]" />

                                <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Synopsis (EN)</Label>
                                <Textarea name="en.synopsis" value={enContent.synopsis} onChange={e => setEnContent({ ...enContent, synopsis: e.target.value })} rows={4} className="text-[11px]" />
                            </div>
                        </div>


                    </div>

                    <div className="bg-white/50 p-4 rounded-xl border border-gray-100 space-y-4 shadow-sm">
                        <h3 className="font-bold text-[10px] uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2 mb-2">Media & Gallery</h3>
                        <div className="space-y-2">
                            <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Image Gallery</Label>
                            <GalleryEditor
                                assets={media}
                                onChange={setMedia}
                                defaultId={heroVideoId}
                                onSetDefault={setHeroVideoId}
                                folder="films"
                            />
                        </div>
                        <div className="pt-4 border-t border-gray-100">
                            <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider block mb-2">Hero Video (Trailer/Clip)</Label>
                            <div className="max-w-xs">
                                <UploadWidget
                                    kind="VIDEO"
                                    initialAsset={film?.heroVideo?.kind === 'VIDEO' ? film.heroVideo : null}
                                    onUpload={(asset) => setHeroVideoId(asset.id)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/50 p-4 rounded-xl border border-gray-100 space-y-4 shadow-sm">
                        <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider mb-2 block">Credits</Label>
                        <CreditsEditor name="credits" initialCredits={film?.credits} />
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white/50 p-4 rounded-xl border border-gray-100 space-y-4 shadow-sm sticky top-4">
                        <h3 className="font-bold text-[10px] uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2 mb-2">Metadata</h3>
                        <div>
                            <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Slug</Label>
                            <Input name="slug" defaultValue={film?.slug} required className="text-[11px] h-8 font-mono text-gray-600" />
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded bg-indigo-50/50 border border-indigo-100">
                            <input type="checkbox" name="published" id={`published-${film?.id}`} defaultChecked={film?.published} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                            <Label htmlFor={`published-${film?.id}`} className="text-[10px] font-bold text-indigo-900 cursor-pointer">Published</Label>
                        </div>
                        <div>
                            <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Release Date</Label>
                            <Input type="date" name="releaseDate" defaultValue={film?.releaseDate ? new Date(film.releaseDate).toISOString().split('T')[0] : ''} className="text-[11px] h-8" />
                        </div>
                        <div>
                            <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Tags</Label>
                            <MultiSelect
                                options={[
                                    { label: "Drama", value: "drama" },
                                    { label: "Comedy", value: "comedy" },
                                    { label: "Documentary", value: "documentary" },
                                    { label: "Short", value: "short" },
                                    { label: "Social", value: "social" },
                                    { label: "LGBTQI", value: "lgbtqi" },
                                    { label: "Music Video", value: "music-video" }
                                ]}
                                defaultValue={tags}
                                onValueChange={setTags}
                                placeholder="Select tags..."
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
