"use client"

import { useState, useEffect, useId, useRef } from "react"
import { Film, FilmTranslation, MediaAsset } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FilmDialog } from "@/components/admin/film-dialog"
import { FilmForm } from "@/components/admin/film-form"
import { InlineEdit } from "@/components/admin/inline-edit"
import { updateFilmOrder, updateFilmTitle } from "@/app/actions/films"
import { GripVertical, ChevronDown, ChevronUp, Plus, Film as FilmIcon } from "lucide-react"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

type FilmWithRelations = Film & {
    translations: FilmTranslation[]
    heroVideo: MediaAsset | null
    media: MediaAsset[]
}

function SortableFilmRow({ film, onUpdateTitle }: { film: FilmWithRelations, onUpdateTitle: (id: string, t: string) => Promise<void> }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: film.id });

    const [expanded, setExpanded] = useState(false)
    const rowRef = useRef<HTMLDivElement>(null)

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const titleEl = film.translations.find(t => t.lang === 'el')?.title || 'Untitled'

    return (
        <div ref={setNodeRef} style={style} className="mb-3 film-row">
            <div
                ref={rowRef}
                className={`
                    group bg-white/80 backdrop-blur-sm border border-indigo-50/50 shadow-sm rounded-xl overflow-hidden transition-all duration-300
                    ${expanded ? 'ring-2 ring-indigo-500/20 shadow-lg' : 'hover:shadow-md hover:border-indigo-100'}
                `}
            >
                <div className="flex items-center p-3 gap-3">
                    <div className="flex items-center justify-center cursor-move text-gray-300 hover:text-gray-500 transition-colors" {...attributes} {...listeners}>
                        <GripVertical size={14} />
                    </div>

                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden shadow-inner border ${film.heroVideo ? 'bg-indigo-50 border-indigo-100 text-indigo-500' : 'bg-gray-50 border-gray-100 text-gray-300'}`}>
                        {film.heroVideo ? (
                            film.heroVideo.kind === 'IMAGE' ? (
                                <img src={film.heroVideo.url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <FilmIcon size={16} strokeWidth={2.5} />
                            )
                        ) : (
                            <FilmIcon size={16} strokeWidth={1.5} />
                        )}
                    </div>

                    <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-3 font-medium text-[11px] text-gray-700 truncate" title={film.slug}>{film.slug}</div>
                        <div className="col-span-5 text-[11px] font-semibold text-gray-900 truncate">
                            <InlineEdit
                                value={titleEl}
                                onSave={(val) => onUpdateTitle(film.id, val)}
                                className="text-[11px]"
                            />
                        </div>
                        <div className="col-span-2 text-[11px] text-gray-400">
                            {film.releaseDate ? new Date(film.releaseDate).toLocaleDateString('el-GR') : '-'}
                        </div>
                        <div className="col-span-2 flex justify-end">
                            <Badge variant={film.published ? "default" : "secondary"} className="text-[9px] px-2 py-0.5 h-auto font-medium tracking-wide bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-100">
                                {film.published ? "PUBLISHED" : "DRAFT"}
                            </Badge>
                        </div>
                    </div>

                    <div className="pl-3 border-l border-gray-100">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-gray-400"
                            onClick={() => setExpanded(!expanded)}
                        >
                            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </Button>
                    </div>
                </div>

                {expanded && (
                    <div className="p-6 bg-gray-50/50 border-t border-gray-100 animate-in fade-in slide-in-from-top-1 duration-200">
                        <FilmForm film={film} onSuccess={() => setExpanded(false)} />
                    </div>
                )}
            </div>
        </div>
    )
}

export function FilmsClientPage({ films: initialFilms }: { films: FilmWithRelations[] }) {
    const [films, setFilms] = useState(initialFilms)
    const [selectedFilm, setSelectedFilm] = useState<FilmWithRelations | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const dndId = useId()
    const listRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setFilms(initialFilms)
    }, [initialFilms])

    useGSAP(() => {
        gsap.from(".film-row", {
            y: 20,
            opacity: 0,
            stagger: 0.05,
            duration: 0.5,
            ease: "power2.out"
        })
    }, { scope: listRef, dependencies: [films] })

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setFilms((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);

                const newItems = arrayMove(items, oldIndex, newIndex);

                const updates = newItems.map((item, index) => ({ id: item.id, order: index }))
                updateFilmOrder(updates).catch(console.error)

                return newItems;
            });
        }
    }

    function openCreate() {
        setSelectedFilm(null)
        setIsDialogOpen(true)
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 pt-10">
            <div className="w-[95%] mx-auto space-y-8">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">Films</h1>
                        <p className="text-[11px] text-gray-400 mt-1 uppercase tracking-widest font-medium">Manage your portfolio</p>
                    </div>
                    <Button onClick={openCreate} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-200 text-white rounded-xl px-6 h-10 text-[11px] font-bold uppercase tracking-wide transition-all hover:scale-105 active:scale-95">
                        <Plus size={14} className="mr-2" /> Add New Film
                    </Button>
                </div>

                {/* Header Row */}
                <div className="grid grid-cols-12 gap-4 px-16 py-3 font-semibold text-[10px] text-gray-400 uppercase tracking-widest pl-[4.5rem]">
                    <div className="col-span-3">Slug</div>
                    <div className="col-span-5">Title (EL)</div>
                    <div className="col-span-2">Release</div>
                    <div className="col-span-2 text-right pr-4">Status</div>
                </div>

                <div ref={listRef}>
                    <DndContext
                        id={dndId}
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={films.map(f => f.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div>
                                {films.map(film => (
                                    <SortableFilmRow
                                        key={film.id}
                                        film={film}
                                        onUpdateTitle={updateFilmTitle}
                                    />
                                ))}
                                {films.length === 0 && (
                                    <div className="p-12 text-center border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                                        <p className="text-gray-400 text-sm">No films found.</p>
                                        <Button variant="link" onClick={openCreate} className="mt-2 text-indigo-600">Create one now</Button>
                                    </div>
                                )}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>

                <FilmDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    film={selectedFilm}
                />
            </div>
        </div>
    )
}
