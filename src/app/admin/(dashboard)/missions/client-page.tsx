"use client"

import { useState } from "react"
import { MissionStatement, MissionStatementTranslation } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, GripVertical, Edit, Calendar } from "lucide-react"
import { MissionDialog } from "@/components/admin/mission-dialog"
import { updateMissionOrder, updateMissionTitle } from "@/app/actions/missions"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type MissionWithRelations = MissionStatement & {
    translations: MissionStatementTranslation[]
}

interface MissionsClientPageProps {
    initialMissions: MissionWithRelations[]
}

function SortableMissionRow({ mission, onEdit }: { mission: MissionWithRelations, onEdit: () => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: mission.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    const tEl = mission.translations.find(t => t.lang === 'el')
    const [title, setTitle] = useState(tEl?.title || "")
    const [isEditingTitle, setIsEditingTitle] = useState(false)

    async function saveTitle() {
        if (title !== tEl?.title) {
            await updateMissionTitle(mission.id, title)
        }
        setIsEditingTitle(false)
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-indigo-200 hover:shadow-sm transition-all group"
        >
            <button
                type="button"
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 p-1"
            >
                <GripVertical className="h-4 w-4" />
            </button>

            <div className="flex-1 flex items-center gap-3">
                {isEditingTitle ? (
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={saveTitle}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') saveTitle()
                            if (e.key === 'Escape') {
                                setTitle(tEl?.title || "")
                                setIsEditingTitle(false)
                            }
                        }}
                        autoFocus
                        className="text-[11px] h-7 font-medium"
                    />
                ) : (
                    <div
                        className="flex-1 cursor-pointer"
                        onClick={() => setIsEditingTitle(true)}
                    >
                        <div className="font-medium text-sm text-gray-900">{title}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{mission.slug}</div>
                    </div>
                )}

                {mission.publishedDate && (
                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {new Date(mission.publishedDate).toLocaleDateString()}
                    </div>
                )}

                <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${mission.published ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {mission.published ? 'Published' : 'Draft'}
                </div>
            </div>

            <Button
                size="sm"
                variant="ghost"
                onClick={onEdit}
                className="h-7 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <Edit className="h-3 w-3 mr-1" />
                Edit
            </Button>
        </div>
    )
}

export function MissionsClientPage({ initialMissions }: MissionsClientPageProps) {
    const [missions, setMissions] = useState(initialMissions)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingMission, setEditingMission] = useState<MissionWithRelations | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event

        if (over && active.id !== over.id) {
            setMissions((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id)
                const newIndex = items.findIndex(i => i.id === over.id)
                const newOrder = arrayMove(items, oldIndex, newIndex)

                // Update order in database
                updateMissionOrder(newOrder.map((item, idx) => ({ id: item.id, order: idx })))

                return newOrder
            })
        }
    }

    function openCreateDialog() {
        setEditingMission(null)
        setDialogOpen(true)
    }

    function openEditDialog(mission: MissionWithRelations) {
        setEditingMission(mission)
        setDialogOpen(true)
    }

    function handleSuccess() {
        window.location.reload()
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mission Statements</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your mission statements with AI-powered phrases and mottos</p>
                </div>
                <Button onClick={openCreateDialog} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200">
                    <Plus className="mr-2 h-4 w-4" />
                    New Mission
                </Button>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={missions.map(m => m.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-2">
                            {missions.map((mission) => (
                                <SortableMissionRow
                                    key={mission.id}
                                    mission={mission}
                                    onEdit={() => openEditDialog(mission)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>

                {missions.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <p className="text-sm">No mission statements yet</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={openCreateDialog}
                            className="mt-4"
                        >
                            <Plus className="mr-2 h-3 w-3" />
                            Create your first mission
                        </Button>
                    </div>
                )}
            </div>

            <MissionDialog
                mission={editingMission}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSuccess={handleSuccess}
            />
        </div>
    )
}
