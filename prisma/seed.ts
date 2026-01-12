import { prisma } from "../src/lib/prisma"
import bcrypt from "bcryptjs"
import fs from "fs"
import path from "path"

async function uploadToBunny(filePath: string, filename: string) {
    const zone = process.env.BUNNY_STORAGE_ZONE
    const key = process.env.BUNNY_STORAGE_ACCESS_KEY
    const endpoint = process.env.BUNNY_STORAGE_ENDPOINT ?? "storage.bunnycdn.com"
    const pullUrl = process.env.BUNNY_PULL_BASE_URL

    if (!zone || !key || !pullUrl) {
        console.warn("Bunny env vars missing, using local placeholder if possible or null")
        return null
    }

    try {
        if (!fs.existsSync(filePath)) {
            console.warn(`File not found: ${filePath}`)
            return null
        }
        const fileBuffer = fs.readFileSync(filePath)
        const uploadPath = `${zone}/${filename}`

        const res = await fetch(`https://${endpoint}/${uploadPath}`, {
            method: 'PUT',
            headers: { AccessKey: key },
            body: fileBuffer as any // Node fetch body
        })

        if (!res.ok) {
            console.error("Bunny upload failed", res.statusText)
            return null
        }

        return `${pullUrl.replace(/\/$/, "")}/${filename}`
    } catch (e) {
        console.error("Upload error", e)
        return null
    }
}

async function main() {
    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD

    if (adminEmail && adminPassword) {
        const hash = await bcrypt.hash(adminPassword, 12)
        await prisma.user.upsert({
            where: { email: adminEmail },
            update: { passwordHash: hash, role: "ADMIN", name: "Admin" },
            create: { email: adminEmail, passwordHash: hash, role: "ADMIN", name: "Admin" },
        })
    }

    const person = await prisma.person.upsert({
        where: { slug: "vangelis-nakis" },
        update: {},
        create: {
            slug: "vangelis-nakis",
            socials: {
                instagram: "v.nakis98",
                website: "vnakis.org",
            },
            translations: {
                create: [
                    {
                        lang: "el",
                        displayName: "Βαγγέλης Νάκης",
                        shortBio:
                            "Δημιουργός περιεχομένου και σκηνοθέτης ταινιών μικρού μήκους με έντονο κοινωνικό μήνυμα. Ιδρυτής της ομάδας PSDM Athens.",
                        longBio:
                            "Ο Βαγγέλης Νάκης είναι Έλληνας δημιουργός περιεχομένου και σκηνοθέτης ταινιών μικρού μήκους με θεματολογία γύρω από κοινωνικά ζητήματα όπως ο σχολικός εκφοβισμός, τα δικαιώματα των ΑμΕΑ, η ισότητα και η προστασία ανηλίκων. Η δουλειά του κινείται στο όριο μεταξύ social video και κινηματογραφικής αφήγησης, με στόχο την ευαισθητοποίηση και την κινητοποίηση του κοινού.",
                    },
                    {
                        lang: "en",
                        displayName: "Vangelis Nakis",
                        shortBio: "To be translated.",
                        longBio: "To be translated.",
                    },
                ],
            },
        },
    })

    const films = [
        {
            slug: "roda-einai-kai-girizei",
            releaseDate: new Date("2020-05-29"),
            tags: ["amea", "disability", "social-message"],
            el: {
                title: "Ρόδα είναι και γυρίζει",
                logline: "Μια ιστορία επιμονής και αποδοχής για έναν έφηβο με κινητικά προβλήματα.",
                synopsis:
                    "Μικρού μήκους ταινία με κοινωνικό μήνυμα για τα δικαιώματα και την καθημερινότητα των ανθρώπων με αναπηρία.",
            },
        },
        {
            slug: "dyo-zoes",
            releaseDate: new Date("2021-01-01"),
            tags: ["health", "smile-of-the-child"],
            el: {
                title: "Δύο Ζωές",
                logline: "Ένα έργο για τη δύναμη απέναντι στην ασθένεια και την ελπίδα.",
                synopsis:
                    "Ταινία μικρού μήκους σε συνεργασία με Το Χαμόγελο του Παιδιού, με αφορμή τα 25 χρόνια του οργανισμού.",
            },
        },
        {
            slug: "o-i-to",
            releaseDate: new Date("2022-10-15"),
            tags: ["lgbtqi", "equality"],
            el: {
                title: "Ο/Η/Το",
                logline: "Μια ταινία ενάντια στην ομοφοβία και την τρανσοφοβία.",
                synopsis:
                    "Αφιερωμένη στη δύσκολη καθημερινότητα που βιώνουν ΛΟΑΤΚΙ+ άτομα σε οικογενειακό, εργασιακό και κοινωνικό περιβάλλον.",
            },
        },
        {
            slug: "oi-skepseis-tis-nefelis",
            releaseDate: new Date("2023-05-11"),
            tags: ["bullying", "teen"],
            el: {
                title: "Οι σκέψεις της Νεφέλης",
                logline: "Μια έφηβη σπάει τη σιωπή απέναντι στο bullying.",
                synopsis:
                    "Ιστορία μιας 16χρονης που βιώνει σχολικό εκφοβισμό και αποφασίζει να μιλήσει.",
            },
        },
        {
            slug: "i-nefeli-agnoeitai",
            releaseDate: new Date("2024-05-25"),
            tags: ["missing-children", "prevention"],
            el: {
                title: "Η Νεφέλη Αγνοείται",
                logline: "Μια ιστορία για τις φυγές ανηλίκων και την πρόληψη.",
                synopsis:
                    "Σενάριο βασισμένο σε πραγματικές ιστορίες εξαφάνισης ανηλίκων, σε συνεργασία με Το Χαμόγελο του Παιδιού.",
            },
        },
        {
            slug: "nefeli-apenanti-ston-fovo",
            releaseDate: new Date("2026-01-04"),
            tags: ["teen", "prevention"],
            el: {
                title: "Νεφέλη Απέναντι στον Φόβο",
                logline: "Το τελευταίο κεφάλαιο της τριλογίας της Νεφέλης.",
                synopsis:
                    "Συνέχεια της ιστορίας της Νεφέλης με στόχο την ευαισθητοποίηση γύρω από την προστασία ανηλίκων.",
            },
        },
    ] as const

    const createdFilms = []
    for (const f of films) {
        const created = await prisma.film.upsert({
            where: { slug: f.slug },
            update: {},
            create: {
                slug: f.slug,
                published: true,
                releaseDate: f.releaseDate,
                tags: f.tags as unknown as string[],
                translations: {
                    create: [
                        {
                            lang: "el",
                            title: f.el.title,
                            logline: f.el.logline,
                            synopsis: f.el.synopsis,
                        },
                        {
                            lang: "en",
                            title: "To be translated",
                            logline: "To be translated",
                            synopsis: "To be translated",
                        },
                    ],
                },
            },
        })
        createdFilms.push(created)
    }

    const press = [
        {
            kind: "NEWS" as const,
            outlet: "News 24/7",
            url: "https://www.news247.gr/ellada/roda-einai-kai-girizei-mia-tainia-mikrou-mikous-gia-tous-anthropous-me-anapiria/",
            publishedAt: new Date("2020-06-02"),
            el: {
                title: "Ρόδα είναι και γυρίζει: Μια ταινία μικρού μήκους για τους ανθρώπους με αναπηρία",
                description: "Αναφορά στην ταινία και στο μήνυμα για τα δικαιώματα των ανθρώπων με αναπηρία.",
            },
            filmSlug: "roda-einai-kai-girizei",
        },
        {
            kind: "PUBLICATION" as const,
            outlet: "Athens Voice",
            url: "https://www.athensvoice.gr/politismos/kinimatografos/651226/vaggelis-nakis-alexandros-koympria-roda-einai-kai-gyrizei/",
            publishedAt: new Date("2020-05-29"),
            el: {
                title: "Βαγγέλης Νάκης - Αλέξανδρος Κούμπρια: Ρόδα είναι και γυρίζει",
                description: "Παρουσίαση της ταινίας και της ιστορίας ενός εφήβου με κινητικά προβλήματα.",
            },
            filmSlug: "roda-einai-kai-girizei",
        },
        {
            kind: "PUBLICATION" as const,
            outlet: "Athens Voice",
            url: "https://www.athensvoice.gr/politismos/kinimatografos/696936/dyo-zoes-i-tainia-gia-ta-25-hronia-toy-hamogeloy-toy-paidioy/",
            publishedAt: new Date("2021-01-05"),
            el: {
                title: "Δύο ζωές: Η ταινία για τα 25 χρόνια του Χαμόγελου του Παιδιού",
                description: "Παρουσίαση της ταινίας και του σκοπού της για ενθάρρυνση και δύναμη.",
            },
            filmSlug: "dyo-zoes",
        },
        {
            kind: "NEWS" as const,
            outlet: "Athens Voice",
            url: "https://www.athensvoice.gr/politismos/kinimatografos/758214/transsofovias/",
            publishedAt: new Date("2022-10-09"),
            el: {
                title: "Η μικρού μήκους ταινία Ο/Η/Το κατά της ομοφοβίας και τρανσοφοβίας",
                description: "Ανακοίνωση για την κυκλοφορία και το κοινωνικό πλαίσιο της ταινίας.",
            },
            filmSlug: "o-i-to",
        },
        {
            kind: "REVIEW" as const,
            outlet: "Naftemporiki",
            url: "https://www.naftemporiki.gr/society/1470284/oi-skepseis-tis-nefelis-pos-mia-16chroni-espase-tis-alysides-toy-bullying-vinteo/",
            publishedAt: new Date("2023-05-11"),
            el: {
                title: "Οι σκέψεις της Νεφέλης: Πώς μια 16χρονη έσπασε τις αλυσίδες του bullying",
                description: "Ρεπορτάζ για την προβολή και την υπόθεση της ταινίας σχετικά με σχολικό εκφοβισμό.",
            },
            filmSlug: "oi-skepseis-tis-nefelis",
        },
        {
            kind: "NEWS" as const,
            outlet: "Το Χαμόγελο του Παιδιού",
            url: "https://www.hamogelo.gr/gr/el/ta-nea-mas/tainia-mikroy-mikoys-h-nefelh-agnoeitai/",
            el: {
                title: "Η Νεφέλη Αγνοείται: Πρώτη προβολή και ενημέρωση για τις φυγές ανηλίκων",
                description: "Ενημερωτικό κείμενο για την ταινία και το πλαίσιο πρόληψης.",
            },
            filmSlug: "i-nefeli-agnoeitai",
        },
    ] as const

    const createdPress = []
    for (const p of press) {
        const pressItem = await prisma.pressItem.create({
            data: {
                kind: p.kind,
                outlet: p.outlet,
                url: p.url,
                published: true,
                publishedAt: (p as { publishedAt?: Date }).publishedAt ?? null,
                translations: {
                    create: [
                        { lang: "el", title: p.el.title, description: p.el.description },
                        { lang: "en", title: "To be translated", description: "To be translated" },
                    ],
                },
            },
        })
        createdPress.push(pressItem)

        const film = await prisma.film.findUnique({ where: { slug: p.filmSlug } })
        if (film) {
            await prisma.pressItem.update({
                where: { id: pressItem.id },
                data: { films: { connect: { id: film.id } } },
            })
        }
    }

    // Upload Hero Assets
    console.log("Uploading Hero Assets...")
    const maskPath = path.join(process.cwd(), "public", "initialmask.svg")
    const videoPath = path.join(process.cwd(), "public", "video", "nefeli.mp4")

    const maskUrl = await uploadToBunny(maskPath, "hero/initialmask.svg")
    const videoUrl = await uploadToBunny(videoPath, "hero/nefeli.mp4")

    let maskAsset, videoAsset

    if (maskUrl) {
        maskAsset = await prisma.mediaAsset.create({
            data: { kind: "IMAGE", url: maskUrl, alt: "Hero Mask" }
        })
    }
    if (videoUrl) {
        videoAsset = await prisma.mediaAsset.create({
            data: { kind: "VIDEO", url: videoUrl, alt: "Hero Video" }
        })
    }

    // Seed HomePage
    const homeText = "VCULTURE is a leading-edge Greek video production powerhouse specializing in high-impact visual storytelling.\nWith a portfolio exceeding 10 million views, we produce content that demands attention."

    await prisma.homePage.upsert({
        where: { id: "singleton" },
        update: {},
        create: {
            id: "singleton",
            svgMaskId: maskAsset?.id,
            videoId: videoAsset?.id,
            translations: {
                create: [
                    { lang: 'el', title: 'VCULTURE', heroText: homeText },
                    { lang: 'en', title: 'VCULTURE', heroText: homeText }
                ]
            },
            featuredFilms: { connect: createdFilms.slice(0, 4).map(f => ({ id: f.id })) },
            featuredPress: { connect: createdPress.slice(0, 6).map(p => ({ id: p.id })) }
        }
    })

    await prisma.siteSettings.upsert({
        where: { id: "singleton" },
        update: {},
        create: { id: "singleton" },
    })

    console.log("Seed complete", { personId: person.id })
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
