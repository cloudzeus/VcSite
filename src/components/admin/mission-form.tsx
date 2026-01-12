"use client"

import { useState, useEffect } from "react"
import { MissionStatement, MissionStatementTranslation } from "@prisma/client"
import { upsertMission, deleteMission } from "@/app/actions/missions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings, Trash, Save, Sparkles, Loader2, X } from "lucide-react"
import { generateSEO, generatePhrases } from "@/app/actions/ai"
import { toast } from "sonner"

type MissionWithRelations = MissionStatement & {
    translations: MissionStatementTranslation[]
}

interface MissionFormProps {
    mission?: MissionWithRelations | null
    onSuccess?: () => void
    onCancel?: () => void
}

export function MissionForm({ mission, onSuccess, onCancel }: MissionFormProps) {
    const isNew = !mission?.id

    const tEl = mission?.translations.find((t: { lang: string }) => t.lang === 'el')
    const tEn = mission?.translations.find((t: { lang: string }) => t.lang === 'en')

    const [slug, setSlug] = useState(mission?.slug || "")

    const [elContent, setElContent] = useState({
        title: tEl?.title || "",
        shortDescription: tEl?.shortDescription || "",
        longDescription: tEl?.longDescription || "",
        phrases: (tEl?.phrases as string[]) || [],
        mottos: (tEl?.mottos as string[]) || [],
        metaTitle: tEl?.metaTitle || "",
        metaDescription: tEl?.metaDescription || "",
        keywords: tEl?.keywords || ""
    })

    const [enContent, setEnContent] = useState({
        title: tEn?.title || "",
        shortDescription: tEn?.shortDescription || "",
        longDescription: tEn?.longDescription || "",
        phrases: (tEn?.phrases as string[]) || [],
        mottos: (tEn?.mottos as string[]) || [],
        metaTitle: tEn?.metaTitle || "",
        metaDescription: tEn?.metaDescription || "",
        keywords: tEn?.keywords || ""
    })

    const [loadingEl, setLoadingEl] = useState(false)
    const [loadingEn, setLoadingEn] = useState(false)
    const [loadingElPhrases, setLoadingElPhrases] = useState(false)
    const [loadingEnPhrases, setLoadingEnPhrases] = useState(false)
    const [loadingElMottos, setLoadingElMottos] = useState(false)
    const [loadingEnMottos, setLoadingEnMottos] = useState(false)

    // Auto-generate slug from Greek title
    useEffect(() => {
        if (isNew && elContent.title) {
            const generatedSlug = elContent.title
                .toLowerCase()
                .replace(/[^a-z0-9α-ω\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim()
            setSlug(generatedSlug)
        }
    }, [elContent.title, isNew])

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        const data = {
            id: isNew ? 'new' : mission?.id,
            slug: slug,
            published: formData.get("published") === "on",
            publishedDate: formData.get("publishedDate") as string,
            el: {
                title: elContent.title,
                shortDescription: elContent.shortDescription,
                longDescription: elContent.longDescription,
                phrases: elContent.phrases,
                mottos: elContent.mottos,
                metaTitle: elContent.metaTitle,
                metaDescription: elContent.metaDescription,
                keywords: elContent.keywords,
            },
            en: {
                title: enContent.title,
                shortDescription: enContent.shortDescription,
                longDescription: enContent.longDescription,
                phrases: enContent.phrases,
                mottos: enContent.mottos,
                metaTitle: enContent.metaTitle,
                metaDescription: enContent.metaDescription,
                keywords: enContent.keywords,
            }
        }

        await upsertMission(data)
        onSuccess?.()
    }

    async function handleGenerateSEO(lang: 'el' | 'en') {
        const content = lang === 'el' ? elContent : enContent
        const setContent = lang === 'el' ? setElContent : setEnContent
        const setLoading = lang === 'el' ? setLoadingEl : setLoadingEn

        const baseText = `Title: ${content.title}\nShort: ${content.shortDescription}\nLong: ${content.longDescription}`
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

    async function handleGeneratePhrases(lang: 'el' | 'en', type: 'phrases' | 'mottos') {
        const content = lang === 'el' ? elContent : enContent
        const setContent = lang === 'el' ? setElContent : setEnContent
        const setLoading = type === 'phrases'
            ? (lang === 'el' ? setLoadingElPhrases : setLoadingEnPhrases)
            : (lang === 'el' ? setLoadingElMottos : setLoadingEnMottos)

        const baseText = `Title: ${content.title}\nShort: ${content.shortDescription}\nLong: ${content.longDescription}`
        if (content.title.length < 2 && content.shortDescription.length < 5) {
            toast.error("Please fill in Title and Short Description first")
            return
        }

        setLoading(true)
        try {
            const generated = await generatePhrases(baseText, type)
            setContent(prev => ({
                ...prev,
                [type]: [...prev[type], ...generated]
            }))
            toast.success(`${type === 'phrases' ? 'Phrases' : 'Mottos'} generated`)
        } catch (e) {
            console.error(e)
            toast.error(`Failed to generate ${type}`)
        } finally {
            setLoading(false)
        }
    }

    function removePhrase(lang: 'el' | 'en', type: 'phrases' | 'mottos', index: number) {
        const setContent = lang === 'el' ? setElContent : setEnContent
        setContent(prev => ({
            ...prev,
            [type]: prev[type].filter((_, i) => i !== index)
        }))
    }

    useEffect(() => {
        if (mission) {
            const el = mission.translations.find((t: { lang: string }) => t.lang === 'el')
            const en = mission.translations.find((t: { lang: string }) => t.lang === 'en')
            if (el) {
                setElContent({
                    title: el.title || "",
                    shortDescription: el.shortDescription || "",
                    longDescription: el.longDescription || "",
                    phrases: (el.phrases as string[]) || [],
                    mottos: (el.mottos as string[]) || [],
                    metaTitle: el.metaTitle || "",
                    metaDescription: el.metaDescription || "",
                    keywords: el.keywords || ""
                })
            }
            if (en) {
                setEnContent({
                    title: en.title || "",
                    shortDescription: en.shortDescription || "",
                    longDescription: en.longDescription || "",
                    phrases: (en.phrases as string[]) || [],
                    mottos: (en.mottos as string[]) || [],
                    metaTitle: en.metaTitle || "",
                    metaDescription: en.metaDescription || "",
                    keywords: en.keywords || ""
                })
            }
        }
    }, [mission])

    return (
        <form onSubmit={onSubmit} className="space-y-6" key={mission?.id || 'new'}>
            <div className="flex justify-between items-center bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">
                    {isNew ? 'Create New Mission' : `Editing ${mission?.slug}`}
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 text-[10px]">
                                <Settings className="mr-2 h-3 w-3" /> Actions
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Manage Mission</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {!isNew && (
                                <DropdownMenuItem className="text-red-600" onSelect={async () => {
                                    if (mission?.id && confirm("Delete this mission?")) {
                                        await deleteMission(mission.id)
                                        onSuccess?.()
                                    }
                                }}>
                                    <Trash className="mr-2 h-3 w-3" /> Delete Mission
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
                                <Input value={elContent.title} onChange={e => setElContent({ ...elContent, title: e.target.value })} required className="text-[11px] h-8 font-medium" />

                                <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Short Description (EL)</Label>
                                <RichTextEditor value={elContent.shortDescription} onChange={(val) => setElContent({ ...elContent, shortDescription: val })} placeholder="Enter short description..." className="text-[11px]" />

                                <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Long Description (EL)</Label>
                                <RichTextEditor value={elContent.longDescription} onChange={(val) => setElContent({ ...elContent, longDescription: val })} placeholder="Enter long description..." className="text-[11px]" />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">English Title</Label>
                                <Input value={enContent.title} onChange={e => setEnContent({ ...enContent, title: e.target.value })} className="text-[11px] h-8" />

                                <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Short Description (EN)</Label>
                                <RichTextEditor value={enContent.shortDescription} onChange={(val) => setEnContent({ ...enContent, shortDescription: val })} placeholder="Enter short description..." className="text-[11px]" />

                                <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Long Description (EN)</Label>
                                <RichTextEditor value={enContent.longDescription} onChange={(val) => setEnContent({ ...enContent, longDescription: val })} placeholder="Enter long description..." className="text-[11px]" />
                            </div>
                        </div>
                    </div>

                    {/* Phrases Section */}
                    <div className="bg-white/50 p-4 rounded-xl border border-gray-100 space-y-4 shadow-sm">
                        <h3 className="font-bold text-[10px] uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2 mb-2">AI-Generated Phrases</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Greek Phrases</Label>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 px-2 text-[9px] text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                        onClick={() => handleGeneratePhrases('el', 'phrases')}
                                        disabled={loadingElPhrases}
                                    >
                                        {loadingElPhrases ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                                        Generate
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-1.5 min-h-[60px] p-2 bg-gray-50 rounded border border-gray-100">
                                    {elContent.phrases.map((phrase, idx) => (
                                        <Badge key={idx} variant="secondary" className="text-[9px] px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100 flex items-center gap-1">
                                            {phrase}
                                            <X className="h-3 w-3 cursor-pointer hover:text-indigo-900" onClick={() => removePhrase('el', 'phrases', idx)} />
                                        </Badge>
                                    ))}
                                    {elContent.phrases.length === 0 && <span className="text-[9px] text-gray-400">No phrases yet</span>}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">English Phrases</Label>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 px-2 text-[9px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                        onClick={() => handleGeneratePhrases('en', 'phrases')}
                                        disabled={loadingEnPhrases}
                                    >
                                        {loadingEnPhrases ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                                        Generate
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-1.5 min-h-[60px] p-2 bg-gray-50 rounded border border-gray-100">
                                    {enContent.phrases.map((phrase, idx) => (
                                        <Badge key={idx} variant="secondary" className="text-[9px] px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100 flex items-center gap-1">
                                            {phrase}
                                            <X className="h-3 w-3 cursor-pointer hover:text-emerald-900" onClick={() => removePhrase('en', 'phrases', idx)} />
                                        </Badge>
                                    ))}
                                    {enContent.phrases.length === 0 && <span className="text-[9px] text-gray-400">No phrases yet</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mottos Section */}
                    <div className="bg-white/50 p-4 rounded-xl border border-gray-100 space-y-4 shadow-sm">
                        <h3 className="font-bold text-[10px] uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2 mb-2">AI-Generated Mottos</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Greek Mottos</Label>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 px-2 text-[9px] text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                        onClick={() => handleGeneratePhrases('el', 'mottos')}
                                        disabled={loadingElMottos}
                                    >
                                        {loadingElMottos ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                                        Generate
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-1.5 min-h-[60px] p-2 bg-gray-50 rounded border border-gray-100">
                                    {elContent.mottos.map((motto, idx) => (
                                        <Badge key={idx} variant="secondary" className="text-[9px] px-2 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-100 flex items-center gap-1">
                                            {motto}
                                            <X className="h-3 w-3 cursor-pointer hover:text-purple-900" onClick={() => removePhrase('el', 'mottos', idx)} />
                                        </Badge>
                                    ))}
                                    {elContent.mottos.length === 0 && <span className="text-[9px] text-gray-400">No mottos yet</span>}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">English Mottos</Label>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 px-2 text-[9px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                        onClick={() => handleGeneratePhrases('en', 'mottos')}
                                        disabled={loadingEnMottos}
                                    >
                                        {loadingEnMottos ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                                        Generate
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-1.5 min-h-[60px] p-2 bg-gray-50 rounded border border-gray-100">
                                    {enContent.mottos.map((motto, idx) => (
                                        <Badge key={idx} variant="secondary" className="text-[9px] px-2 py-1 bg-pink-50 text-pink-700 hover:bg-pink-100 border-pink-100 flex items-center gap-1">
                                            {motto}
                                            <X className="h-3 w-3 cursor-pointer hover:text-pink-900" onClick={() => removePhrase('en', 'mottos', idx)} />
                                        </Badge>
                                    ))}
                                    {enContent.mottos.length === 0 && <span className="text-[9px] text-gray-400">No mottos yet</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white/50 p-4 rounded-xl border border-gray-100 space-y-4 shadow-sm sticky top-4">
                        <h3 className="font-bold text-[10px] uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2 mb-2">Metadata</h3>
                        <div>
                            <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Slug (auto-generated)</Label>
                            <Input name="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required className="text-[11px] h-8 font-mono text-gray-600" />
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded bg-indigo-50/50 border border-indigo-100">
                            <input type="checkbox" name="published" id={`published-${mission?.id}`} defaultChecked={mission?.published} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                            <Label htmlFor={`published-${mission?.id}`} className="text-[10px] font-bold text-indigo-900 cursor-pointer">Published</Label>
                        </div>
                        <div>
                            <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Published Date</Label>
                            <Input type="date" name="publishedDate" defaultValue={mission?.publishedDate ? new Date(mission.publishedDate).toISOString().split('T')[0] : ''} className="text-[11px] h-8" />
                        </div>

                        <div className="pt-4 border-t border-gray-100 mt-2">
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-gray-400 mb-3">SEO Configuration</h4>
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
                                        <Input value={elContent.metaTitle} onChange={e => setElContent({ ...elContent, metaTitle: e.target.value })} className="text-[11px] h-8" placeholder="SEO Title" />

                                        <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Meta Description</Label>
                                        <Textarea value={elContent.metaDescription} onChange={e => setElContent({ ...elContent, metaDescription: e.target.value })} rows={2} className="text-[11px] min-h-[50px]" placeholder="SEO Description" />

                                        <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Keywords</Label>
                                        <Textarea value={elContent.keywords} onChange={e => setElContent({ ...elContent, keywords: e.target.value })} rows={2} className="text-[11px] min-h-[50px]" placeholder="Keywords, comma separated" />
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
                                        <Input value={enContent.metaTitle} onChange={e => setEnContent({ ...enContent, metaTitle: e.target.value })} className="text-[11px] h-8" placeholder="SEO Title" />

                                        <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Meta Description</Label>
                                        <Textarea value={enContent.metaDescription} onChange={e => setEnContent({ ...enContent, metaDescription: e.target.value })} rows={2} className="text-[11px] min-h-[50px]" placeholder="SEO Description" />

                                        <Label className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Keywords</Label>
                                        <Textarea value={enContent.keywords} onChange={e => setEnContent({ ...enContent, keywords: e.target.value })} rows={2} className="text-[11px] min-h-[50px]" placeholder="Keywords, comma separated" />
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
