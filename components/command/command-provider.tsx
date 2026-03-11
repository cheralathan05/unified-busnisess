'use client'

import { useEffect } from "react"
import { useCommand } from "./use-command"

export function CommandProvider({ children }: { children: React.ReactNode }) {

  const toggle = useCommand((s) => s.toggle)

  useEffect(() => {

    const down = (e: KeyboardEvent) => {

      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggle()
      }

    }

    document.addEventListener("keydown", down)

    return () => document.removeEventListener("keydown", down)

  }, [toggle])

  return <>{children}</>

}