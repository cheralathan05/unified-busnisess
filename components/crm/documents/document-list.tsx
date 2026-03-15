'use client'

import { useEffect, useState } from "react"

import DocumentItem from "./document-item"

import { CRMDocument } from "./document-utils"

import { Card } from "@/components/ui/card"

import {
  getDocuments,
  deleteDocument
} from "@/lib/services/document.service"

interface Props {

  leadId: string

}

export default function DocumentList({

  leadId

}: Props) {

  const [documents, setDocuments] =
    useState<CRMDocument[]>([])

  const [loading, setLoading] =
    useState(true)

  async function loadDocuments() {

    try {

      const res = await getDocuments(leadId)

      setDocuments(res.data || [])

    } catch (error) {

      console.error("Load documents failed", error)

    } finally {

      setLoading(false)

    }

  }

  async function handleDelete(id: string) {

    try {

      await deleteDocument(id)

      setDocuments(prev =>
        prev.filter(d => d.id !== id)
      )

    } catch (error) {

      console.error("Delete failed", error)

    }

  }

  useEffect(() => {

    loadDocuments()

  }, [leadId])

  if (loading)

    return (

      <Card className="p-6 text-center">

        <p className="text-muted-foreground">

          Loading documents...

        </p>

      </Card>

    )

  if (documents.length === 0)

    return (

      <Card className="p-6 text-center">

        <p className="text-muted-foreground">

          No documents uploaded

        </p>

      </Card>

    )

  return (

    <div className="space-y-2">

      {documents.map((doc) => (

        <DocumentItem

          key={doc.id}
          document={doc}
          onDeleted={handleDelete}

        />

      ))}

    </div>

  )

}