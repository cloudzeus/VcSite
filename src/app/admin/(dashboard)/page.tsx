import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Film, FilmTranslation, MediaAsset, PressItem, PressItemTranslation } from "@prisma/client"
import { Newspaper, Film as FilmIcon } from "lucide-react"

export const dynamic = 'force-dynamic'

interface DashboardItem {
    id: string
    type: 'FILM' | 'PRESS'
    title: string
    updatedAt: Date
    published: boolean
    image: string | null
    slug?: string
    outlet?: string
}

async function getRecentActivity(): Promise<DashboardItem[]> {
    const films = await prisma.film.findMany({
        take: 10,
        orderBy: { updatedAt: 'desc' },
        include: { translations: true, heroVideo: true }
    })

    const press = await prisma.pressItem.findMany({
        take: 10,
        orderBy: { updatedAt: 'desc' },
        include: { translations: true, image: true }
    })

    const filmItems: DashboardItem[] = films.map(f => ({
        id: f.id,
        type: 'FILM',
        title: f.translations.find(t => t.lang === 'el')?.title || 'Untitled',
        updatedAt: f.updatedAt,
        published: f.published,
        image: f.heroVideo?.kind === 'IMAGE' ? f.heroVideo.url : null, // Videos might need thumbnail logic
        slug: f.slug
    }))

    const pressItems: DashboardItem[] = press.map(p => ({
        id: p.id,
        type: 'PRESS',
        title: p.outlet ? `${p.outlet} - ${p.translations.find(t => t.lang === 'el')?.title || 'Untitled'}` : (p.translations.find(t => t.lang === 'el')?.title || 'Untitled'),
        updatedAt: p.updatedAt,
        published: p.published,
        image: p.image?.url || null,
        outlet: p.outlet || undefined
    }))

    return [...filmItems, ...pressItems].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 10)
}

export default async function AdminDashboard() {
    const items = await getRecentActivity()

    return (
        <div className="w-[95%] mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-[11px] text-gray-400 mt-1 uppercase tracking-widest font-medium">Recent Activity</p>
            </div>

            <div className="bg-white/80 backdrop-blur rounded-xl border border-white/20 shadow-sm overflow-hidden">
                <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50/50 border-b border-gray-100 font-semibold text-[10px] text-gray-400 uppercase tracking-widest">
                    <div className="col-span-1">Type</div>
                    <div className="col-span-1">Thumbnail</div>
                    <div className="col-span-6">Title / Details</div>
                    <div className="col-span-2">Last Updated</div>
                    <div className="col-span-2 text-right">Status</div>
                </div>

                <div className="divide-y divide-gray-100">
                    {items.map(item => (
                        <div key={`${item.type}-${item.id}`} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50/50 transition-colors">
                            <div className="col-span-1">
                                {item.type === 'FILM' ? (
                                    <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-100 text-[9px] px-2 py-0.5">FILM</Badge>
                                ) : (
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[9px] px-2 py-0.5">PRESS</Badge>
                                )}
                            </div>
                            <div className="col-span-1">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden ${item.type === 'FILM' ? 'bg-indigo-50 text-indigo-400' : 'bg-emerald-50 text-emerald-400'}`}>
                                    {item.image ? (
                                        <img src={item.image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        item.type === 'FILM' ? <FilmIcon size={14} /> : <Newspaper size={14} />
                                    )}
                                </div>
                            </div>
                            <div className="col-span-6">
                                <span className="font-medium text-[11px] text-gray-900">{item.title}</span>
                                {item.slug && <span className="ml-2 text-[10px] text-gray-400 px-1.5 py-0.5 rounded bg-gray-100">{item.slug}</span>}
                            </div>
                            <div className="col-span-2 text-[10px] text-gray-500">
                                {item.updatedAt.toLocaleDateString('el-GR')} <span className="text-gray-300 mx-1">•</span> {item.updatedAt.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="col-span-2 text-right">
                                {item.published ? (
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </span>
                                        <span className="text-[9px] font-medium text-green-600">LIVE</span>
                                    </span>
                                ) : (
                                    <span className="text-[9px] font-medium text-gray-400">DRAFT</span>
                                )}
                            </div>
                        </div>
                    ))}
                    {items.length === 0 && (
                        <div className="p-12 text-center text-gray-400 text-sm">No activity yet.</div>
                    )}
                </div>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-6">
                {/* Quick Stats or shortcuts could go here via server components */}
                <div className="bg-white/80 p-6 rounded-xl border border-white/20 shadow-sm">
                    <h3 className="text-indigo-500 font-bold uppercase text-[10px] tracking-widest mb-1">Total Films</h3>
                    <p className="text-3xl font-bold text-gray-800">{(await prisma.film.count())}</p>
                </div>
                <div className="bg-white/80 p-6 rounded-xl border border-white/20 shadow-sm">
                    <h3 className="text-emerald-500 font-bold uppercase text-[10px] tracking-widest mb-1">Press Items</h3>
                    <p className="text-3xl font-bold text-gray-800">{(await prisma.pressItem.count())}</p>
                </div>
                <div className="bg-white/80 p-6 rounded-xl border border-white/20 shadow-sm">
                    <h3 className="text-blue-500 font-bold uppercase text-[10px] tracking-widest mb-1">Admin Users</h3>
                    <p className="text-3xl font-bold text-gray-800">{(await prisma.user.count({ where: { role: 'ADMIN' } }))}</p>
                </div>
            </div>
        </div>
    )
}
