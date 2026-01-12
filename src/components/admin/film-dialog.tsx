"use client"

import { Film, FilmTranslation, MediaAsset } from "@prisma/client"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { FilmForm } from "@/components/admin/film-form"

type FilmWithRelations = Film & {
    translations: FilmTranslation[]
    heroVideo: MediaAsset | null
    media: MediaAsset[]
}

interface FilmDialogProps {
    film?: FilmWithRelations | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function FilmDialog({ film, open, onOpenChange, onSuccess }: FilmDialogProps) {
    const isNew = !film?.id

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isNew ? "Create Film" : `Edit ${film.slug}`}</DialogTitle>
                </DialogHeader>
                <FilmForm
                    film={film}
                    onSuccess={() => {
                        onSuccess?.()
                        onOpenChange(false)
                    }}
                    onCancel={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    )
}
