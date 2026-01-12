"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Pencil } from "lucide-react"

interface InlineEditProps {
    value: string
    onSave: (val: string) => Promise<void>
    className?: string
}

export function InlineEdit({ value: initialValue, onSave, className }: InlineEditProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [value, setValue] = useState(initialValue)
    const [isSaving, setIsSaving] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        setValue(initialValue)
    }, [initialValue])

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isEditing])

    async function handleSave() {
        if (value === initialValue) {
            setIsEditing(false)
            return
        }
        setIsSaving(true)
        try {
            await onSave(value)
        } catch (e) {
            console.error(e)
            // Revert on error?
        } finally {
            setIsSaving(false)
            setIsEditing(false)
        }
    }

    if (isEditing) {
        return (
            <Input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave()
                    if (e.key === "Escape") {
                        setValue(initialValue)
                        setIsEditing(false)
                    }
                }}
                disabled={isSaving}
                className={`h-6 px-2 py-0 ${className}`}
            />
        )
    }

    return (
        <div
            className={`group flex items-center gap-1.5 cursor-pointer max-w-full ${className}`}
            onClick={(e) => {
                e.stopPropagation()
                setIsEditing(true)
            }}
            title="Click to edit"
        >
            <span className="truncate">{value}</span>
            <Pencil size={10} className="opacity-0 group-hover:opacity-40 text-gray-400 shrink-0" />
        </div>
    )
}
