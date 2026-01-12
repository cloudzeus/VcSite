"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, GripVertical } from "lucide-react"
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

interface Credit {
    id: string
    role: string
    name: string
}

interface CreditsEditorProps {
    initialCredits?: Credit[] | Record<string, string>
    onChange?: (credits: Credit[]) => void
    name: string
}

function SortableItem(props: { id: string, credit: Credit, onUpdate: (id: string, field: 'role' | 'name', val: string) => void, onRemove: (id: string) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: props.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex gap-2 items-center mb-2 bg-white p-2 rounded border">
            <button type="button" {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600">
                <GripVertical size={16} />
            </button>
            <Input
                placeholder="Role (e.g. Director)"
                value={props.credit.role}
                onChange={(e) => props.onUpdate(props.id, 'role', e.target.value)}
                className="flex-1"
            />
            <Input
                placeholder="Name"
                value={props.credit.name}
                onChange={(e) => props.onUpdate(props.id, 'name', e.target.value)}
                className="flex-1"
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => props.onRemove(props.id)} className="text-red-500 hover:text-red-700">
                <Trash2 size={16} />
            </Button>
        </div>
    )
}

export function CreditsEditor({ initialCredits, name }: CreditsEditorProps) {
    // Parse initial credits into the proper format with IDs
    const parseInitialCredits = (initial?: Credit[] | Record<string, string>): Credit[] => {
        let parsed: Array<{ role: string; name: string }> = []
        if (Array.isArray(initial)) {
            parsed = initial
        } else if (typeof initial === 'object' && initial !== null) {
            // Handle legacy object format { "Director": "Name" } if exists, convert to array
            parsed = Object.entries(initial).map(([role, name]) => ({ role, name }))
        }
        return parsed.map((p, i) => ({
            id: `credit-${i}-${Date.now()}`,
            role: p.role || "",
            name: p.name || ""
        }))
    }

    // Ensure we have a stable ID for each item for DnD
    const [items, setItems] = useState<Credit[]>(() => parseInitialCredits(initialCredits))

    // Sync back to hidden input
    const value = JSON.stringify(items.map(({ role, name }) => ({ role, name }))) // strip IDs

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
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    }

    const updateItem = (id: string, field: 'role' | 'name', val: string) => {
        setItems(items.map(i => i.id === id ? { ...i, [field]: val } : i))
    }

    const removeItem = (id: string) => {
        setItems(items.filter(i => i.id !== id))
    }

    const addItem = () => {
        setItems([...items, { id: `new-${Date.now()}`, role: "", name: "" }])
    }

    return (
        <div className="space-y-2">
            <input type="hidden" name={name} value={value} />

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={items.map(i => i.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {items.map(item => (
                        <SortableItem
                            key={item.id}
                            id={item.id}
                            credit={item}
                            onUpdate={updateItem}
                            onRemove={removeItem}
                        />
                    ))}
                </SortableContext>
            </DndContext>

            <Button type="button" variant="outline" size="sm" onClick={addItem} className="w-full">
                <Plus size={14} className="mr-2" /> Add Credit
            </Button>
        </div>
    )
}
