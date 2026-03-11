'use client'

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Upload } from "lucide-react"

import { CRMDocument } from "./document-utils"

interface Props {

  leadId: string
  onUpload: (doc: CRMDocument) => void

}

export default function DocumentUpload({

  leadId,
  onUpload

}: Props) {

  const [file, setFile] =
    useState<File | null>(null)

  const [type, setType] =
    useState<CRMDocument["type"]>("proposal")

  function handleUpload() {

    if (!file) return

    const doc: CRMDocument = {

      id: Date.now().toString(),
      leadId,
      name: file.name,
      size: file.size,
      type,
      url: URL.createObjectURL(file),
      createdAt: new Date()

    }

    onUpload(doc)

    setFile(null)

  }

  return (

    <div className="flex gap-2 items-center">

      <Input
        type="file"
        onChange={(e) =>
          setFile(e.target.files?.[0] || null)
        }
      />

      <Button
        onClick={handleUpload}
        className="gap-2"
      >

        <Upload className="w-4 h-4" />

        Upload

      </Button>

    </div>

  )

}