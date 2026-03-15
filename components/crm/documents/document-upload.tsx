'use client'

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Upload } from "lucide-react"

import { CRMDocument } from "./document-utils"

import { uploadDocument } from "@/lib/services/document.service"

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

  const [loading, setLoading] =
    useState(false)

  async function handleUpload() {

    if (!file) return

    try {

      setLoading(true)

      const formData = new FormData()

      formData.append("file", file)
      formData.append("leadId", leadId)

      const res = await uploadDocument(formData)

      onUpload(res.data)

      setFile(null)

    } catch (error) {

      console.error("Upload failed", error)

    } finally {

      setLoading(false)

    }

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
        disabled={!file || loading}
        className="gap-2"
      >

        <Upload className="w-4 h-4" />

        {loading ? "Uploading..." : "Upload"}

      </Button>

    </div>

  )

}