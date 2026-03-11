'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAppState } from '@/hooks/use-app-state';
import { Search, Send, MessageSquare, Paperclip, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MessagesPage() {
  const { messages, leads, addMessage } = useAppState();
  const [selectedLeadId, setSelectedLeadId] = useState(leads[0]?.id);
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const selectedLead = leads.find(l => l.id === selectedLeadId);
  const leadMessages = messages.filter(m => m.leadId === selectedLeadId);
  const filteredLeads = leads.filter(l =>
    l.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedLeadId) return;
    addMessage({
      leadId: selectedLeadId,
      content: messageText,
      sender: 'user',
    });
    setMessageText('');
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-background overflow-hidden">
      {/* Sidebar - Conversations List */}
      <div className="w-64 border-r border-border/50 flex flex-col bg-card/50">
        <div className="p-4 border-b border-border/50">
          <h2 className="font-bold text-foreground mb-3">Conversations</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9 bg-muted/50 border-border/50 rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredLeads.map((lead) => {
            const isSelected = lead.id === selectedLeadId;
            const leadMsgs = messages.filter(m => m.leadId === lead.id);
            const lastMsg = leadMsgs[leadMsgs.length - 1];

            return (
              <button
                key={lead.id}
                onClick={() => setSelectedLeadId(lead.id)}
                className={cn(
                  'w-full p-3 border-b border-border/50 text-left transition-all hover:bg-muted/50',
                  isSelected && 'bg-primary/10 border-primary/30'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">
                    {lead.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{lead.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {lastMsg ? lastMsg.content : 'No messages yet'}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedLead ? (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b border-border/50 bg-card/80 backdrop-blur-xl flex items-center justify-between px-6">
              <div>
                <h2 className="font-bold text-foreground">{selectedLead.name}</h2>
                <p className="text-xs text-muted-foreground">{selectedLead.company}</p>
              </div>
              <Button variant="ghost" size="icon" title="AI Suggestions">
                <Zap className="w-5 h-5 text-primary" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {leadMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center">
                  <div>
                    <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                  </div>
                </div>
              ) : (
                leadMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'flex',
                      msg.sender === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-sm px-4 py-2 rounded-lg',
                        msg.sender === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-none'
                          : 'bg-muted text-muted-foreground rounded-bl-none'
                      )}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Area */}
            <div className="h-20 border-t border-border/50 bg-card/50 backdrop-blur-xl p-4 flex items-center gap-3">
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <Paperclip className="w-5 h-5" />
              </Button>
              <Input
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-muted/50 border-border/50 rounded-lg"
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!messageText.trim()}
                className="bg-primary hover:bg-primary/90"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <MessageSquare className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
