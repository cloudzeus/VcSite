import { HeroMask } from "@/components/home/hero-mask"
import { CardsSection } from "@/components/home/cards-section"
import { PressSection } from "@/components/home/press-section"
import { FinalSection } from "@/components/home/final-section"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

// Force dynamic since we fetch from DB and usage of cookies
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const cookieStore = await cookies()
  const lang = cookieStore.get('NEXT_LOCALE')?.value === 'en' ? 'en' : 'el'

  const home = await prisma.homePage.findUnique({
    where: { id: 'singleton' },
    include: {
      svgMask: true,
      video: true,
      translations: true,
      featuredFilms: {
        include: {
          heroVideo: true,
          translations: true,
          media: true
        }
      },
      featuredPress: {
        include: {
          translations: true
        }
      }
    }
  })

  // Pick translation based on cookie
  const trans = home?.translations.find(t => t.lang === lang) || home?.translations.find(t => t.lang === 'el') || home?.translations[0]

  return (
    <main className="bg-black">
      <HeroMask
        videoUrl={home?.video?.url}
        maskUrl={home?.svgMask?.url}
        text={trans?.heroText}
      />
      <CardsSection films={home?.featuredFilms} />
      <PressSection items={home?.featuredPress} />
      <FinalSection />
    </main>
  )
}
