"use client"

import { PressItem, PressItemTranslation, MediaAsset } from "@prisma/client"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { PressForm } from "@/components/admin/press-form"

type PressWithRelations = PressItem & {
    translations: PressItemTranslation[]
    image: MediaAsset | null
    films: { id: string }[]
}

interface PressDialogProps {
    item?: PressWithRelations | null
    films: { id: string, slug: string }[]
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function PressDialog({ item, films, open, onOpenChange, onSuccess }: PressDialogProps) {
    const isNew = !item?.id

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isNew ? "Add Press Item" : `Edit ${item.outlet}`}</DialogTitle>
                </DialogHeader>
                <PressForm
                    item={item}
                    films={films}
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
