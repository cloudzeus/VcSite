"use client"

import { useState, useEffect, useId, useRef } from "react"
import { PressItem, PressItemTranslation, MediaAsset } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PressDialog } from "@/components/admin/press-dialog"
import { PressForm } from "@/components/admin/press-form"
import { InlineEdit } from "@/components/admin/inline-edit"
import { updatePressOrder, updatePressTitle } from "@/app/actions/press"
import { GripVertical, ChevronDown, ChevronUp, Plus, Newspaper } from "lucide-react"
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

type PressWithRelations = PressItem & {
    translations: PressItemTranslation[]
    image: MediaAsset | null
    gallery: (MediaAsset & { hashtags?: { text: string }[] })[]
    films: { id: string }[]
}

function SortablePressRow({ item, films, onUpdateTitle }: { item: PressWithRelations, films: { id: string, slug: string }[], onUpdateTitle: (id: string, t: string) => Promise<void> }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: item.id });

    const [expanded, setExpanded] = useState(false)
    const rowRef = useRef<HTMLDivElement>(null)

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const titleEl = item.translations.find(t => t.lang === 'el')?.title || 'Untitled'

    return (
        <div ref={setNodeRef} style={style} className="mb-3">
            <div
                ref={rowRef}
                className={`
                    group bg-white/80 backdrop-blur-sm border border-indigo-50/50 shadow-sm rounded-xl overflow-hidden transition-all duration-300
                    ${expanded ? 'ring-2 ring-indigo-500/20 shadow-lg' : 'hover:shadow-md hover:border-indigo-100'}
                `}
            >
                <div className="flex items-center p-3 gap-3">
                    <div className="col-span-1 flex items-center justify-center cursor-move text-gray-300 hover:text-gray-500 transition-colors" {...attributes} {...listeners}>
                        <GripVertical size={14} />
                    </div>

                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 overflow-hidden shadow-inner border border-emerald-100">
                        {item.image ? (
                            <img src={item.image.url} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <Newspaper size={16} strokeWidth={2.5} />
                        )}
                    </div>

                    <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-4">
                            <div className="font-bold text-[11px] text-gray-900">{item.outlet}</div>
                            <div className="truncate text-gray-500 text-[10px]">
                                <InlineEdit
                                    value={titleEl}
                                    onSave={(val) => onUpdateTitle(item.id, val)}
                                    className="text-[10px]"
                                />
                            </div>
                        </div>
                        <div className="col-span-2">
                            <Badge variant="outline" className="text-[9px] px-2 py-0.5 h-auto font-medium tracking-wide bg-gray-50 text-gray-500 border-gray-200">
                                {item.kind}
                            </Badge>
                        </div>
                        <div className="col-span-2 text-[11px] text-gray-400">
                            {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('el-GR') : '-'}
                        </div>
                        <div className="col-span-2 text-right">
                            <Badge variant={item.published ? "default" : "secondary"} className="text-[9px] px-2 py-0.5 h-auto font-medium tracking-wide bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-100">
                                {item.published ? "PUBLISHED" : "DRAFT"}
                            </Badge>
                        </div>
                        <div className="col-span-2 flex justify-end">
                            {/* Spacing/Actions */}
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
                        <PressForm item={item} films={films} onSuccess={() => setExpanded(false)} />
                    </div>
                )}
            </div>
        </div>
    )
}

export function PressClientPage({ items: initialItems, allFilms }: { items: PressWithRelations[], allFilms: { id: string, slug: string }[] }) {
    const [isMounted, setIsMounted] = useState(false)
    const [items, setItems] = useState(initialItems)
    const [selectedItem, setSelectedItem] = useState<PressWithRelations | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const dndId = useId()
    const listRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setIsMounted(true)
        setItems(initialItems)
    }, [initialItems])

    useGSAP(() => {
        gsap.from(".press-row", {
            y: 20,
            opacity: 0,
            stagger: 0.05,
            duration: 0.5,
            ease: "power2.out"
        })
    }, { scope: listRef, dependencies: [items, isMounted] })

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);

                const newItems = arrayMove(items, oldIndex, newIndex);

                const updates = newItems.map((item, index) => ({ id: item.id, order: index }))
                updatePressOrder(updates).catch(console.error)

                return newItems;
            });
        }
    }

    function openCreate() {
        setSelectedItem(null)
        setIsDialogOpen(true)
    }

    if (!isMounted) return <div className="min-h-screen bg-gray-50/50" />

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 pt-10">
            <div className="w-[95%] mx-auto space-y-8">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-500">Press</h1>
                        <p className="text-[11px] text-gray-400 mt-1 uppercase tracking-widest font-medium">Manage press coverage</p>
                    </div>
                    <Button onClick={openCreate} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-200 text-white rounded-xl px-6 h-10 text-[11px] font-bold uppercase tracking-wide transition-all hover:scale-105 active:scale-95">
                        <Plus size={14} className="mr-2" /> Add Press Item
                    </Button>
                </div>

                <div className="grid grid-cols-12 gap-4 px-16 py-3 mb-2 font-semibold text-[10px] text-gray-400 uppercase tracking-widest pl-[4.5rem]">
                    <div className="col-span-4">Outlet / Title</div>
                    <div className="col-span-2">Kind</div>
                    <div className="col-span-2">Date</div>
                    <div className="col-span-2 text-right">Status</div>
                    <div className="col-span-2"></div>
                </div>

                <div ref={listRef}>
                    <DndContext
                        id={dndId}
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={items.map(i => i.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div>
                                {items.map(item => (
                                    <div key={item.id} className="press-row">
                                        <SortablePressRow
                                            item={item}
                                            films={allFilms}
                                            onUpdateTitle={updatePressTitle}
                                        />
                                    </div>
                                ))}
                                {items.length === 0 && (
                                    <div className="p-12 text-center border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                                        <p className="text-gray-400 text-sm">No press items found.</p>
                                        <Button variant="link" onClick={openCreate} className="mt-2 text-emerald-600">Add content</Button>
                                    </div>
                                )}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>

                <PressDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    item={selectedItem}
                    films={allFilms}
                />
            </div>
        </div>
    )
}
