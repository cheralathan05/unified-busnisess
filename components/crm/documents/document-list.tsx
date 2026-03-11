'use client'

import { useState } from "react"

import DocumentItem from "./document-item"
import { CRMDocument } from "./document-utils"

import { Card } from "@/components/ui/card"

interface Props {

  leadId: string

}

export default function DocumentList({

  leadId

}: Props) {

  const [documents, setDocuments] =
    useState<CRMDocument[]>([])

  function deleteDocument(id: string) {

    setDocuments(
      documents.filter(d => d.id !== id)
    )

  }

  const leadDocs =
    documents.filter(d => d.leadId === leadId)

  if (leadDocs.length === 0)

    return (

      <Card className="p-6 text-center">

        <p className="text-muted-foreground">

          No documents uploaded

        </p>

      </Card>

    )

  return (

    <div className="space-y-2">

      {leadDocs.map((doc) => (

        <DocumentItem

          key={doc.id}
          document={doc}
          onDelete={deleteDocument}

        />

      ))}

    </div>

  )

}