'use client'

import { Command } from "cmdk"
import { Dialog } from "@/components/ui/dialog"
import { useCommand } from "./use-command"
import CommandItem from "./command-item"

export default function CommandPalette() {

  const open = useCommand((s) => s.open)
  const setOpen = useCommand((s) => s.setOpen)

  return (

    <Dialog open={open} onOpenChange={setOpen}>

      <Command className="bg-background rounded-xl shadow-xl">

        <Command.Input
          placeholder="Search commands..."
          className="w-full px-4 py-3 outline-none"
        />

        <Command.List>

          <Command.Group heading="Navigation">

            <CommandItem label="Dashboard" path="/dashboard" />
            <CommandItem label="CRM Leads" path="/crm" />
            <CommandItem label="Tasks" path="/tasks" />
            <CommandItem label="Payments" path="/payments" />

          </Command.Group>

          <Command.Group heading="Actions">

            <CommandItem label="Create Lead" path="/crm/add-lead" />
            <CommandItem label="Create Task" path="/tasks" />

          </Command.Group>

        </Command.List>

      </Command>

    </Dialog>

  )
}