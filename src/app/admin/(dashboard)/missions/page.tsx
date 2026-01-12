import { prisma } from "@/lib/prisma"
import { MissionsClientPage } from "./client-page"

export default async function MissionsPage() {
    const missions = await prisma.missionStatement.findMany({
        include: {
            translations: true
        },
        orderBy: { order: 'asc' }
    })

    return <MissionsClientPage initialMissions={missions} />
}
