import { Sidebar } from "../sidebar"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin", "greek"] })

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className={`min-h-screen bg-gray-50 ${inter.className}`}>
            <Sidebar />
            <div className="pl-64">
                <main className="w-full">
                    {children}
                </main>
            </div>
        </div>
    )
}
