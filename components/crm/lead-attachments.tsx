'use client'

import { useEffect, useState } from "react"

import DocumentUpload from "./document-upload"
import DocumentList from "./document-list"

import { CRMDocument } from "./document-utils"

import {
getDocuments
} from "@/lib/services/document.service"

interface Props{

leadId:string

}

export default function LeadAttachments({leadId}:Props){

const [documents,setDocuments] =
useState<CRMDocument[]>([])

const [loading,setLoading] =
useState(true)

async function loadDocuments(){

try{

const res = await getDocuments(leadId)

setDocuments(res.data || [])

}catch(err){

console.error("Load documents failed",err)

}finally{

setLoading(false)

}

}

function handleUpload(doc:CRMDocument){

setDocuments(prev=>[doc,...prev])

}

useEffect(()=>{

loadDocuments()

},[leadId])

return(

<div className="space-y-4">

<h3 className="font-semibold">
Attachments
</h3>

{/* Upload */}

<DocumentUpload
leadId={leadId}
onUpload={handleUpload}
/>

{/* List */}

{loading ? (

<p className="text-sm text-muted-foreground">
Loading documents...
</p>

) : (

<DocumentList
leadId={leadId}
/>

)}

</div>

)

}