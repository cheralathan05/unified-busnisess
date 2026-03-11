'use client'

import PipelineBoard from "@/components/crm/pipeline/pipeline-board"

export default function PipelinePage() {

  return (

    <div className="w-full h-full flex flex-col">

      <div className="flex-1 overflow-y-auto">

        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">

          {/* Page Header */}

          <div className="space-y-1">

            <h1 className="text-3xl font-bold">
              Sales Pipeline
            </h1>

            <p className="text-muted-foreground">
              Drag leads between stages to manage your sales workflow.
            </p>

          </div>

          {/* Pipeline Board */}

          <PipelineBoard />

        </div>

      </div>

    </div>

  )

}