'use client'

import { Command } from "cmdk"
import { useRouter } from "next/navigation"

interface Props {
  label: string
  path: string
}

export default function CommandItem({ label, path }: Props) {

  const router = useRouter()

  return (

    <Command.Item
      onSelect={() => router.push(path)}
      className="px-3 py-2 cursor-pointer rounded hover:bg-muted"
    >
      {label}
    </Command.Item>

  )
}