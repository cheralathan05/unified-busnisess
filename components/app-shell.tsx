'use client'

import React, { useState } from "react"

import { AppSidebar } from "./sidebar/app-sidebar"
import { TopNavbar } from "./navbar/top-navbar"

import { Toaster } from "@/components/ui/toaster"

import { AIAssistant } from "./ai/ai-assistant"

import CommandPalette from "@/components/command/command-palette"
import { CommandProvider } from "@/components/command/command-provider"

export function AppShell({ children }: { children: React.ReactNode }) {

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showAI, setShowAI] = useState(false)

  return (

    <CommandProvider>

      <div className="flex h-screen w-full bg-[#0a0a0b] text-white overflow-hidden">

        {/* Sidebar */}

        <aside
          className={`border-r border-white/10 bg-[#0f0f12] transition-all duration-300 flex-shrink-0
          ${sidebarOpen ? "w-64" : "w-20"}`}
        >

          <AppSidebar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />

        </aside>


        {/* Main Layout */}

        <div className="flex flex-1 flex-col overflow-hidden">

          {/* Navbar */}

          <TopNavbar
            onOpenAI={() => setShowAI(true)}
            sidebarOpen={sidebarOpen}
            onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          />

          {/* Page Content */}

          <main className="flex-1 overflow-y-auto bg-[#0a0a0b]">

            <div className="mx-auto max-w-7xl px-6 py-8">

              {children}

            </div>

          </main>

        </div>


        {/* AI Assistant */}

        {showAI && (

          <AIAssistant
            onClose={() => setShowAI(false)}
          />

        )}


        {/* Command Palette */}

        <CommandPalette />


        {/* Toast Notifications */}

        <Toaster />

      </div>

    </CommandProvider>

  )

}