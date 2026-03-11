'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge-enhanced'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail,
  MessageSquare,
  Phone,
  MessageCircle,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Star,
  Archive,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  from: string
  channel: 'email' | 'sms' | 'whatsapp' | 'chat' | 'call'
  subject?: string
  preview: string
  timestamp: Date
  unread: boolean
  starred: boolean
  leadId?: string
  important?: boolean
}

interface UnifiedInboxProps {
  messages?: Message[]
  onSelectMessage?: (message: Message) => void
  onMarkAsRead?: (id: string) => void
  onToggleStar?: (id: string) => void
  className?: string
}

const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    from: 'Ravi Kumar',
    channel: 'email',
    subject: 'Re: Website Development Quote',
    preview: 'Thank you for the proposal. We would like to discuss the timeline...',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    unread: true,
    starred: false,
    leadId: '1',
    important: true,
  },
  {
    id: '2',
    from: 'Priya Sharma',
    channel: 'whatsapp',
    preview: 'Hi, is the demo available tomorrow at 2 PM? 😊',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    unread: true,
    starred: true,
    leadId: '2',
  },
  {
    id: '3',
    from: 'Amit Singh',
    channel: 'call',
    subject: 'Call Log - Tracking System Discussion',
    preview: 'Spoke with Amit about implementation timeline...',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    unread: false,
    starred: false,
    leadId: '3',
  },
  {
    id: '4',
    from: 'Support Ticket #482',
    channel: 'chat',
    preview: 'Customer inquiry about payment methods',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
    unread: false,
    starred: false,
  },
]

const ChannelIcon = ({ channel }: { channel: string }) => {
  const icons: Record<string, React.ReactNode> = {
    email: <Mail className="w-4 h-4" />,
    sms: <MessageSquare className="w-4 h-4" />,
    whatsapp: <MessageCircle className="w-4 h-4" />,
    chat: <MessageSquare className="w-4 h-4" />,
    call: <Phone className="w-4 h-4" />,
  }
  return icons[channel] || icons.email
}

const ChannelColor = ({ channel }: { channel: string }): string => {
  const colors: Record<string, string> = {
    email: 'primary',
    sms: 'warning',
    whatsapp: 'success',
    chat: 'info',
    call: 'secondary',
  }
  return colors[channel] || 'primary'
}

export function UnifiedInbox({
  messages = MOCK_MESSAGES,
  onSelectMessage,
  onMarkAsRead,
  onToggleStar,
  className,
}: UnifiedInboxProps) {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterChannel, setFilterChannel] = useState<string | null>(null)
  const [filterUnread, setFilterUnread] = useState(false)

  // Filter messages
  const filteredMessages = messages.filter(msg => {
    if (searchQuery && !msg.preview.toLowerCase().includes(searchQuery.toLowerCase()) && !msg.from.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (filterChannel && msg.channel !== filterChannel) {
      return false
    }
    if (filterUnread && !msg.unread) {
      return false
    }
    return true
  })

  const unreadCount = messages.filter(m => m.unread).length

  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message)
    if (message.unread && onMarkAsRead) {
      onMarkAsRead(message.id)
    }
    onSelectMessage?.(message)
  }

  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-3 gap-4 h-full', className)}>
      {/* Inbox list */}
      <div className="lg:col-span-1 flex flex-col gap-4">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Inbox
              </span>
              {unreadCount > 0 && (
                <Badge variant="solid" color="destructive" size="sm">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col gap-3 overflow-hidden">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filterUnread ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
                onClick={() => setFilterUnread(!filterUnread)}
              >
                Unread ({unreadCount})
              </Button>
            </div>

            {/* Channel filter tabs */}
            <Tabs value={filterChannel || 'all'} onValueChange={(v) => setFilterChannel(v === 'all' ? null : v)}>
              <TabsList className="w-full grid grid-cols-3 h-8">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="email" className="text-xs gap-1">
                  <Mail className="w-3 h-3" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="whatsapp" className="text-xs gap-1">
                  <MessageCircle className="w-3 h-3" />
                  Chat
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Messages list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              <AnimatePresence>
                {filteredMessages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    <button
                      onClick={() => handleSelectMessage(message)}
                      className={cn(
                        'w-full text-left p-3 rounded-lg border transition-all text-sm group',
                        selectedMessage?.id === message.id
                          ? 'bg-primary/10 border-primary/30'
                          : 'border-border/50 hover:border-border hover:bg-muted/30',
                        message.unread && 'font-semibold bg-muted/20',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Badge
                            variant="soft"
                            color={ChannelColor({ channel: message.channel }) as any}
                            size="sm"
                          >
                            <ChannelIcon channel={message.channel} />
                          </Badge>
                          <span className="truncate text-sm">{message.from}</span>
                        </div>
                        {message.starred && (
                          <Star className="w-3.5 h-3.5 fill-warning text-warning flex-shrink-0" />
                        )}
                      </div>

                      {message.subject && (
                        <p className="text-xs text-muted-foreground truncate mb-1">
                          {message.subject}
                        </p>
                      )}

                      <p className="text-xs text-muted-foreground truncate line-clamp-1">
                        {message.preview}
                      </p>

                      <div className="flex items-center justify-between mt-2 gap-2">
                        <span className="text-xs text-muted-foreground">
                          {Math.floor((Date.now() - message.timestamp.getTime()) / (1000 * 60))}m ago
                        </span>
                        {message.unread && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredMessages.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No messages found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message detail */}
      <div className="lg:col-span-2">
        {selectedMessage ? (
          <Card className="flex flex-col h-full">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="soft" color={ChannelColor({ channel: selectedMessage.channel }) as any}>
                      <ChannelIcon channel={selectedMessage.channel} />
                      {selectedMessage.channel.charAt(0).toUpperCase() + selectedMessage.channel.slice(1)}
                    </Badge>
                    {selectedMessage.important && (
                      <Badge variant="solid" color="destructive">
                        Important
                      </Badge>
                    )}
                  </div>
                  <CardTitle>{selectedMessage.from}</CardTitle>
                  {selectedMessage.subject && (
                    <CardDescription>{selectedMessage.subject}</CardDescription>
                  )}
                </div>

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onToggleStar?.(selectedMessage.id)}
                  >
                    <Star
                      className={cn(
                        'w-4 h-4',
                        selectedMessage.starred ? 'fill-warning text-warning' : 'text-muted-foreground',
                      )}
                    />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Archive className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto">
              <p className="text-foreground whitespace-pre-wrap">{selectedMessage.preview}</p>
            </CardContent>

            {/* Reply section */}
            <div className="border-t border-border/50 p-4">
              <Input placeholder="Type your reply..." className="mb-3" />
              <Button className="w-full">Send Reply</Button>
            </div>
          </Card>
        ) : (
          <Card className="flex items-center justify-center h-full text-center">
            <CardContent className="py-12">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Select a message to view details</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
