import { WorkflowBuilder } from '@/components/automation/workflow-builder'

export default function AutomationPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <WorkflowBuilder />
      </div>
    </main>
  )
}
