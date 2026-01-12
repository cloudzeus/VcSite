import { getSettings } from "@/app/actions/settings"
import { SettingsForm } from "@/components/admin/settings-form"

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
    const settings = await getSettings()

    return (
        <div className="w-[95%] mx-auto space-y-6 pb-20">
            <div className="flex justify-between items-center py-6">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Site Settings</h1>
            </div>

            <SettingsForm settings={settings} />
        </div>
    )
}
