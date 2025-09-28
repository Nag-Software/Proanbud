'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/shared/Card';
import { InboxMessage, Kunde, Tilbud } from '@/lib/types';
import { Mail, MailOpen, Clock, User, Send, Eye, MessageSquare, CheckCircle, XCircle, FileText } from 'lucide-react';
import { CustomerDetailsDrawer } from '@/components/kunder/CustomerDetailsDrawer';
import { QuoteDetailsDrawer } from '@/components/tilbud/QuoteDetailsDrawer';
import { Button } from '@/components/ui/button';
import { getInboxMessages, markMessageAsRead } from '@/lib/services/inboxService';
import { getCustomer } from '@/lib/services/customerService';
import { getTilbudById } from '@/lib/services/tilbudService';
import { ref, onValue, off } from 'firebase/database';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('nb-NO', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
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
    default:
      return 'Generell';
  }
};

export default function InnboksPage() {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [customerDrawerOpen, setCustomerDrawerOpen] = useState(false);
  const [quoteDrawerOpen, setQuoteDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Kunde | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Tilbud | null>(null);
  const [isReplying, setIsReplying] = useState(false);
  const [replySubject, setReplySubject] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: () => void;

    const setupRealtimeListener = async () => {
      try {
        // Wait for auth to be ready
        if (!auth.currentUser) {
          setError('Bruker ikke autentisert');
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        setError(null);

        const userId = auth.currentUser.uid;
        const inboxRef = ref(db, `users/${userId}/inbox`);

        // Set up real-time listener
        unsubscribe = onValue(inboxRef, (snapshot) => {
          try {
            if (!snapshot.exists()) {
              setMessages([]);
              setIsLoading(false);
              return;
            }

            const messageData = snapshot.val() as Record<string, any>;
            const messages: InboxMessage[] = [];

            // Convert to array and sort by timestamp (newest first)
            Object.entries(messageData)
              .sort(([, a], [, b]) => b.timestamp - a.timestamp)
              .forEach(([key, data]) => {
                try {
                  // Convert Firebase data to InboxMessage format
                  const message: InboxMessage = {
                    id: key,
                    from: data.from,
                    subject: data.subject,
                    message: data.message,
                    timestamp: new Date(data.timestamp).toISOString().slice(0, 16).replace('T', ' '),
                    isRead: data.isRead || false,
                    quoteId: data.quoteId,
                    customerId: data.customerId,
                    type: data.type,
                    customerName: data.customerName,
                    quoteTitle: data.quoteTitle,
                  };
                  messages.push(message);
                } catch (error) {
                  console.warn('Skipping invalid inbox message data:', key, error);
                }
              });

            setMessages(messages);
            setIsLoading(false);
          } catch (error) {
            console.error('Error processing inbox messages:', error);
            setError('Kunne ikke behandle meldinger');
            setIsLoading(false);
          }
        }, (error) => {
          console.error('Firebase listener error:', error);
          setError('Kunne ikke lytte til meldinger');
          setIsLoading(false);
        });

      } catch (error) {
        console.error('Error setting up real-time listener:', error);
        setError(error instanceof Error ? error.message : 'Kunne ikke sette opp sanntidsoppdatering');
        setIsLoading(false);
      }
    };

    setupRealtimeListener();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleMessageClick = async (message: InboxMessage) => {
    setSelectedMessage(message);
    // Mark as read if not already read
    if (!message.isRead) {
      try {
        await markMessageAsRead(message.id);
        // Update local state
        setMessages(prev =>
          prev.map(m =>
            m.id === message.id ? { ...m, isRead: true } : m
          )
        );
      } catch (error) {
        console.error('Error marking message as read:', error);
        // Still show the message even if marking as read fails
      }
    }
  };

  const handleCustomerClick = async (customerId: string) => {
    try {
      const customer = await getCustomer(customerId);
      if (customer) {
        setSelectedCustomer(customer);
        setCustomerDrawerOpen(true);
      } else {
        console.error('Customer not found:', customerId);
        alert('Kunne ikke finne kunden');
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
      alert('Kunne ikke hente kundedata');
    }
  };

  const handleQuoteClick = async (quoteId: string) => {
    try {
      const quote = await getTilbudById(quoteId);
      if (quote) {
        setSelectedQuote(quote);
        setQuoteDrawerOpen(true);
      } else {
        console.error('Quote not found:', quoteId);
        alert('Kunne ikke finne tilbudet');
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
      alert('Kunne ikke hente tilbudsdata');
    }
  };

  const handleReply = () => {
    if (!selectedMessage) return;

    setIsReplying(true);
    setReplySubject(`Re: ${selectedMessage.subject}`);
    setReplyMessage(`\n\n--- Original melding ---\n${selectedMessage.message}`);
  };

  const handleSendReply = async () => {
    if (!selectedMessage || !replySubject.trim() || !replyMessage.trim()) return;

    setIsSendingReply(true);
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: selectedMessage.from, // This should be the customer's email, but we only have name
          subject: replySubject,
          message: replyMessage,
          customerId: selectedMessage.customerId,
          quoteId: selectedMessage.quoteId,
        }),
      });

      if (response.ok) {
        alert('Svar sendt!');
        setIsReplying(false);
        setReplySubject('');
        setReplyMessage('');
      } else {
        throw new Error('Failed to send reply');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Kunne ikke sende svar. Prøv igjen.');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleCancelReply = () => {
    setIsReplying(false);
    setReplySubject('');
    setReplyMessage('');
  };

  const unreadCount = messages.filter(m => !m.isRead).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Prøv igjen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-full flex flex-col lg:flex-row">
        {/* Message List */}
        <div className="w-full lg:w-1/2 border-r border-gray-200 lg:flex flex-col">
          <div className="p-4 lg:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg lg:text-xl font-semibold">Innboks</h2>
              {unreadCount > 0 && (
                <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                  {unreadCount} ulest
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                <Mail className="h-12 w-12 mb-4" />
                <p>Ingen meldinger enda</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  onClick={() => handleMessageClick(message)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedMessage?.id === message.id ? 'bg-blue-50 border-l-4 border-l-blue-500 lg:border-l-4' : ''
                  } ${!message.isRead ? 'bg-gray-50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getMessageTypeIcon(message.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (message.customerId) {
                                handleCustomerClick(message.customerId);
                              }
                            }}
                            className={`text-sm font-medium truncate hover:text-blue-600 transition-colors ${
                              !message.isRead ? 'text-gray-900' : 'text-gray-700'
                            }`}
                          >
                            {message.customerName || message.from}
                          </button>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                            {getMessageTypeLabel(message.type)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1 flex-shrink-0">
                          <Clock className="h-3 w-3" />
                          {formatDate(message.timestamp)}
                        </p>
                      </div>
                      <p className={`text-sm truncate mb-1 ${
                        !message.isRead ? 'font-medium text-gray-900' : 'text-gray-600'
                      }`}>
                        {message.subject}
                      </p>
                      <p className="text-xs text-gray-500 truncate hidden sm:block">
                        {message.message}
                      </p>
                      {message.quoteTitle && (
                        <div className="flex items-center gap-1 mt-1">
                          <FileText className="h-3 w-3 text-gray-400" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (message.quoteId) {
                                handleQuoteClick(message.quoteId);
                              }
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {message.quoteTitle}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Message Detail - Hidden on mobile when no message selected */}
        <div className={`w-full lg:w-1/2 flex flex-col ${selectedMessage ? 'block' : 'hidden lg:block'}`}>
          {selectedMessage ? (
            <>
              <div className="p-4 lg:p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getMessageTypeIcon(selectedMessage.type)}
                      <span className="text-sm px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                        {getMessageTypeLabel(selectedMessage.type)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{selectedMessage.subject}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <User className="h-4 w-4" />
                      <button
                        onClick={() => selectedMessage.customerId && handleCustomerClick(selectedMessage.customerId)}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {selectedMessage.customerName || selectedMessage.from}
                      </button>
                      <span>•</span>
                      <span>{formatDateLong(selectedMessage.timestamp)}</span>
                    </div>
                    {selectedMessage.quoteTitle && (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <button
                          onClick={() => selectedMessage.quoteId && handleQuoteClick(selectedMessage.quoteId)}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {selectedMessage.quoteTitle}
                        </button>
                      </div>
                    )}
                  </div>
                  {/* Close button for mobile */}
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="lg:hidden ml-4 p-2 hover:bg-gray-100 rounded-full"
                  >
                    ✕
                  </button>
                </div>
                {!isReplying && (
                  <div className="mt-4">
                    <Button onClick={handleReply} className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Svar
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
                {isReplying ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Emne
                      </label>
                      <input
                        type="text"
                        value={replySubject}
                        onChange={(e) => setReplySubject(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Melding
                      </label>
                      <textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        rows={10}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Skriv ditt svar her..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSendReply}
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
                        onClick={handleCancelReply}
                        disabled={isSendingReply}
                      >
                        Avbryt
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Mail className="h-12 w-12 mx-auto mb-4" />
                <p>Velg en melding for å se detaljer</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customer Drawer */}
      {selectedCustomer && (
        <CustomerDetailsDrawer
          customer={selectedCustomer}
          open={customerDrawerOpen}
          onOpenChange={(open) => {
            setCustomerDrawerOpen(open);
            if (!open) setSelectedCustomer(null);
          }}
        />
      )}

      {/* Quote Drawer */}
      {selectedQuote && (
        <QuoteDetailsDrawer
          quote={selectedQuote}
          open={quoteDrawerOpen}
          onOpenChange={(open) => {
            setQuoteDrawerOpen(open);
            if (!open) setSelectedQuote(null);
          }}
        />
      )}
    </>
  );
}