'use client'

import { CRMDocument, formatFileSize } from "./document-utils"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import {
  Download,
  Trash2,
  FileText
} from "lucide-react"

interface Props {

  document: CRMDocument
  onDelete: (id: string) => void

}

export default function DocumentItem({

  document,
  onDelete

}: Props) {

  return (

    <Card className="p-3 flex items-center justify-between">

      <div className="flex items-center gap-3">

        <FileText className="w-5 h-5 text-primary" />

        <div>

          <p className="text-sm font-medium">
            {document.name}
          </p>

          <p className="text-xs text-muted-foreground">

            {document.type} • {formatFileSize(document.size)}

          </p>

        </div>

      </div>

      <div className="flex gap-2">

        <a
          href={document.url}
          download
        >

          <Button
            size="icon"
            variant="outline"
          >

            <Download className="w-4 h-4" />

          </Button>

        </a>

        <Button
          size="icon"
          variant="destructive"
          onClick={() => onDelete(document.id)}
        >

          <Trash2 className="w-4 h-4" />

        </Button>

      </div>

    </Card>

  )

}