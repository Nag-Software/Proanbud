'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Archive,
  Building2,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Flag,
  FlagOff,
  Inbox,
  Loader2,
  Mail,
  MailOpen,
  MessageSquare,
  Plus,
  Reply,
  Search,
  Send,
  User,
  XCircle,
} from 'lucide-react';
import { CustomerDetailsDrawer } from '@/components/kunder/CustomerDetailsDrawer';
import { Kunde, InboxMessage, ConversationEntry } from '@/lib/types';
import { auth, db } from '@/lib/firebase';
import { ref, onValue, push, set } from 'firebase/database';
import { getCustomer } from '@/lib/services/customerService';
import {
  markMessageAsRead,
  markMessageAsUnread,
  archiveInboxMessage,
  unarchiveInboxMessage,
  unflagMessage,
  flagMessage,
} from '@/lib/services/inboxService';
import { cn } from '@/lib/utils';

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

const isQuoteRelatedMessage = (message: InboxMessage) => {
  return (
    message.quoteId ||
    ['quote_sent', 'quote_opened', 'quote_question', 'quote_approved', 'quote_rejected', 'quote_conversation'].includes(message.type)
  );
};

const getMessageActivityTimestamp = (message: InboxMessage) => {
  if (message.lastMessageAt) {
    return message.lastMessageAt;
  }

  const parsed = Date.parse(message.timestamp);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export default function InnboksPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [customerDrawerOpen, setCustomerDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Kunde | null>(null);
  const [isReplying, setIsReplying] = useState(false);
  const [replySubject, setReplySubject] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isCreatingMessage, setIsCreatingMessage] = useState(false);
  const [newMessageSubject, setNewMessageSubject] = useState('');
  const [newMessageTo, setNewMessageTo] = useState('');
  const [newMessageContent, setNewMessageContent] = useState('');
  const [isSendingNewMessage, setIsSendingNewMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogType, setDialogType] = useState<'success' | 'error'>('success');
  const [isMessageDetailOpen, setIsMessageDetailOpen] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<'innboks' | 'arkiv'>('innboks');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [messageToArchive, setMessageToArchive] = useState<string | null>(null);
  const [confirmUnarchiveDialogOpen, setConfirmUnarchiveDialogOpen] = useState(false);
  const [messageToUnarchive, setMessageToUnarchive] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeQuickFilter, setActiveQuickFilter] = useState<'all' | 'unread' | 'flagged' | 'quote'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [isBulkActionRunning, setIsBulkActionRunning] = useState(false);
  const [viewDensity, setViewDensity] = useState<'comfortable' | 'compact'>('compact');

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupRealtimeListener = async () => {
      try {
        if (!auth.currentUser) {
          setError('Bruker ikke autentisert');
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        setError(null);

        const userId = auth.currentUser.uid;
        const inboxRef = ref(db, `users/${userId}/inbox`);

        unsubscribe = onValue(
          inboxRef,
          (snapshot) => {
            try {
              if (!snapshot.exists()) {
                setMessages([]);
                setIsLoading(false);
                return;
              }

              const messageData = snapshot.val() as Record<string, any>;
              const incomingMessages: InboxMessage[] = [];

              Object.entries(messageData)
                .sort(([, a], [, b]) => {
                  const activityA = a.lastMessageAt || a.oppdatert || a.timestamp || 0;
                  const activityB = b.lastMessageAt || b.oppdatert || b.timestamp || 0;
                  return activityB - activityA;
                })
                .forEach(([key, data]) => {
                  try {
                    const latestActivityTimestamp = data.lastMessageAt || data.oppdatert || data.timestamp;
                    const formattedTimestamp = latestActivityTimestamp
                      ? new Date(latestActivityTimestamp).toISOString().slice(0, 16).replace('T', ' ')
                      : new Date().toISOString().slice(0, 16).replace('T', ' ');

                    let previewMessage = data.message || '';
                    if ((!previewMessage || previewMessage.trim().length === 0) && data.conversation) {
                      const conversationEntries = Object.values(data.conversation) as ConversationEntry[];
                      if (conversationEntries.length > 0) {
                        const latestEntry = conversationEntries.reduce<ConversationEntry | null>((latest, entry) => {
                          if (!latest) return entry;
                          return entry.timestamp > latest.timestamp ? entry : latest;
                        }, null);
                        previewMessage = latestEntry?.message || previewMessage;
                      }
                    }

                    const message: InboxMessage = {
                      id: key,
                      from: data.from,
                      subject: data.subject,
                      message: previewMessage,
                      timestamp: formattedTimestamp,
                      isRead: data.isRead || false,
                      quoteId: data.quoteId,
                      customerId: data.customerId,
                      type: data.type,
                      customerName: data.customerName,
                      quoteTitle: data.quoteTitle,
                      isFlagged: data.isFlagged || false,
                      folder: data.folder || 'innboks',
                      conversation: data.conversation,
                      hasReply: data.hasReply,
                      lastReplyAt: data.lastReplyAt,
                      lastMessageAt: data.lastMessageAt,
                      relatedMessageId: data.relatedMessageId,
                      sentTo: data.sentTo,
                      emailId: data.emailId,
                    };
                    incomingMessages.push(message);
                  } catch (messageError) {
                    console.warn('Skipping invalid inbox message data:', key, messageError);
                  }
                });

              setMessages(incomingMessages);
              setIsLoading(false);
            } catch (processingError) {
              console.error('Error processing inbox messages:', processingError);
              setError('Kunne ikke behandle meldinger');
              setIsLoading(false);
            }
          },
          (listenerError) => {
            console.error('Firebase listener error:', listenerError);
            setError('Kunne ikke lytte til meldinger');
            setIsLoading(false);
          }
        );
      } catch (listenerSetupError) {
        console.error('Error setting up real-time listener:', listenerSetupError);
        setError(
          listenerSetupError instanceof Error
            ? listenerSetupError.message
            : 'Kunne ikke sette opp sanntidsoppdatering'
        );
        setIsLoading(false);
      }
    };

    setupRealtimeListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    setSelectedMessageIds((prev) => prev.filter((id) => messages.some((message) => message.id === id)));
  }, [messages]);

  useEffect(() => {
    if (!selectedMessage) return;
    const latestVersion = messages.find((message) => message.id === selectedMessage.id);
    if (latestVersion && latestVersion !== selectedMessage) {
      setSelectedMessage(latestVersion);
    }
  }, [messages, selectedMessage]);

  useEffect(() => {
    setSelectedMessage(null);
    setSelectedMessageIds([]);
  }, [currentFolder]);

  const folderMessages = useMemo(() => {
    return messages.filter((message) => {
      const messageFolder = message.folder === 'arkiv' ? 'arkiv' : 'innboks';
      const shouldShow = message.type !== 'outgoing_reply' || !message.relatedMessageId;
      return messageFolder === currentFolder && shouldShow;
    });
  }, [messages, currentFolder]);

  const filteredMessages = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    return folderMessages
      .filter((message) => {
        switch (activeQuickFilter) {
          case 'unread':
            return !message.isRead;
          case 'flagged':
            return Boolean(message.isFlagged);
          case 'quote':
            return isQuoteRelatedMessage(message);
          default:
            return true;
        }
      })
      .filter((message) => {
        if (!normalizedQuery) return true;
        const searchable = `${message.subject || ''} ${message.message || ''} ${message.customerName || ''} ${message.from || ''} ${message.quoteTitle || ''}`.toLowerCase();
        return searchable.includes(normalizedQuery);
      })
      .sort((a, b) => {
        const timeA = getMessageActivityTimestamp(a);
        const timeB = getMessageActivityTimestamp(b);
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [folderMessages, activeQuickFilter, searchTerm, sortOrder]);

  const visibleMessageIds = useMemo(() => filteredMessages.map((message) => message.id), [filteredMessages]);
  const visibleMessageIdSet = useMemo(() => new Set(visibleMessageIds), [visibleMessageIds]);
  const allVisibleSelected = visibleMessageIds.length > 0 && visibleMessageIds.every((id) => selectedMessageIds.includes(id));
  const selectionTouchesView = selectedMessageIds.some((id) => visibleMessageIdSet.has(id));
  const selectionCheckboxState: boolean | 'indeterminate' = allVisibleSelected
    ? true
    : selectionTouchesView
    ? 'indeterminate'
    : false;
  const hasSelection = selectedMessageIds.length > 0;

  const unreadCount = useMemo(() => messages.filter((message) => !message.isRead && message.folder !== 'arkiv').length, [messages]);
  const archivedCount = useMemo(() => messages.filter((message) => message.folder === 'arkiv').length, [messages]);
  const flaggedCount = useMemo(
    () => messages.filter((message) => message.isFlagged && message.folder !== 'arkiv').length,
    [messages]
  );
  const quoteMessageCount = useMemo(
    () => messages.filter((message) => isQuoteRelatedMessage(message) && message.folder !== 'arkiv').length,
    [messages]
  );
  const respondedCount = useMemo(() => messages.filter((message) => message.hasReply).length, [messages]);

  const quickFilterCounts = useMemo(() => ({
    all: folderMessages.length,
    unread: folderMessages.filter((message) => !message.isRead).length,
    flagged: folderMessages.filter((message) => message.isFlagged).length,
    quote: folderMessages.filter((message) => isQuoteRelatedMessage(message)).length,
  }), [folderMessages]);

  const statsCards = useMemo(
    () => [
      { label: 'Uleste', value: unreadCount },
      { label: 'Flagget', value: flaggedCount },
      { label: 'Tilknyttet tilbud', value: quoteMessageCount },
      { label: 'Besvart', value: respondedCount },
    ],
    [unreadCount, flaggedCount, quoteMessageCount, respondedCount]
  );

  const quickFilterOptions: Array<{ id: typeof activeQuickFilter; label: string; count: number }> = [
    { id: 'all', label: 'Alle', count: quickFilterCounts.all },
    { id: 'unread', label: 'Uleste', count: quickFilterCounts.unread },
    { id: 'flagged', label: 'Flagget', count: quickFilterCounts.flagged },
    { id: 'quote', label: 'Tilbud', count: quickFilterCounts.quote },
  ];

  const messageCardPadding = viewDensity === 'compact' ? 'p-3' : 'p-4';
  const previewClampClass = viewDensity === 'compact' ? 'line-clamp-1' : 'line-clamp-2';
  const metaSpacingClass = viewDensity === 'compact' ? 'gap-1.5' : 'gap-2';

  const showDialog = (title: string, message: string, type: 'success' | 'error' = 'success') => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogType(type);
    setDialogOpen(true);
  };

  const clearSelection = () => setSelectedMessageIds([]);

  const handleToggleMessageSelection = (messageId: string, shouldSelect?: boolean) => {
    setSelectedMessageIds((prev) => {
      const isSelected = prev.includes(messageId);
      const nextShouldSelect = shouldSelect !== undefined ? shouldSelect : !isSelected;

      if (nextShouldSelect && !isSelected) {
        return [...prev, messageId];
      }

      if (!nextShouldSelect && isSelected) {
        return prev.filter((id) => id !== messageId);
      }

      return prev;
    });
  };

  const handleSelectAllVisible = (shouldSelect: boolean) => {
    if (shouldSelect) {
      setSelectedMessageIds((prev) => Array.from(new Set([...prev, ...visibleMessageIds])));
      return;
    }

    setSelectedMessageIds((prev) => prev.filter((id) => !visibleMessageIdSet.has(id)));
  };

  const handleBulkAction = async (
    action: 'read' | 'unread' | 'archive' | 'unarchive' | 'flag' | 'unflag'
  ) => {
    if (selectedMessageIds.length === 0) return;

    const idsToUpdate = [...selectedMessageIds];
    setIsBulkActionRunning(true);

    try {
      await Promise.all(
        idsToUpdate.map((messageId) => {
          switch (action) {
            case 'read':
              return markMessageAsRead(messageId);
            case 'unread':
              return markMessageAsUnread(messageId);
            case 'archive':
              return archiveInboxMessage(messageId);
            case 'unarchive':
              return unarchiveInboxMessage(messageId);
            case 'flag':
              return flagMessage(messageId);
            case 'unflag':
              return unflagMessage(messageId);
            default:
              return Promise.resolve();
          }
        })
      );

      setMessages((prev) =>
        prev.map((message) => {
          if (!idsToUpdate.includes(message.id)) return message;

          switch (action) {
            case 'read':
              return { ...message, isRead: true };
            case 'unread':
              return { ...message, isRead: false };
            case 'archive':
              return { ...message, folder: 'arkiv' };
            case 'unarchive':
              return { ...message, folder: 'innboks', archivedAt: undefined };
            case 'flag':
              return { ...message, isFlagged: true };
            case 'unflag':
              return { ...message, isFlagged: false };
            default:
              return message;
          }
        })
      );

      if (
        ((action === 'archive' && currentFolder === 'innboks') ||
          (action === 'unarchive' && currentFolder === 'arkiv')) &&
        selectedMessage &&
        idsToUpdate.includes(selectedMessage.id)
      ) {
        setSelectedMessage(null);
      }

      clearSelection();

      const actionLabels: Record<'read' | 'unread' | 'archive' | 'unarchive' | 'flag' | 'unflag', string> = {
        read: 'markert som lest',
        unread: 'markert som ulest',
        archive: 'arkivert',
        unarchive: 'flyttet til innboks',
        flag: 'flagget',
        unflag: 'fjernet flagg',
      };

      showDialog('Suksess', `Meldinger ${actionLabels[action]}.`, 'success');
    } catch (bulkError) {
      console.error('Error performing bulk action:', bulkError);
      showDialog('Feil', 'Kunne ikke utføre handlingen. Prøv igjen.', 'error');
    } finally {
      setIsBulkActionRunning(false);
    }
  };

  const handleMessageClick = async (message: InboxMessage) => {
    if (window.innerWidth < 1024) {
      setSelectedMessage(message);
      setIsMessageDetailOpen(true);
    } else {
      setSelectedMessage(message);
    }

    if (!message.isRead) {
      try {
        await markMessageAsRead(message.id);
        setMessages((prev) =>
          prev.map((m) => (m.id === message.id ? { ...m, isRead: true } : m))
        );
      } catch (readError) {
        console.error('Error marking message as read:', readError);
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
        showDialog('Feil', 'Kunne ikke finne kunden', 'error');
      }
    } catch (customerError) {
      console.error('Error fetching customer:', customerError);
      showDialog('Feil', 'Kunne ikke hente kundedata', 'error');
    }
  };

  const handleQuoteClick = async (quoteId: string) => {
    router.push(`/tilbud/${quoteId}`);
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
      if (!auth.currentUser) {
        throw new Error('Bruker ikke autentisert');
      }

      const userId = auth.currentUser.uid;

      console.log('📧 Sending reply to message:', selectedMessage.id);
      const response = await fetch(`/api/inbox/${selectedMessage.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          replySubject: replySubject,
          replyMessage: replyMessage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send reply');
      }

      const result = await response.json();
      console.log('✅ Reply sent successfully:', result);

      showDialog('Suksess', 'Svar sendt til kunden!', 'success');
      setIsReplying(false);
      setReplySubject('');
      setReplyMessage('');
    } catch (error: any) {
      console.error('❌ Error sending reply:', error);
      showDialog('Feil', error.message || 'Kunne ikke sende svar. Prøv igjen.', 'error');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleCancelReply = () => {
    setIsReplying(false);
    setReplySubject('');
    setReplyMessage('');
  };

  const handleDeleteMessage = async (messageId: string) => {
    console.log('🗑️ Archive button clicked for message:', messageId);
    setMessageToArchive(messageId);
    setConfirmDialogOpen(true);
  };

  const confirmArchiveMessage = async () => {
    if (!messageToArchive) return;

    try {
      console.log('🔄 Attempting to archive message:', messageToArchive);
      await archiveInboxMessage(messageToArchive);
      console.log('✅ Message archived successfully');
      
      // Update the message in state to reflect archive folder
      setMessages(prev =>
        prev.map(m =>
          m.id === messageToArchive ? { ...m, folder: 'arkiv' } : m
        )
      );
      setSelectedMessageIds(prev => prev.filter(id => id !== messageToArchive));
      if (selectedMessage?.id === messageToArchive) {
        setSelectedMessage(null);
      }
      
      setConfirmDialogOpen(false);
      setMessageToArchive(null);
      showDialog('Suksess', 'Melding arkivert', 'success');
    } catch (error) {
      console.error('❌ Error archiving message:', error);
      setConfirmDialogOpen(false);
      setMessageToArchive(null);
      showDialog('Feil', 'Kunne ikke arkivere meldingen. Prøv igjen.', 'error');
    }
  };

  const handleUnarchiveMessage = async (messageId: string) => {
    console.log('📥 Unarchive button clicked for message:', messageId);
    setMessageToUnarchive(messageId);
    setConfirmUnarchiveDialogOpen(true);
  };

  const confirmUnarchiveMessage = async () => {
    if (!messageToUnarchive) return;

    try {
      console.log('🔄 Attempting to unarchive message:', messageToUnarchive);
      await unarchiveInboxMessage(messageToUnarchive);
      console.log('✅ Message unarchived successfully');
      
      // Update the message in state to reflect inbox folder
      setMessages(prev =>
        prev.map(m =>
          m.id === messageToUnarchive ? { ...m, folder: 'innboks', archivedAt: undefined } : m
        )
      );
      setSelectedMessageIds(prev => prev.filter(id => id !== messageToUnarchive));
      if (selectedMessage?.id === messageToUnarchive) {
        setSelectedMessage(null);
      }
      
      setConfirmUnarchiveDialogOpen(false);
      setMessageToUnarchive(null);
      showDialog('Suksess', 'Melding flyttet til innboks', 'success');
    } catch (error) {
      console.error('❌ Error unarchiving message:', error);
      setConfirmUnarchiveDialogOpen(false);
      setMessageToUnarchive(null);
      showDialog('Feil', 'Kunne ikke flytte meldingen til innboks. Prøv igjen.', 'error');
    }
  };

  const handleToggleFlag = async (messageId: string, isCurrentlyFlagged: boolean) => {
    try {
      if (isCurrentlyFlagged) {
        await unflagMessage(messageId);
      } else {
        await flagMessage(messageId);
      }
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId ? { ...m, isFlagged: !isCurrentlyFlagged } : m
        )
      );
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(prev => prev ? { ...prev, isFlagged: !isCurrentlyFlagged } : null);
      }
    } catch (error) {
      console.error('Error toggling flag:', error);
      showDialog('Feil', 'Kunne ikke endre flagg-status. Prøv igjen.', 'error');
    }
  };

  const handleToggleReadState = async (message: InboxMessage) => {
    try {
      if (message.isRead) {
        await markMessageAsUnread(message.id);
      } else {
        await markMessageAsRead(message.id);
      }

      setMessages(prev =>
        prev.map(m =>
          m.id === message.id ? { ...m, isRead: !message.isRead } : m
        )
      );

      setSelectedMessage(prev =>
        prev && prev.id === message.id ? { ...prev, isRead: !message.isRead } : prev
      );
    } catch (toggleError) {
      console.error('Error toggling read state:', toggleError);
      showDialog('Feil', 'Kunne ikke oppdatere lest-status. Prøv igjen.', 'error');
    }
  };

  const handleCreateNewMessage = () => {
    setIsCreatingMessage(true);
    setNewMessageSubject('');
    setNewMessageTo('');
    setNewMessageContent('');
  };

  const handleSendNewMessage = async () => {
    if (!newMessageSubject.trim() || !newMessageTo.trim() || !newMessageContent.trim()) return;

    setIsSendingNewMessage(true);
    try {
      if (!auth.currentUser) {
        throw new Error('Bruker ikke autentisert');
      }

      const userId = auth.currentUser.uid;

      console.log('📧 Sending new message to:', newMessageTo);

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: newMessageTo,
          subject: newMessageSubject,
          message: newMessageContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      const emailResult = await response.json();
      console.log('✅ Email sent:', emailResult);
      const emailId = emailResult.messageId ?? null;

      const outgoingInboxRef = ref(db, `users/${userId}/inbox`);
      const outgoingMessageRef = push(outgoingInboxRef);

      const outgoingMessage: {
        from: string;
        subject: string;
        message: string;
        timestamp: number;
        isRead: boolean;
        type: 'outgoing_reply';
        isFlagged: boolean;
        folder: string;
        sentTo: string;
        opprettet: number;
        oppdatert: number;
        emailId?: string | null;
      } = {
        from: 'Deg',
        subject: newMessageSubject,
        message: newMessageContent,
        timestamp: Date.now(),
        isRead: true,
        type: 'outgoing_reply',
        isFlagged: false,
        folder: 'innboks',
        sentTo: newMessageTo,
        opprettet: Date.now(),
        oppdatert: Date.now(),
      };

      if (emailId) {
        outgoingMessage.emailId = emailId;
      }

      await set(outgoingMessageRef, outgoingMessage);
      console.log('✅ Outgoing message log created in "innboks" folder');

      showDialog('Suksess', 'Melding sendt!', 'success');
      setIsCreatingMessage(false);
      setNewMessageSubject('');
      setNewMessageTo('');
      setNewMessageContent('');
    } catch (error: any) {
      console.error('❌ Error sending new message:', error);
      showDialog('Feil', error.message || 'Kunne ikke sende meldingen. Prøv igjen.', 'error');
    } finally {
      setIsSendingNewMessage(false);
    }
  };

  const handleCancelNewMessage = () => {
    setIsCreatingMessage(false);
    setNewMessageSubject('');
    setNewMessageTo('');
    setNewMessageContent('');
  };


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
    <div>
      <div className="h-full flex flex-col w-full">
        {/* Header */}
        <div className="border-b bg-white">
          <div className="px-4 sm:px-6 py-6 space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Inbox className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold leading-tight">Innboks</h1>
                  <p className="text-sm text-muted-foreground">Alt av kundedialog rundt tilbud samlet ett sted</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={handleCreateNewMessage} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Ny melding
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {statsCards.map((stat) => (
                <div key={stat.label} className="rounded-xl border bg-muted/30 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-semibold mt-1">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Søk i meldinger..."
                  className="pl-10 pr-4"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'asc' | 'desc')}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sorter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Nyeste først</SelectItem>
                    <SelectItem value="asc">Eldste først</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {quickFilterOptions.map((option) => (
                <Button
                  key={option.id}
                  variant={activeQuickFilter === option.id ? 'default' : 'ghost'}
                  size="sm"
                  className={`h-8 rounded-full px-4 text-xs ${activeQuickFilter === option.id ? 'shadow-sm' : 'text-muted-foreground'}`}
                  onClick={() => setActiveQuickFilter(option.id)}
                >
                  {option.label}
                  <span className={`ml-2 text-[0.7rem] ${activeQuickFilter === option.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {option.count}
                  </span>
                </Button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs text-muted-foreground"
                onClick={() => {
                  setSearchTerm('');
                  setActiveQuickFilter('all');
                }}
              >
                Nullstill filter
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-0 h-full overflow-hidden">
          {/* Message List and Detail */}
          <div className="flex flex-col lg:flex-row min-h-0">
            {/* Message List */}
            <div className="lg:w-2/5 border-r flex flex-col min-h-0 bg-muted/5">
              <div className="p-4 border-b space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    {currentFolder === 'innboks' ? 'Innboks' : 'Arkiv'}
                  </h2>
                  {currentFolder === 'innboks' && unreadCount > 0 && (
                    <Badge variant="secondary">{unreadCount} ulest</Badge>
                  )}
                  {currentFolder === 'arkiv' && archivedCount > 0 && (
                    <Badge variant="secondary">{archivedCount} arkivert</Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={currentFolder === 'innboks' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setCurrentFolder('innboks');
                      setSelectedMessage(null);
                    }}
                    className="gap-2"
                  >
                    <Inbox className="h-4 w-4" />
                    Innboks
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                  <Button
                    variant={currentFolder === 'arkiv' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setCurrentFolder('arkiv');
                      setSelectedMessage(null);
                    }}
                    className="gap-2"
                  >
                    <Archive className="h-4 w-4" />
                    Arkiv
                    {archivedCount > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {archivedCount}
                      </Badge>
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      aria-label="Velg alle synlige meldinger"
                      checked={selectionCheckboxState}
                      onCheckedChange={(checked) => handleSelectAllVisible(Boolean(checked))}
                      disabled={filteredMessages.length === 0}
                    />
                    <span>Velg alle</span>
                  </div>
                  <span className="font-medium text-foreground/70">
                    {filteredMessages.length} meldinger
                  </span>
                </div>

                {hasSelection && (
                  <div className="rounded-lg border bg-background/90 px-3 py-2 space-y-2 shadow-sm">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>{selectedMessageIds.length} valgt</span>
                      {isBulkActionRunning && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Jobber...
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 text-xs"
                        disabled={isBulkActionRunning}
                        onClick={() => handleBulkAction('read')}
                      >
                        <MailOpen className="h-3.5 w-3.5" />
                        Lest
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 text-xs"
                        disabled={isBulkActionRunning}
                        onClick={() => handleBulkAction('unread')}
                      >
                        <Mail className="h-3.5 w-3.5" />
                        Ulest
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 text-xs"
                        disabled={isBulkActionRunning}
                        onClick={() => handleBulkAction('flag')}
                      >
                        <Flag className="h-3.5 w-3.5" />
                        Flagg
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 text-xs"
                        disabled={isBulkActionRunning}
                        onClick={() => handleBulkAction('unflag')}
                      >
                        <FlagOff className="h-3.5 w-3.5" />
                        Fjern
                      </Button>
                      {currentFolder === 'innboks' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 text-xs"
                          disabled={isBulkActionRunning}
                          onClick={() => handleBulkAction('archive')}
                        >
                          <Archive className="h-3.5 w-3.5" />
                          Arkiver
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 text-xs"
                          disabled={isBulkActionRunning}
                          onClick={() => handleBulkAction('unarchive')}
                        >
                          <Inbox className="h-3.5 w-3.5" />
                          Til innboks
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-xs"
                        disabled={isBulkActionRunning}
                        onClick={clearSelection}
                      >
                        Tøm utvalg
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <ScrollArea className="flex-1">
                {filteredMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
                    {currentFolder === 'innboks' ? (
                      <>
                        <Inbox className="h-12 w-12 mb-4 text-muted-foreground/70" />
                        <p className="text-base font-medium">Ingen meldinger</p>
                        <p className="text-sm">Nye meldinger vil dukke opp her</p>
                      </>
                    ) : (
                      <>
                        <Archive className="h-12 w-12 mb-4 text-muted-foreground/70" />
                        <p className="text-base font-medium">Ingen arkiverte meldinger</p>
                        <p className="text-sm">Flytt meldinger hit for å rydde innboksen</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    {filteredMessages.map((message) => {
                      const isSelected = selectedMessageIds.includes(message.id);
                      const isActive = selectedMessage?.id === message.id;
                      const isUnread = !message.isRead;

                      return (
                        <Card
                          key={message.id}
                          className={cn(
                            'cursor-pointer border border-transparent bg-background/70 shadow-none backdrop-blur-sm transition-all hover:border-primary/40',
                            (isSelected || isActive) && 'ring-2 ring-primary/60 shadow-sm',
                            isUnread && 'border-primary/40 bg-primary/5',
                            message.isFlagged && 'border-amber-400/70'
                          )}
                          onClick={() => handleMessageClick(message)}
                        >
                          <CardContent className={cn('flex items-start gap-3', messageCardPadding)}>
                            <div className="flex flex-col items-center gap-2 pt-1">
                              <Checkbox
                                aria-label="Velg melding"
                                checked={isSelected}
                                onCheckedChange={(checked) => handleToggleMessageSelection(message.id, Boolean(checked))}
                                onClick={(event) => event.stopPropagation()}
                              />
                              {isUnread && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                            </div>
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarFallback className="text-xs">
                                {message.type === 'outgoing_reply' ? (
                                  <Building2 className="h-3.5 w-3.5" />
                                ) : (
                                  <User className="h-3.5 w-3.5" />
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className={cn('flex flex-wrap items-center justify-between gap-2', metaSpacingClass)}>
                                <div className="flex flex-wrap items-center gap-2 min-w-0">
                                  {message.type === 'outgoing_reply' ? (
                                    <span className="text-sm font-medium truncate">
                                      Til: {message.customerName || message.from}
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        if (message.customerId) {
                                          handleCustomerClick(message.customerId);
                                        }
                                      }}
                                      className="text-sm font-medium hover:text-primary transition-colors truncate"
                                    >
                                      {message.customerName || message.from}
                                    </button>
                                  )}
                                  <Badge variant="outline" className="text-[0.65rem] font-medium">
                                    {getMessageTypeLabel(message.type)}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">{formatDate(message.timestamp)}</span>
                                  <span className="sm:hidden">
                                    {new Date(message.timestamp).toLocaleDateString('nb-NO', { month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <p className={cn('text-sm font-medium text-foreground', isUnread && 'text-primary')}>
                                  {message.subject || 'Uten emne'}
                                </p>
                                <p className={cn('text-xs text-muted-foreground mt-1', previewClampClass)}>
                                  {message.message || 'Ingen forhåndsvisning tilgjengelig'}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-[0.7rem] text-muted-foreground">
                                {message.quoteTitle && (
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      if (message.quoteId) {
                                        handleQuoteClick(message.quoteId);
                                      }
                                    }}
                                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 hover:bg-muted/70"
                                  >
                                    <FileText className="h-3 w-3" />
                                    <span className="truncate max-w-[120px] sm:max-w-[180px]">
                                      {message.quoteTitle}
                                    </span>
                                  </button>
                                )}
                                {message.hasReply && (
                                  <Badge variant="secondary" className="text-[0.65rem]">
                                    Besvart
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {message.isFlagged && <Flag className="h-4 w-4 text-yellow-500" />}
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleToggleFlag(message.id, message.isFlagged || false);
                                  }}
                                >
                                  {message.isFlagged ? <FlagOff className="h-4 w-4" /> : <Flag className="h-4 w-4" />}
                                </Button>
                                {currentFolder === 'innboks' ? (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                    onClick={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      handleDeleteMessage(message.id);
                                    }}
                                    title="Arkiver melding"
                                  >
                                    <Archive className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-green-600"
                                    onClick={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      handleUnarchiveMessage(message.id);
                                    }}
                                    title="Flytt til innboks"
                                  >
                                    <Inbox className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Message Detail - Hidden on mobile/tablet */}
            <div className={`flex-1 flex flex-col hidden lg:block`}>
              {isCreatingMessage && (
                <ScrollArea className="flex-1">
                  <div className="p-4">
                    <Card>
                      <CardHeader>
                        <h4 className="text-lg font-semibold">Ny melding</h4>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Til</label>
                          <Input
                            type="email"
                            value={newMessageTo}
                            onChange={(e) => setNewMessageTo(e.target.value)}
                            placeholder="mottaker@example.com"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Emne</label>
                          <Input
                            type="text"
                            value={newMessageSubject}
                            onChange={(e) => setNewMessageSubject(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Melding</label>
                          <Textarea
                            value={newMessageContent}
                            onChange={(e) => setNewMessageContent(e.target.value)}
                            rows={10}
                            placeholder="Skriv din melding her..."
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleSendNewMessage}
                            disabled={isSendingNewMessage || !newMessageSubject.trim() || !newMessageTo.trim() || !newMessageContent.trim()}
                            className="flex items-center gap-2"
                          >
                            {isSendingNewMessage ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Sender...
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4" />
                                Send melding
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleCancelNewMessage}
                            disabled={isSendingNewMessage}
                          >
                            Avbryt
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              )}
              {!isCreatingMessage && selectedMessage && (
                <>
                  <div className="p-4 border-b">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          {getMessageTypeIcon(selectedMessage.type)}
                          {selectedMessage.isFlagged && <Flag className="h-4 w-4 text-yellow-500" />}
                          <Badge variant="outline">
                            {getMessageTypeLabel(selectedMessage.type)}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">{selectedMessage.subject}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {selectedMessage.type === 'outgoing_reply' ? (
                                  <Building2 className="h-3 w-3" />
                                ) : (
                                  <User className="h-3 w-3" />
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <button
                              onClick={() => selectedMessage.customerId && handleCustomerClick(selectedMessage.customerId)}
                              className="hover:text-primary transition-colors"
                            >
                              {selectedMessage.customerName || selectedMessage.from}
                            </button>
                          </div>
                          <span>•</span>
                          <span>{formatDateLong(selectedMessage.timestamp)}</span>
                        </div>
                        {selectedMessage.quoteTitle && (
                          <div className="flex items-center gap-2 mt-3">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <button
                              onClick={() => selectedMessage.quoteId && handleQuoteClick(selectedMessage.quoteId)}
                              className="text-sm text-primary hover:underline"
                            >
                              {selectedMessage.quoteTitle}
                            </button>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedMessage(null)}
                        className="lg:hidden"
                      >
                        ✕
                      </Button>
                    </div>

                    {!isReplying && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button onClick={handleReply} className="flex items-center gap-2">
                          <Reply className="h-4 w-4" />
                          Svar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-2"
                          onClick={() => selectedMessage && handleToggleReadState(selectedMessage)}
                        >
                          {selectedMessage.isRead ? (
                            <>
                              <Mail className="h-4 w-4" />
                              Marker som ulest
                            </>
                          ) : (
                            <>
                              <MailOpen className="h-4 w-4" />
                              Marker som lest
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleFlag(selectedMessage.id, selectedMessage.isFlagged || false)}
                          className={!selectedMessage.isFlagged ? 'text-yellow-500' : ''}
                        >
                          {!selectedMessage.isFlagged ? <Flag className="h-4 w-4" /> : <FlagOff className="h-4 w-4" />}
                        </Button>
                        {currentFolder === 'innboks' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              console.log('Archive button clicked from detail view');
                              handleDeleteMessage(selectedMessage.id);
                            }}
                            className="text-muted-foreground hover:text-primary"
                            type="button"
                            title="Arkiver melding"
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        )}
                        {currentFolder === 'arkiv' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              console.log('Unarchive button clicked from detail view');
                              handleUnarchiveMessage(selectedMessage.id);
                            }}
                            className="text-muted-foreground hover:text-green-600"
                            type="button"
                            title="Flytt til innboks"
                          >
                            <Inbox className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  <ScrollArea className="flex-1">
                    <div className="p-4">
                      {isReplying ? (
                        <Card>
                          <CardHeader>
                            <h4 className="text-lg font-semibold">Svar på melding</h4>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <label className="text-sm font-medium mb-2 block">Emne</label>
                              <Input
                                type="text"
                                value={replySubject}
                                onChange={(e) => setReplySubject(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-2 block">Melding</label>
                              <Textarea
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                                rows={10}
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
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-6">
                          {/* Original Message */}
                          <Card className={
                            selectedMessage.type === 'outgoing_reply'
                              ? 'border-blue-200 bg-background'
                              : 'border-muted'
                          }>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                                {selectedMessage.type === 'outgoing_reply' ? (
                                  <>
                                    <Building2 className="h-4 w-4 text-blue-600" />
                                    <span className="font-medium text-blue-900">Sendt av deg</span>
                                  </>
                                ) : (
                                  <>
                                    <User className="h-4 w-4" />
                                    <span className="font-medium">{selectedMessage.customerName || selectedMessage.from}</span>
                                  </>
                                )}
                                <span>•</span>
                                <span>{formatDateLong(selectedMessage.timestamp)}</span>
                                {selectedMessage.sentTo && (
                                  <>
                                    <span>•</span>
                                    <span className="text-xs">Sendt til {selectedMessage.sentTo}</span>
                                  </>
                                )}
                              </div>
                              {selectedMessage.message && selectedMessage.type !== 'quote_conversation' && (
                                <p className="whitespace-pre-wrap text-sm">{selectedMessage.message}</p>
                              )}
                              {selectedMessage.type === 'quote_conversation' && (!selectedMessage.conversation || Object.keys(selectedMessage.conversation).length === 0) && (
                                <p className="text-muted-foreground italic">Ingen meldinger i samtalen ennå</p>
                              )}
                              {selectedMessage.emailId && (
                                <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                  E-post sendt (ID: {selectedMessage.emailId.substring(0, 8)}...)
                                </div>
                              )}
                            </CardContent>
                          </Card>

                          {/* Conversation History */}
                          {selectedMessage.conversation && Object.keys(selectedMessage.conversation).length > 0 && (
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                <h4 className="text-sm font-semibold">
                                  {selectedMessage.type === 'quote_conversation' ? 'Meldinger' : 'Samtalehistorikk'} ({Object.keys(selectedMessage.conversation).length})
                                </h4>
                              </div>
                              <div className="space-y-3">
                                {Object.entries(selectedMessage.conversation)
                                  .sort(([, a], [, b]) => (a as ConversationEntry).timestamp - (b as ConversationEntry).timestamp)
                                  .map(([replyId, replyData]) => {
                                    const reply = replyData as ConversationEntry;
                                    return (
                                      <Card
                                        key={replyId}
                                        className={`${
                                          reply.sentBy === 'business'
                                            ? 'border-blue-200 bg-background ml-8'
                                            : 'border-muted mr-8'
                                        }`}
                                      >
                                        <CardContent className="p-4">
                                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                            {reply.sentBy === 'business' ? (
                                              <>
                                                <Building2 className="h-4 w-4 text-blue-600" />
                                                <span className="font-medium text-blue-900">Du</span>
                                              </>
                                            ) : (
                                              <>
                                                <User className="h-4 w-4" />
                                                <span className="font-medium">{selectedMessage.customerName || selectedMessage.from}</span>
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
                                          <p className="whitespace-pre-wrap text-sm">{reply.message}</p>
                                        </CardContent>
                                      </Card>
                                    );
                                  })}
                              </div>
                            </div>
                          )}

                          {selectedMessage.hasReply && (
                            <Alert>
                              <CheckCircle className="h-4 w-4" />
                              <AlertDescription>
                                Besvart {selectedMessage.lastReplyAt && new Date(selectedMessage.lastReplyAt).toLocaleString('nb-NO')}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </>
              )}
              {!isCreatingMessage && !selectedMessage && (
                <div className="flex-1 h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Inbox className="h-12 w-12 mx-auto mb-4" />
                    <p className="text-lg font-medium">Velg en melding</p>
                    <p className="text-sm">Velg en melding fra listen for å se detaljer</p>
                  </div>
                </div>
              )}
            </div>
          </div>
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

      {/* Message Detail Dialog for Mobile */}
      <Dialog open={isMessageDetailOpen} onOpenChange={setIsMessageDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="truncate pr-4">{selectedMessage?.subject}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMessageDetailOpen(false)}
                className="h-8 w-8 p-0 flex-shrink-0"
              >
                ✕
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {selectedMessage && (
            <div className="flex flex-col h-full max-h-[70vh]">
              <div className="p-4 border-b">
                <div className="flex items-center gap-2 mb-3">
                  {getMessageTypeIcon(selectedMessage.type)}
                  {selectedMessage.isFlagged && <Flag className="h-4 w-4 text-yellow-500" />}
                  <Badge variant="outline">
                    {getMessageTypeLabel(selectedMessage.type)}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {selectedMessage.type === 'outgoing_reply' ? (
                          <Building2 className="h-3 w-3" />
                        ) : (
                          <User className="h-3 w-3" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      onClick={() => selectedMessage.customerId && handleCustomerClick(selectedMessage.customerId)}
                      className="hover:text-primary transition-colors"
                    >
                      {selectedMessage.customerName || selectedMessage.from}
                    </button>
                  </div>
                  <span>•</span>
                  <span>{formatDateLong(selectedMessage.timestamp)}</span>
                </div>
                {selectedMessage.quoteTitle && (
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <button
                      onClick={() => selectedMessage.quoteId && handleQuoteClick(selectedMessage.quoteId)}
                      className="text-sm text-primary hover:underline"
                    >
                      {selectedMessage.quoteTitle}
                    </button>
                  </div>
                )}

                {!isReplying && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button onClick={handleReply} className="flex items-center gap-2">
                      <Reply className="h-4 w-4" />
                      Svar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => selectedMessage && handleToggleReadState(selectedMessage)}
                    >
                      {selectedMessage.isRead ? (
                        <>
                          <Mail className="h-4 w-4" />
                          Marker som ulest
                        </>
                      ) : (
                        <>
                          <MailOpen className="h-4 w-4" />
                          Marker som lest
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleFlag(selectedMessage.id, selectedMessage.isFlagged || false)}
                      className={!selectedMessage.isFlagged ? 'text-yellow-500' : ''}
                    >
                      {!selectedMessage.isFlagged ? <Flag className="h-4 w-4" /> : <FlagOff className="h-4 w-4" />}
                    </Button>
                    {currentFolder === 'innboks' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          console.log('Archive button clicked from mobile dialog');
                          handleDeleteMessage(selectedMessage.id);
                        }}
                        className="text-muted-foreground hover:text-primary"
                        type="button"
                        title="Arkiver melding"
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    )}
                    {currentFolder === 'arkiv' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          console.log('Unarchive button clicked from mobile dialog');
                          handleUnarchiveMessage(selectedMessage.id);
                        }}
                        className="text-muted-foreground hover:text-green-600"
                        type="button"
                        title="Flytt til innboks"
                      >
                        <Inbox className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <ScrollArea className="flex-1">
                <div className="p-4">
                  {isReplying ? (
                    <Card>
                      <CardHeader>
                        <h4 className="text-lg font-semibold">Svar på melding</h4>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Emne</label>
                          <Input
                            type="text"
                            value={replySubject}
                            onChange={(e) => setReplySubject(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Melding</label>
                          <Textarea
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            rows={10}
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
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-6">
                      {/* Original Message */}
                      <Card className={
                        selectedMessage.type === 'outgoing_reply'
                          ? 'border-blue-200 bg-background'
                          : 'border-muted'
                      }>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                            {selectedMessage.type === 'outgoing_reply' ? (
                              <>
                                <Building2 className="h-4 w-4 text-blue-600" />
                                <span className="font-medium text-blue-900">Sendt av deg</span>
                              </>
                            ) : (
                              <>
                                <User className="h-4 w-4" />
                                <span className="font-medium">{selectedMessage.customerName || selectedMessage.from}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>{formatDateLong(selectedMessage.timestamp)}</span>
                            {selectedMessage.sentTo && (
                              <>
                                <span>•</span>
                                <span className="text-xs">Sendt til {selectedMessage.sentTo}</span>
                              </>
                            )}
                          </div>
                          {selectedMessage.message && selectedMessage.type !== 'quote_conversation' && (
                            <p className="whitespace-pre-wrap text-sm">{selectedMessage.message}</p>
                          )}
                          {selectedMessage.type === 'quote_conversation' && (!selectedMessage.conversation || Object.keys(selectedMessage.conversation).length === 0) && (
                            <p className="text-muted-foreground italic">Ingen meldinger i samtalen ennå</p>
                          )}
                          {selectedMessage.emailId && (
                            <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              E-post sendt (ID: {selectedMessage.emailId.substring(0, 8)}...)
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Conversation History */}
                      {selectedMessage.conversation && Object.keys(selectedMessage.conversation).length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            <h4 className="text-sm font-semibold">
                              {selectedMessage.type === 'quote_conversation' ? 'Meldinger' : 'Samtalehistorikk'} ({Object.keys(selectedMessage.conversation).length})
                            </h4>
                          </div>
                          <div className="space-y-3">
                            {Object.entries(selectedMessage.conversation)
                              .sort(([, a], [, b]) => (a as ConversationEntry).timestamp - (b as ConversationEntry).timestamp)
                              .map(([replyId, replyData]) => {
                                const reply = replyData as ConversationEntry;
                                return (
                                  <Card
                                    key={replyId}
                                    className={`${
                                      reply.sentBy === 'business'
                                        ? 'border-blue-200 bg-background ml-8'
                                        : 'border-muted mr-8'
                                    }`}
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                        {reply.sentBy === 'business' ? (
                                          <>
                                            <Building2 className="h-4 w-4 text-blue-600" />
                                            <span className="font-medium text-blue-900">Du</span>
                                          </>
                                        ) : (
                                          <>
                                            <User className="h-4 w-4" />
                                            <span className="font-medium">{selectedMessage.customerName || selectedMessage.from}</span>
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
                                      <p className="whitespace-pre-wrap text-sm">{reply.message}</p>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      {selectedMessage.hasReply && (
                        <Alert>
                          <CheckCircle className="h-4 w-4" />
                          <AlertDescription>
                            Besvart {selectedMessage.lastReplyAt && new Date(selectedMessage.lastReplyAt).toLocaleString('nb-NO')}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Archive */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arkiver melding</DialogTitle>
            <DialogDescription>
              Er du sikker på at du vil arkivere denne meldingen? Du kan finne den igjen i arkiv-mappen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmDialogOpen(false);
                setMessageToArchive(null);
              }}
            >
              Avbryt
            </Button>
            <Button onClick={confirmArchiveMessage}>
              Arkiver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Unarchive */}
      <Dialog open={confirmUnarchiveDialogOpen} onOpenChange={setConfirmUnarchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flytt til innboks</DialogTitle>
            <DialogDescription>
              Er du sikker på at du vil flytte denne meldingen tilbake til innboks?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmUnarchiveDialogOpen(false);
                setMessageToUnarchive(null);
              }}
            >
              Avbryt
            </Button>
            <Button onClick={confirmUnarchiveMessage}>
              Flytt til innboks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success/Error Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>
              {dialogMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setDialogOpen(false)}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}