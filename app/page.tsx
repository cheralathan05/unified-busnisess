'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  ArrowRight,
  BarChart3,
  MessageSquare,
  Zap,
  Users,
  CreditCard,
  CheckSquare,
  Sparkles,
} from 'lucide-react'
import { useEffect } from 'react'

export default function HomePage() {
  const { isAuthenticated, isInitialized } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.push('/crm')
    }
  }, [isAuthenticated, isInitialized, router])

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-secondary mb-4 shadow-lg">
            <span className="text-2xl font-bold text-primary-foreground">DB</span>
          </div>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="px-6 md:px-8 h-16 flex items-center justify-between border-b border-border/50 backdrop-blur-xl bg-card/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
            <span className="text-sm font-bold text-primary-foreground">DB</span>
          </div>
          <span className="font-bold text-lg text-foreground">Digital Business Brain</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="outline" className="rounded-lg border-border/50 text-foreground hover:bg-muted/50">Sign In</Button>
          </Link>
          <Link href="/signup">
            <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold shadow-lg">
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 md:px-8 py-20 md:py-32 text-center max-w-5xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
          Your Complete Business Management Platform
        </h1>
        <p className="text-lg md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
          Manage leads, payments, messaging, automations, and analytics—all in one intelligent system. Purpose-built for Indian SMEs.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
          <Link href="/crm">
            <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold shadow-lg text-base px-8">
              <Sparkles className="w-5 h-5" />
              Start Free Trial
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="rounded-xl text-base px-8 border-border/50 hover:bg-muted/50">
            Watch Demo
          </Button>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-20">
          {[
            { icon: Users, label: 'Smart CRM' },
            { icon: CreditCard, label: 'Payment Tracking' },
            { icon: MessageSquare, label: 'Team Messaging' },
          ].map((feature, i) => {
            const Icon = feature.icon
            return (
              <Card key={i} className="bg-gradient-to-br from-primary/10 to-accent/5 border-border/50 backdrop-blur hover:shadow-lg transition-all duration-300">
                <CardContent className="pt-8 text-center">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <p className="font-semibold text-foreground text-lg">{feature.label}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 md:px-8 py-20 max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">Everything You Need</h2>
        <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto">Comprehensive features designed to streamline your business operations</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              icon: Users,
              title: 'CRM & Leads',
              description: 'Manage leads through every stage of the sales pipeline with visual boards and detailed customer profiles.',
            },
            {
              icon: CreditCard,
              title: 'Payment Management',
              description: 'Track invoices, record payments, and monitor payment health with automated reminders.',
            },
            {
              icon: MessageSquare,
              title: 'Unified Messaging',
              description: 'Chat with customers through WhatsApp, Email, and more. All conversations in one place.',
            },
            {
              icon: CheckSquare,
              title: 'Task Management',
              description: 'Create, assign, and track tasks with due dates, priorities, and automatic follow-up reminders.',
            },
            {
              icon: Zap,
              title: 'Smart Automations',
              description: 'Build workflows to automate repetitive tasks and save hours every week.',
            },
            {
              icon: BarChart3,
              title: 'Advanced Analytics',
              description: 'Get actionable insights with AI-powered reports on revenue, leads, and team performance.',
            },
          ].map((feature, i) => {
            const Icon = feature.icon
            return (
              <Card key={i} className="bg-gradient-to-br from-card to-card/50 border-border/50 hover:shadow-xl transition-all duration-300 hover:border-primary/30 group">
                <CardContent className="pt-8">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 md:px-8 py-20 max-w-4xl mx-auto">
        <Card className="bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20 border-primary/30 shadow-2xl">
          <CardContent className="pt-16 pb-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to transform your business?
            </h2>
            <p className="text-muted-foreground mb-10 max-w-2xl mx-auto text-lg leading-relaxed">
              Join thousands of Indian businesses using Digital Business Brain to streamline operations and grow faster.
            </p>
            <Link href="/crm">
              <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold shadow-lg text-base px-8">
                <span>Start Your Free Trial Today</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-8 py-12 border-t border-border/50 text-center text-muted-foreground">
        <p>© 2024 Digital Business Brain. Built for Indian SMEs with ❤️</p>
      </footer>
    </div>
  )
}
