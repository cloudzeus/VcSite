import Link from "next/link"
import { LogoutButton } from "./logout-button"
import { LayoutDashboard, Film, Newspaper, Settings, ExternalLink, Target, Home, ShieldCheck } from "lucide-react"
import { auth } from "@/auth"

export async function Sidebar() {
    const session = await auth()
    const role = session?.user?.role
    return (
        <div className="w-64 bg-white/80 backdrop-blur-md border-r border-gray-100 h-screen fixed left-0 top-0 flex flex-col overflow-y-auto z-50 shadow-sm">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <div className="font-extrabold text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                    CMS
                </div>
                <div className="text-[10px] text-gray-400 font-medium tracking-widest uppercase mt-1">Management</div>
            </div>

            <nav className="flex-1 p-4 flex flex-col gap-1">
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2 mt-2">Content</div>

                <Link href="/admin" className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg group transition-all text-gray-600 hover:text-indigo-600">
                    <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-500 group-hover:bg-indigo-100 transition-colors">
                        <LayoutDashboard size={14} />
                    </div>
                    <span className="text-[11px] font-bold tracking-wide uppercase">Dashboard</span>
                </Link>

                <Link href="/admin/home" className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg group transition-all text-gray-600 hover:text-blue-600">
                    <div className="p-1.5 rounded-md bg-blue-50 text-blue-500 group-hover:bg-blue-100 transition-colors">
                        <Home size={14} />
                    </div>
                    <span className="text-[11px] font-bold tracking-wide uppercase">Home Page</span>
                </Link>

                <Link href="/admin/films" className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg group transition-all text-gray-600 hover:text-purple-600">
                    <div className="p-1.5 rounded-md bg-purple-50 text-purple-500 group-hover:bg-purple-100 transition-colors">
                        <Film size={14} />
                    </div>
                    <span className="text-[11px] font-bold tracking-wide uppercase">Films</span>
                </Link>

                <Link href="/admin/press" className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg group transition-all text-gray-600 hover:text-emerald-600">
                    <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-500 group-hover:bg-emerald-100 transition-colors">
                        <Newspaper size={14} />
                    </div>
                    <span className="text-[11px] font-bold tracking-wide uppercase">Press</span>
                </Link>

                <Link href="/admin/missions" className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg group transition-all text-gray-600 hover:text-orange-600">
                    <div className="p-1.5 rounded-md bg-orange-50 text-orange-500 group-hover:bg-orange-100 transition-colors">
                        <Target size={14} />
                    </div>
                    <span className="text-[11px] font-bold tracking-wide uppercase">Missions</span>
                </Link>

                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2 mt-6">System</div>

                <Link href="/admin/settings" className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg group transition-all text-gray-600 hover:text-gray-900">
                    <div className="p-1.5 rounded-md bg-gray-100 text-gray-500 group-hover:bg-gray-200 transition-colors">
                        <Settings size={14} />
                    </div>
                    <span className="text-[11px] font-bold tracking-wide uppercase">Settings</span>
                </Link>

                {role === "ADMIN" && (
                    <Link href="/admin/license" className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg group transition-all text-gray-600 hover:text-amber-600">
                        <div className="p-1.5 rounded-md bg-amber-50 text-amber-500 group-hover:bg-amber-100 transition-colors">
                            <ShieldCheck size={14} />
                        </div>
                        <span className="text-[11px] font-bold tracking-wide uppercase">License</span>
                    </Link>
                )}
            </nav>

            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                <a href="/" target="_blank" className="flex items-center gap-2 px-3 py-2 mb-2 text-[10px] uppercase font-bold text-gray-400 hover:text-indigo-600 transition-colors">
                    <ExternalLink size={12} /> View Live Site
                </a>
                <LogoutButton />
            </div>
        </div>
    )
}
