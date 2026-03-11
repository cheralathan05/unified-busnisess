'use client'

import { useState } from "react"
import { Menu } from "lucide-react"

import Sidebar from "@/components/sidebar/sidebar"
import Navbar from "@/components/navbar/navbar"

import CommandPalette from "@/components/command/command-palette"
import { CommandProvider } from "@/components/command/command-provider"

import { cn } from "@/lib/utils"

interface Props {
  children: React.ReactNode
}

export default function AppShell({ children }: Props) {

  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (

    <CommandProvider>

      <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">

        {/* Sidebar */}

        <Sidebar
          open={sidebarOpen}
          setOpen={setSidebarOpen}
        />

        {/* Main Layout */}

        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Top Navbar */}

          <Navbar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />

          {/* Page Content */}

          <main
            className={cn(
              "flex-1 overflow-y-auto p-6 md:p-8 transition-all",
              sidebarOpen ? "ml-0" : "ml-0"
            )}
          >

            {children}

          </main>

        </div>

      </div>

      {/* Global Command Palette */}

      <CommandPalette />

    </CommandProvider>

  )

}