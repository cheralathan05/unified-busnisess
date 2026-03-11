'use client'

import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

export type LeadPriority =
  | "Low"
  | "Medium"
  | "High"
  | "Urgent"

interface Props {
  value?: LeadPriority
  onChange: (priority: LeadPriority) => void
}

const priorityColors: Record<LeadPriority,string> = {

  Low: "bg-blue-500/10 text-blue-400 border border-blue-500/30",

  Medium: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30",

  High: "bg-orange-500/10 text-orange-400 border border-orange-500/30",

  Urgent: "bg-red-500/10 text-red-400 border border-red-500/30"

}

export default function LeadPriority({

  value = "Medium",
  onChange

}: Props) {

  return (

    <div className="flex items-center gap-3">

      <Badge className={priorityColors[value]}>
        {value}
      </Badge>

      <Select
        value={value}
        onValueChange={(v)=>onChange(v as LeadPriority)}
      >

        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Priority"/>
        </SelectTrigger>

        <SelectContent>

          <SelectItem value="Low">
            Low
          </SelectItem>

          <SelectItem value="Medium">
            Medium
          </SelectItem>

          <SelectItem value="High">
            High
          </SelectItem>

          <SelectItem value="Urgent">
            Urgent
          </SelectItem>

        </SelectContent>

      </Select>

    </div>

  )

}