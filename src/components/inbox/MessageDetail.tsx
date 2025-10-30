'use client';

import { useState } from 'react';
import { InboxMessage, ConversationEntry } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Reply,
  Trash2,
  AlertCircle
} from 'lucide-react';

interface MessageDetailProps {
  message: InboxMessage | null;
  folders: string[];
  onReply: () => void;
  onMoveToFolder: (messageId: string, folder: string) => void;
  onToggleFlag: (messageId: string, isCurrentlyFlagged: boolean) => void;
  onDeleteMessage: (messageId: string) => void;
  onCustomerClick: (customerId: string) => void;
  onQuoteClick: (quoteId: string) => void;
  isReplying?: boolean;
  replySubject?: string;
  replyMessage?: string;
  onReplySubjectChange?: (subject: string) => void;
  onReplyMessageChange?: (message: string) => void;
  onSendReply?: () => void;
  onCancelReply?: () => void;
  isSendingReply?: boolean;
}

const getMessageTypeIcon = (type: InboxMessage['type']) => {
  switch (type) {
    case 'quote_sent':
      return <Send className="h-4 w-4 text-blue-500" />;
    case 'quote_opened':
      return <Eye className="h-4 w-4 text-green-500" />;
    case 'quote_question':
      return <MessageSquare className="h-4 w-4 text-orange-500" />;
    case 'quote_approved':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'quote_rejected':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'outgoing_reply':
      return <Send className="h-4 w-4 text-blue-600" />;
    default:
      return <Mail className="h-4 w-4 text-gray-500" />;
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

const formatDateLong = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('nb-NO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export function MessageDetail({
  message,
  folders,
  onReply,
  onMoveToFolder,
  onToggleFlag,
  onDeleteMessage,
  onCustomerClick,
  onQuoteClick,
  isReplying = false,
  replySubject = '',
  replyMessage = '',
  onReplySubjectChange,
  onReplyMessageChange,
  onSendReply,
  onCancelReply,
  isSendingReply = false
}: MessageDetailProps) {
  if (!message) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground bg-muted/20">
        <div className="text-center">
          <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Velg en melding</p>
          <p className="text-sm">Velg en melding fra listen for å se detaljer</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              {getMessageTypeIcon(message.type)}
              {message.isFlagged && <Flag className="h-4 w-4 text-yellow-500" />}
              <Badge variant="outline" className="text-xs">
                {getMessageTypeLabel(message.type)}
              </Badge>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-foreground">{message.subject}</h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {message.type === 'outgoing_reply' ? (
                      <Building2 className="h-3 w-3" />
                    ) : (
                      <User className="h-3 w-3" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => message.customerId && onCustomerClick(message.customerId)}
                  className="hover:text-primary transition-colors font-medium"
                >
                  {message.customerName || message.from}
                </button>
              </div>
              <span>•</span>
              <span>{formatDateLong(message.timestamp)}</span>
            </div>
            {message.quoteTitle && (
              <div className="flex items-center gap-2 mt-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <button
                  onClick={() => message.quoteId && onQuoteClick(message.quoteId)}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  {message.quoteTitle}
                </button>
              </div>
            )}
          </div>
        </div>

        {!isReplying && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={onReply} className="flex items-center gap-2">
              <Reply className="h-4 w-4" />
              Svar
            </Button>
            <Select
              value={(message.folder && message.folder.trim()) || 'innboks'}
              onValueChange={(value) => onMoveToFolder(message.id, value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {folders.filter(name => name && name.trim()).map((folderName) => (
                  <SelectItem key={folderName} value={folderName}>
                    {folderName.charAt(0).toUpperCase() + folderName.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleFlag(message.id, message.isFlagged || false)}
              className={!message.isFlagged ? 'text-yellow-500' : ''}
            >
              {!message.isFlagged ? <Flag className="h-4 w-4" /> : <FlagOff className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteMessage(message.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {isReplying ? (
            <Card className="border-primary/20">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Emne</label>
                    <input
                      type="text"
                      value={replySubject}
                      onChange={(e) => onReplySubjectChange?.(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                      placeholder="Skriv emne..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Melding</label>
                    <Textarea
                      value={replyMessage}
                      onChange={(e) => onReplyMessageChange?.(e.target.value)}
                      rows={8}
                      placeholder="Skriv ditt svar her..."
                      className="resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={onSendReply}
                      disabled={isSendingReply || !replySubject.trim() || !replyMessage.trim()}
                      className="flex items-center gap-2"
                    >
                      {isSendingReply ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Sender...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send svar
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={onCancelReply}
                      disabled={isSendingReply}
                    >
                      Avbryt
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Original Message */}
              <Card className={
                message.type === 'outgoing_reply'
                  ? 'border-blue-200 bg-blue-50/50 dark:bg-blue-950/20'
                  : 'border-border'
              }>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    {message.type === 'outgoing_reply' ? (
                      <>
                        <Building2 className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-900 dark:text-blue-100">Sendt av deg</span>
                      </>
                    ) : (
                      <>
                        <User className="h-4 w-4" />
                        <span className="font-medium">{message.customerName || message.from}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{formatDateLong(message.timestamp)}</span>
                    {message.sentTo && (
                      <>
                        <span>•</span>
                        <span className="text-xs">Sendt til {message.sentTo}</span>
                      </>
                    )}
                  </div>
                  {message.message && message.type !== 'quote_conversation' && (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.message}</p>
                  )}
                  {message.type === 'quote_conversation' && (!message.conversation || Object.keys(message.conversation).length === 0) && (
                    <p className="text-muted-foreground italic">Ingen meldinger i samtalen ennå</p>
                  )}
                  {message.emailId && (
                    <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      E-post sendt (ID: {message.emailId.substring(0, 8)}...)
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Conversation History */}
              {message.conversation && Object.keys(message.conversation).length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-semibold text-foreground">
                      {message.type === 'quote_conversation' ? 'Meldinger' : 'Samtalehistorikk'} ({Object.keys(message.conversation).length})
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(message.conversation)
                      .sort(([, a], [, b]) => (a as ConversationEntry).timestamp - (b as ConversationEntry).timestamp)
                      .map(([replyId, replyData]) => {
                        const reply = replyData as ConversationEntry;
                        return (
                          <Card
                            key={replyId}
                            className={`${
                              reply.sentBy === 'business'
                                ? 'border-blue-200 bg-blue-50/30 dark:bg-blue-950/10 ml-8'
                                : 'border-border mr-8'
                            }`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                {reply.sentBy === 'business' ? (
                                  <>
                                    <Building2 className="h-4 w-4 text-blue-600" />
                                    <span className="font-medium text-blue-900 dark:text-blue-100">Du</span>
                                  </>
                                ) : (
                                  <>
                                    <User className="h-4 w-4" />
                                    <span className="font-medium">{message.customerName || message.from}</span>
                                    {reply.type === 'quote_approved' && (
                                      <Badge variant="default" className="text-xs bg-green-500">
                                        Godkjent
                                      </Badge>
                                    )}
                                    {reply.type === 'quote_rejected' && (
                                      <Badge variant="destructive" className="text-xs">
                                        Avvist
                                      </Badge>
                                    )}
                                    {reply.type === 'quote_question' && (
                                      <Badge variant="default" className="text-xs">
                                        Spørsmål
                                      </Badge>
                                    )}
                                  </>
                                )}
                                <span>•</span>
                                <span>{new Date(reply.timestamp).toLocaleString('nb-NO')}</span>
                                {reply.sentTo && (
                                  <>
                                    <span>•</span>
                                    <span className="text-xs">Sendt til {reply.sentTo}</span>
                                  </>
                                )}
                              </div>
                              <p className="whitespace-pre-wrap text-sm leading-relaxed">{reply.message}</p>
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                </div>
              )}

              {message.hasReply && (
                <Alert className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    Besvart {message.lastReplyAt && new Date(message.lastReplyAt).toLocaleString('nb-NO')}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}