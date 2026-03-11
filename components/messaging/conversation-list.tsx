import React from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Conversation {
  id: number
  name: string
  company: string
  lastMessage: string
  timestamp: string
  unread: boolean
  avatar: string
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: {
  conversations: Conversation[]
  selectedId: number
  onSelect: (conv: Conversation) => void
}) {
  return (
    <div className="space-y-1 p-2">
      {conversations.map((conversation) => (
        <Button
          key={conversation.id}
          variant="ghost"
          onClick={() => onSelect(conversation)}
          className={`w-full justify-start h-auto py-3 px-3 rounded-lg transition-colors ${
            selectedId === conversation.id
              ? 'bg-muted text-foreground'
              : 'hover:bg-muted/50'
          }`}
        >
          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarFallback className="text-xs font-semibold">
              {conversation.avatar}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left ml-3 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p
                className={`text-sm font-medium ${
                  conversation.unread ? 'font-semibold' : ''
                }`}
              >
                {conversation.name}
              </p>
              {conversation.unread && (
                <Badge className="bg-primary text-primary-foreground h-5 w-5 p-0 flex items-center justify-center text-xs">
                  1
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {conversation.lastMessage}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {conversation.timestamp}
            </p>
          </div>
        </Button>
      ))}
    </div>
  )
}
