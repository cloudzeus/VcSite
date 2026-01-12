import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { cfHelvetica } from "@/lib/fonts";

// Remove Inter since we are switching to CF Helvetica
// const inter = Inter({ subsets: ["latin", "greek"] });

/* 
// Recommended Font Setup (Requires font files in public/fonts)
import localFont from "next/font/local"
const helvetica = localFont({
  src: [
    { path: "../public/fonts/Helvetica-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/Helvetica-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-helvetica",
  display: "swap",
})
*/

export const metadata: Metadata = {
  title: "Vangelis Nakis",
  description: "Videography and Social Awareness Films",
};

import { SlidingMenu } from "@/components/menu/sliding-menu";

import { LogoProvider } from "@/context/logo-context"

import { LangProvider } from "@/context/lang-context";
import { SmoothScroll } from "@/components/smooth-scroll";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${cfHelvetica.className} antialiased bg-black`}>
        <SmoothScroll>
          <LangProvider>
            <LogoProvider>
              <SlidingMenu />
              {children}
              <Toaster />
            </LogoProvider>
          </LangProvider>
        </SmoothScroll>
      </body>
    </html>
  )
}
