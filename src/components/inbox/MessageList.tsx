'use client';

import { useState } from 'react';
import { InboxMessage } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Mail,
  Clock,
  User,
  Send,
  Eye,
  MessageSquare,
  CheckCircle,
  XCircle,
  FileText,
  Flag,
  FlagOff,
  Building2,
  Trash2
} from 'lucide-react';

interface MessageListProps {
  messages: InboxMessage[];
  selectedMessage: InboxMessage | null;
  onMessageSelect: (message: InboxMessage) => void;
  onToggleFlag: (messageId: string, isCurrentlyFlagged: boolean) => void;
  onDeleteMessage: (messageId: string) => void;
  onDragStart?: (message: InboxMessage) => void;
}

const getMessageTypeIcon = (type: InboxMessage['type']) => {
  switch (type) {
    case 'quote_sent':
      return <Send className="h-3 w-3 text-blue-500" />;
    case 'quote_opened':
      return <Eye className="h-3 w-3 text-green-500" />;
    case 'quote_question':
      return <MessageSquare className="h-3 w-3 text-orange-500" />;
    case 'quote_approved':
      return <CheckCircle className="h-3 w-3 text-green-600" />;
    case 'quote_rejected':
      return <XCircle className="h-3 w-3 text-red-500" />;
    case 'outgoing_reply':
      return <Send className="h-3 w-3 text-blue-600" />;
    default:
      return <Mail className="h-3 w-3 text-gray-500" />;
  }
};

const getMessageTypeLabel = (type: InboxMessage['type']) => {
  switch (type) {
    case 'quote_sent':
      return 'Tilbud sendt';
    case 'quote_opened':
      return 'Tilbud åpnet';
    case 'quote_question':
      return 'Spørsmål';
    case 'quote_approved':
      return 'Godkjent';
    case 'quote_rejected':
      return 'Avvist';
    case 'outgoing_reply':
      return 'Sendt svar';
    default:
      return 'Generell';
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('nb-NO', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export function MessageList({
  messages,
  selectedMessage,
  onMessageSelect,
  onToggleFlag,
  onDeleteMessage,
  onDragStart
}: MessageListProps) {
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Mail className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">Ingen meldinger</p>
        <p className="text-sm">Nye meldinger vil dukke opp her</p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-2 space-y-1">
        {messages.map((message) => (
          <Card
            key={message.id}
            className={`cursor-pointer transition-all duration-150 hover:shadow-sm border-l-4 ${
              selectedMessage?.id === message.id
                ? 'ring-1 ring-primary bg-accent/50 border-l-primary'
                : !message.isRead
                ? message.quoteTitle
                  ? 'bg-blue-50/50 dark:bg-blue-950/20 border-l-blue-500 shadow-sm'
                  : 'bg-background border-l-blue-500'
                : 'bg-card border-l-transparent'
            } ${
              hoveredMessageId === message.id ? 'shadow-sm' : ''
            }`}
            onClick={() => onMessageSelect(message)}
            onMouseEnter={() => setHoveredMessageId(message.id)}
            onMouseLeave={() => setHoveredMessageId(null)}
            draggable={!!onDragStart}
            onDragStart={(e) => {
              onDragStart?.(message);
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/plain', message.id);
              document.body.style.cursor = 'grabbing';
            }}
            onDragEnd={() => {
              if (onDragStart) {
                document.body.style.cursor = '';
              }
            }}
          >
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarFallback className="text-xs">
                    {message.type === 'outgoing_reply' ? (
                      <Building2 className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className={`text-sm font-medium truncate ${
                        !message.isRead ? 'font-semibold text-foreground' : 'text-muted-foreground'
                      }`}>
                        {message.customerName || message.from}
                      </span>
                      {message.quoteTitle && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 rounded-full">
                          <FileText className="h-3 w-3 text-primary" />
                          <span className="text-xs text-primary font-medium">Tilbud</span>
                        </div>
                      )}
                      <Badge variant="secondary" className="text-xs px-1.5 py-0.5 flex-shrink-0">
                        {getMessageTypeLabel(message.type)}
                      </Badge>
                      {message.isFlagged && (
                        <Flag className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(message.timestamp)}
                      </span>
                      {hoveredMessageId === message.id && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFlag(message.id, message.isFlagged || false);
                            }}
                            className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                          >
                            {!message.isFlagged ? (
                              <Flag className="h-3 w-3" />
                            ) : (
                              <FlagOff className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteMessage(message.id);
                            }}
                            className="h-6 w-6 p-0 opacity-60 hover:opacity-100 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <p className={`text-sm truncate mb-1 ${
                    !message.isRead ? 'font-medium text-foreground' : 'text-muted-foreground'
                  }`}>
                    {message.subject}
                  </p>

                  <p className="text-xs text-muted-foreground truncate mb-2">
                    {message.message}
                  </p>

                  {message.quoteTitle && (
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-primary font-medium">
                        {message.quoteTitle}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}