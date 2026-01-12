"use client"

import { useState, useId } from "react"
import { MediaAsset } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { X, Star, Upload, Loader2, Plus, GripVertical, Pencil } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ImageDetailsDialog } from "./image-details-dialog"
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
    rectSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type AssetWithTags = MediaAsset & { hashtags?: { text: string }[] }

interface GalleryEditorProps {
    assets: AssetWithTags[]
    onChange: (assets: AssetWithTags[]) => void
    defaultId?: string | null
    onSetDefault?: (id: string) => void
    folder?: string
    accept?: string
}

function SortableImage({ asset, isDefault, onSetDefault, onRemove, onEdit }: {
    asset: AssetWithTags,
    isDefault: boolean,
    onSetDefault?: (id: string) => void,
    onRemove: (id: string) => void,
    onEdit: (asset: AssetWithTags) => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: asset.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className={`group relative w-32 h-32 rounded-xl overflow-hidden border-2 transition-all ${isDefault ? 'border-indigo-500 shadow-md ring-2 ring-indigo-200' : 'border-gray-100 hover:border-gray-300'}`}>
            {asset.kind === 'VIDEO' || asset.mimeType?.startsWith('video/') ? (
                <video src={asset.url} className="w-full h-full object-cover" muted loop playsInline />
            ) : (
                <img src={asset.url} alt="" className="w-full h-full object-cover" />
            )}

            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 cursor-move bg-black/40 rounded p-1 text-white z-10 transition-opacity" {...attributes} {...listeners}>
                <GripVertical size={14} />
            </div>

            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <div className="flex gap-2" onPointerDown={(e) => e.stopPropagation()}>
                    {/* Stop propagation so buttons work without drag interference */}
                    <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7 rounded-full bg-white text-gray-500 hover:text-indigo-600"
                        onClick={() => onEdit(asset)}
                        title="Edit Details"
                    >
                        <Pencil size={12} />
                    </Button>

                    {onSetDefault && (
                        <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className={`h-7 w-7 rounded-full ${isDefault ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 'bg-white text-gray-500 hover:text-yellow-500'}`}
                            onClick={() => onSetDefault(asset.id)}
                            title="Set as Default"
                        >
                            <Star size={14} className={isDefault ? 'fill-current' : ''} />
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="h-7 w-7 rounded-full"
                        onClick={() => onRemove(asset.id)}
                    >
                        <X size={14} />
                    </Button>
                </div>
            </div>

            {isDefault && (
                <div className="absolute top-1 left-1 z-10">
                    <Badge className="text-[8px] px-1 py-0 bg-indigo-500 hover:bg-indigo-600 border-indigo-500 text-white font-bold">MAIN</Badge>
                </div>
            )}
        </div>
    )
}

export function GalleryEditor({ assets = [], onChange, defaultId, onSetDefault, folder = "films", accept = "image/*" }: GalleryEditorProps) {
    const [uploading, setUploading] = useState(false)
    const [editingAsset, setEditingAsset] = useState<AssetWithTags | null>(null)
    const dndId = useId()

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = assets.findIndex(i => i.id === active.id);
            const newIndex = assets.findIndex(i => i.id === over.id);
            onChange(arrayMove(assets, oldIndex, newIndex));
        }
    }



    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files
        if (!files || files.length === 0) return
        setUploading(true)

        const newAssets: AssetWithTags[] = []

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                const formData = new FormData()
                formData.append("file", file)

                const kind = file.type.startsWith("video/") ? "VIDEO" : "IMAGE"
                formData.append("kind", kind)
                formData.append("folder", folder)

                const res = await fetch("/api/admin/upload/bunny", {
                    method: "POST",
                    body: formData
                })
                if (res.ok) {
                    const data = await res.json()
                    newAssets.push(data.asset)
                } else {
                    console.error("Failed to upload", file.name)
                }
            }
            if (newAssets.length > 0) {
                onChange([...assets, ...newAssets])
            }
        } catch (err) {
            console.error(err)
            toast.error("Some uploads failed")
        } finally {
            setUploading(false)
        }
    }

    function removeAsset(id: string) {
        const prevAssets = [...assets]
        const prevDefault = defaultId

        // Optimistic update
        onChange(assets.filter(a => a.id !== id))
        if (defaultId === id && onSetDefault) {
            onSetDefault("")
        }

        toast("Image removed", {
            action: {
                label: "Undo",
                onClick: () => {
                    onChange(prevAssets)
                    if (prevDefault === id && onSetDefault) onSetDefault(id)
                }
            }
        })
    }

    return (
        <div className="space-y-4">
            <DndContext
                id={dndId}
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={assets.map(a => a.id)} strategy={rectSortingStrategy}>
                    <div className="flex flex-wrap gap-4">
                        {assets.map(asset => (
                            <SortableImage
                                key={asset.id}
                                asset={asset}
                                isDefault={asset.id === defaultId}
                                onSetDefault={onSetDefault}
                                onRemove={removeAsset}
                                onEdit={setEditingAsset}
                            />
                        ))}

                        <div className="w-32 h-32 flex-shrink-0">
                            <label className={`w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 hover:bg-gray-100 hover:border-indigo-300 transition-all cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                {uploading ? (
                                    <Loader2 size={24} className="animate-spin text-gray-400" />
                                ) : (
                                    <>
                                        <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 mb-2">
                                            <Plus size={16} strokeWidth={3} />
                                        </div>
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Add Images</span>
                                    </>
                                )}
                                <input
                                    type="file"
                                    multiple
                                    accept={accept}
                                    className="hidden"
                                    onChange={handleUpload}
                                />
                            </label>
                        </div>
                    </div>
                </SortableContext>
            </DndContext>

            <ImageDetailsDialog
                asset={editingAsset}
                open={!!editingAsset}
                onOpenChange={(open) => !open && setEditingAsset(null)}
                onSave={(updated) => {
                    onChange(assets.map(a => a.id === updated.id ? { ...a, ...updated } : a))
                }}
            />

            <p className="text-[10px] text-gray-400">
                Upload images or videos. Drag to reorder. Click star to set main item. Click pencil to edit details.
            </p>
        </div>
    )
}
