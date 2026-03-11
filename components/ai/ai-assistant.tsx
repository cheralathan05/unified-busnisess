'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  X,
  Send,
  Sparkles,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function AIAssistant({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your AI Business Assistant. I can help you with lead follow-ups, reply suggestions, data analysis, and business recommendations. What would you like help with?',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: generateAIResponse(input),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="fixed right-0 bottom-0 h-screen w-full md:w-96 bg-black/50 md:bg-transparent flex items-center justify-end z-50">
      <Card className="h-full md:h-[600px] md:rounded-l-2xl rounded-none w-full md:w-96 flex flex-col shadow-2xl bg-card border-0 md:border-l">
        {/* Header */}
        <div className="h-16 border-b border-border px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            <span className="font-semibold text-foreground">AI Assistant</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4 space-y-4 overflow-y-auto">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs rounded-lg px-4 py-2 ${
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.type === 'user'
                        ? 'text-primary-foreground/70'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" />
                    <div
                      className="w-2 h-2 bg-foreground rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    />
                    <div
                      className="w-2 h-2 bg-foreground rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="h-20 border-t border-border p-4 flex-shrink-0 space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleSend()
              }}
              className="h-9"
              disabled={isLoading}
            />
            <Button
              size="sm"
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="h-9 w-9 p-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-1 text-xs text-muted-foreground">
            <span>💡 Ask about leads, payments, or automations</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

function generateAIResponse(input: string): string {
  const responses: { [key: string]: string } = {
    'follow': 'I recommend following up with Ravi Kumar today - he viewed your proposal 24 hours ago. Send him a friendly message asking if he has any questions.',
    'payment': 'You have 3 overdue invoices totaling ₹1,25,000. Priority customers are Vijayk Enterprises (5 days overdue) and Anita Singh (3 days overdue).',
    'lead': 'Your lead conversion rate improved 4% this month! Your highest-value opportunities are Vijayk Enterprises and Priya Sharma based on engagement metrics.',
    'automation': 'Your 8 active automations have saved 12+ hours this week. Consider automating payment reminders after 7 days of invoice issuance.',
    'task': 'You have 5 overdue tasks. Prioritize "Follow-up: Ravi Kumar" and "Payment verification" for today.',
  }

  for (const [key, response] of Object.entries(responses)) {
    if (input.toLowerCase().includes(key)) {
      return response
    }
  }

  return 'I understand you\'re asking about ' +
    input.toLowerCase().substring(0, 30) +
    '... This feature is being enhanced. In the meantime, I can help you with CRM insights, payment analysis, task prioritization, and automation recommendations.'
}
