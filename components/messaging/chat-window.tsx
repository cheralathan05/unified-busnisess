'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Send,
  MoreVertical,
  Paperclip,
  Sparkles,
  Phone,
  Video,
} from 'lucide-react'

interface Message {
  id: string
  sender: 'user' | 'contact'
  content: string
  timestamp: string
  status?: 'sent' | 'delivered' | 'read'
}

interface Conversation {
  id: number
  name: string
  company: string
  avatar: string
}

const sampleMessages: Message[] = [
  {
    id: '1',
    sender: 'contact',
    content: 'Hi! Thanks for reaching out. When can we meet to discuss the project?',
    timestamp: '10:30 AM',
    status: 'read',
  },
  {
    id: '2',
    sender: 'user',
    content: 'Great! How about tomorrow at 2 PM? We can discuss your requirements then.',
    timestamp: '10:45 AM',
    status: 'delivered',
  },
  {
    id: '3',
    sender: 'contact',
    content: 'Tomorrow works perfectly for me. Looking forward to it!',
    timestamp: '11:00 AM',
    status: 'read',
  },
  {
    id: '4',
    sender: 'user',
    content: 'Perfect! I\'ll send you the meeting link shortly.',
    timestamp: '11:05 AM',
    status: 'delivered',
  },
]

const aiSuggestions = [
  'Thank you for your interest. We\'d be happy to help!',
  'Please share your requirements so we can prepare a proposal.',
  'We typically deliver projects within 2-4 weeks.',
  'Our pricing varies based on project scope. Let\'s discuss details.',
]

export function ChatWindow({
  conversation,
}: {
  conversation: Conversation
}) {
  const [messages, setMessages] = useState<Message[]>(sampleMessages)
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'sent',
    }

    setMessages((prev) => [...prev, newMessage])
    setInput('')
  }

  return (
    <Card className="bg-card border-border flex flex-col h-full md:h-[calc(100vh-10rem)]">
      {/* Header */}
      <CardHeader className="pb-4 border-b border-border flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{conversation.avatar}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{conversation.name}</CardTitle>
            <p className="text-xs text-muted-foreground">{conversation.company}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Phone className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="w-4 h-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Profile</DropdownMenuItem>
              <DropdownMenuItem>Clear Chat</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                Block Contact
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs md:max-w-md rounded-lg px-4 py-2 ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p
                  className={`text-xs mt-1 flex items-center gap-1 ${
                    message.sender === 'user'
                      ? 'text-primary-foreground/70'
                      : 'text-muted-foreground'
                  }`}
                >
                  {message.timestamp}
                  {message.status === 'delivered' && ' ✓'}
                  {message.status === 'read' && ' ✓✓'}
                </p>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border p-4 space-y-3">
        {/* AI Suggestions */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs"
            >
              <Sparkles className="w-4 h-4" />
              AI Reply Suggestions
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                Suggested Replies
              </p>
              {aiSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto py-2 text-xs hover:bg-muted"
                  onClick={() => setInput(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Message Input */}
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Paperclip className="w-4 h-4" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleSend()
            }}
            className="h-9"
          />
          <Button size="sm" onClick={handleSend} className="h-9 w-9 p-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
