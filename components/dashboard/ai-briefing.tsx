import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sparkles, Lightbulb, AlertCircle } from 'lucide-react'

export function AIBriefing() {
  return (
    <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          <CardTitle className="text-base">AI Daily Briefing</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Insight */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Next Best Action
              </p>
              <p className="text-xs text-foreground/80 mt-1">
                Follow up with <span className="font-semibold">Ravi Kumar</span> about the website proposal. He viewed it yesterday and typically responds within 24 hours.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-start gap-2 text-xs">
            <span className="text-success font-semibold">✓</span>
            <span className="text-foreground/70">
              <strong>Payment trend:</strong> 3 invoices (₹1,50,000) due this week
            </span>
          </div>
          <div className="flex items-start gap-2 text-xs">
            <span className="text-warning font-semibold">!</span>
            <span className="text-foreground/70">
              <strong>Lead quality:</strong> Vijayk Enterprises is your most engaged prospect
            </span>
          </div>
          <div className="flex items-start gap-2 text-xs">
            <span className="text-info font-semibold">●</span>
            <span className="text-foreground/70">
              <strong>Automation wins:</strong> 12 follow-up messages sent automatically
            </span>
          </div>
        </div>

        {/* CTA */}
        <Button
          variant="default"
          size="sm"
          className="w-full gap-2 mt-2"
        >
          <span>Get Full Briefing</span>
        </Button>
      </CardContent>
    </Card>
  )
}
