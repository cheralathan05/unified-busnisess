import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"

import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"

const inter = Inter({
  subsets: ["latin"],
  weight: ["400","500","600","700"],
})

export const metadata: Metadata = {
  title: "Digital Business Brain",
  description: "Enterprise CRM platform for modern businesses",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0b",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (

    <html lang="en">

      <body
        className={`${inter.className} bg-[#0a0a0b] text-white antialiased`}
      >

        <AuthProvider>

          <div className="flex min-h-screen w-full">

            {/* Sidebar can go here later */}

            <main className="flex-1 overflow-y-auto">

              {children}

            </main>

          </div>

        </AuthProvider>

      </body>

    </html>

  )

}