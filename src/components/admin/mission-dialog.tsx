"use client"

import { MissionStatement, MissionStatementTranslation } from "@prisma/client"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { MissionForm } from "@/components/admin/mission-form"

type MissionWithRelations = MissionStatement & {
    translations: MissionStatementTranslation[]
}

interface MissionDialogProps {
    mission?: MissionWithRelations | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function MissionDialog({ mission, open, onOpenChange, onSuccess }: MissionDialogProps) {
    const isNew = !mission?.id

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:w-[90vw] sm:max-w-none lg:w-[80vw] max-w-[1600px] h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isNew ? "Create Mission Statement" : `Edit ${mission.slug}`}</DialogTitle>
                </DialogHeader>
                <MissionForm
                    mission={mission}
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
