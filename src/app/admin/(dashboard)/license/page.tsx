import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ShieldCheck, User, Building2, Calendar, FileText, Lock } from "lucide-react"

export default async function LicensePage() {
    const session = await auth()

    if (session?.user?.role !== "ADMIN") {
        redirect("/admin")
    }

    const licenseInfo = {
        serial: process.env.LICENSE_SERIAL,
        owner: {
            name: process.env.LICENSE_OWNER_NAME,
            vat: process.env.LICENSE_OWNER_VAT,
        },
        vendor: {
            name: process.env.LICENSE_VENDOR_NAME,
            vat: process.env.LICENSE_VENDOR_VAT,
        },
        validity: process.env.LICENSE_VALIDITY_DATE,
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto p-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                        License Information
                    </h1>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Software Usage Rights & Compliance</p>
                </div>
                <Badge variant="outline" className="px-4 py-1.5 text-xs font-bold uppercase tracking-widest border-green-200 bg-green-50 text-green-700">
                    <ShieldCheck className="w-3 h-3 mr-2" />
                    Active License
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* License Details Card */}
                <Card className="border-none shadow-xl bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm overflow-hidden ring-1 ring-gray-100">
                    <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Lock className="w-5 h-5 text-indigo-500" />
                            License Details
                        </CardTitle>
                        <CardDescription>Serial Number & Validity</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100/50">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1 block">Software License Serial</label>
                            <div className="font-mono text-lg font-bold text-gray-700 tracking-wider">
                                {licenseInfo.serial}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1 block flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> License Validity Date
                            </label>
                            <div className="text-sm font-semibold text-gray-700">
                                {licenseInfo.validity}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Parties Involved */}
                <Card className="border-none shadow-xl bg-white ring-1 ring-gray-100">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <User className="w-5 h-5 text-purple-500" />
                            Registered Parties
                        </CardTitle>
                        <CardDescription>Licensee & Licensor Information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="group">
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary" className="text-[10px] bg-indigo-50 text-indigo-600 hover:bg-indigo-100">Licensee</Badge>
                            </div>
                            <div className="pl-2 border-l-2 border-indigo-100 ml-1">
                                <div className="font-bold text-gray-800">{licenseInfo.owner.name}</div>
                                <div className="text-xs text-gray-500 font-mono mt-0.5">VAT: {licenseInfo.owner.vat}</div>
                            </div>
                        </div>

                        <Separator className="bg-gray-100" />

                        <div className="group">
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary" className="text-[10px] bg-purple-50 text-purple-600 hover:bg-purple-100">Licensor / Vendor</Badge>
                            </div>
                            <div className="pl-2 border-l-2 border-purple-100 ml-1">
                                <div className="font-bold text-gray-800">{licenseInfo.vendor.name}</div>
                                <div className="text-xs text-gray-500 font-mono mt-0.5">VAT: {licenseInfo.vendor.vat}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* EULA & Privacy Policy */}
            <Card className="border-none shadow-lg bg-white ring-1 ring-gray-100">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <FileText className="w-5 h-5 text-gray-500" />
                        Legal Agreements
                    </CardTitle>
                    <CardDescription>End User License Agreement & Privacy Considerations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="prose prose-sm prose-gray max-w-none">
                        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-800">End User License Agreement (EULA)</h3>
                        <p className="text-xs text-gray-500 mb-4">
                            This End User License Agreement (&quot;Agreement&quot;) is a legal agreement between you (&quot;Licensee&quot;) and {licenseInfo.vendor.name} (&quot;Licensor&quot;) for the software product accompanying this Agreement.
                        </p>

                        <div className="space-y-4 text-xs text-gray-600 bg-gray-50/50 p-6 rounded-lg border border-gray-100">
                            <div>
                                <strong className="text-gray-900 block mb-1">1. Grant of License</strong>
                                Subject to the terms of this Agreement, Licensor grants to Licensee a non-exclusive, non-transferable license to use the Software for internal business purposes only.
                            </div>
                            <div>
                                <strong className="text-gray-900 block mb-1">2. Restrictions</strong>
                                You may not reverse engineer, decompile, or disassemble the Software. You may not rent, lease, or lend the Software.
                            </div>
                            <div>
                                <strong className="text-gray-900 block mb-1">3. Termination</strong>
                                This license is effective until terminated. Your rights under this license will terminate automatically without notice from Licensor if you fail to comply with any term of this Agreement.
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-gray-100" />

                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-800 mb-2">Privacy Policy & GDPR Compliance</h3>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            This software is designed to be compliant with the General Data Protection Regulation (GDPR). All personal data processed by the software is handled in accordance with strict privacy standards. The Licensee is responsible for ensuring that their use of the software complies with applicable data protection laws.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
