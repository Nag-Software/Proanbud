'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Inbox, Plus, Search, AlertCircle, CheckCircle } from 'lucide-react';
import { CustomerDetailsDrawer } from '@/components/kunder/CustomerDetailsDrawer';
import { QuoteDetailsDrawer } from '@/components/tilbud/QuoteDetailsDrawer';
import { FolderSidebar } from '@/components/inbox/FolderSidebar';
import { MessageList } from '@/components/inbox/MessageList';
import { MessageDetail } from '@/components/inbox/MessageDetail';
import { ComposeMessage } from '@/components/inbox/ComposeMessage';
import { useInbox } from '@/hooks/useInbox';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { Kunde, Tilbud } from '@/lib/types';
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
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState('innboks');
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
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderParent, setNewFolderParent] = useState<string>('none');

  const showDialog = (title: string, message: string, type: 'success' | 'error' = 'success') => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogType(type);
    setDialogOpen(true);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      const parentId = newFolderParent && newFolderParent !== 'none' ? getFolderByName(folders, newFolderParent)?.id : undefined;
      await createFolder(newFolderName.trim(), parentId);
      setNewFolderName('');
      setNewFolderParent('none');
      setIsCreatingFolder(false);
      showDialog('Mappe opprettet', `Mappen "${newFolderName}" ble opprettet.`);
      // Reload folders
      const loadedFolders = await getFolders();
      setFolders(loadedFolders);
    } catch (error) {
      showDialog('Feil', 'Kunne ikke opprette mappe.', 'error');
    }
  };

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    if (!confirm(`Er du sikker på at du vil slette mappen "${folderName}"? Alle meldinger i denne mappen vil flyttes til innboks.`)) {
      return;
    }
    
    try {
      await deleteFolder(folderId);
      showDialog('Mappe slettet', `Mappen "${folderName}" ble slettet.`);
      // Reload folders
      const loadedFolders = await getFolders();
      setFolders(loadedFolders);
      // If deleted folder was selected, switch to inbox
      if (selectedFolder === folderName) {
        setSelectedFolder('innboks');
      }
    } catch (error) {
      showDialog('Feil', 'Kunne ikke slette mappe.', 'error');
    }
  };

  // Recursive folder rendering component
  const FolderItem = ({ folder, depth = 0 }: { folder: Folder; depth?: number }) => {
    const folderMessages = messages.filter(m => (m.folder || 'innboks') === folder.name);
    const folderUnreadCount = folderMessages.filter(m => !m.isRead).length;
    const [contextMenuOpen, setContextMenuOpen] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

    return (
      <div>
        <div
          className="flex items-center group"
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenuPosition({ x: e.clientX, y: e.clientY });
            setContextMenuOpen(true);
          }}
        >
          <button
            onClick={() => setSelectedFolder(folder.name)}
            className={`flex-1 text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
              selectedFolder === folder.name
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
            style={{ paddingLeft: `${12 + depth * 16}px` }}
          >
            <div className="flex items-center gap-2">
              {folder.name === 'innboks' && <Inbox className="h-4 w-4" />}
              {folder.name === 'tilbud' && <FolderIcon className="h-4 w-4" />}
              {folder.name === 'sendt' && <Send className="h-4 w-4" />}
              {folder.name === 'arkiv' && <Archive className="h-4 w-4" />}
              {!['innboks', 'sendt', 'arkiv', 'tilbud'].includes(folder.name) && <FolderIcon className="h-4 w-4" />}
              <span className="capitalize">{folder.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {folderUnreadCount > 0 && (
                <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 text-xs">
                  {folderUnreadCount}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {folderMessages.length}
              </span>
            </div>
          </button>
        </div>
        {contextMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setContextMenuOpen(false)}
            />
            <div
              className="fixed z-50 w-48 bg-popover border border-border rounded-md shadow-md p-1"
              style={{
                left: contextMenuPosition.x,
                top: contextMenuPosition.y,
              }}
            >
              <button
                className="flex items-center w-full px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  setSelectedFolder(folder.name);
                  setContextMenuOpen(false);
                }}
              >
                <Inbox className="h-4 w-4 mr-2" />
                Åpne
              </button>
              {!['innboks', 'sendt', 'arkiv', 'tilbud'].includes(folder.name) && (
                <button
                  className="flex items-center w-full px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground text-destructive"
                  onClick={() => {
                    handleDeleteFolder(folder.id, folder.name);
                    setContextMenuOpen(false);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Slett
                </button>
              )}
            </div>
          </>
        )}
        {folder.children && folder.children.map(child => (
          <FolderItem key={child.id} folder={child} depth={depth + 1} />
        ))}
      </div>
    );
  };

  useEffect(() => {
    let unsubscribe: () => void;

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

        unsubscribe = onValue(inboxRef, (snapshot) => {
          try {
            if (!snapshot.exists()) {
              setMessages([]);
              setIsLoading(false);
              return;
            }

            const messageData = snapshot.val() as Record<string, any>;
            const messages: InboxMessage[] = [];
            const folderSet = new Set<string>(['innboks']);

            Object.entries(messageData)
              .sort(([, a], [, b]) => b.timestamp - a.timestamp)
              .forEach(([key, data]) => {
                try {
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
                  messages.push(message);
                  folderSet.add(message.folder || 'innboks');
                } catch (error) {
                  console.warn('Skipping invalid inbox message data:', key, error);
                }
              });

            setMessages(messages);
            // Folders will be loaded separately
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

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Load folders
  useEffect(() => {
    const loadFolders = async () => {
      try {
        const loadedFolders = await getFolders();
        setFolders(loadedFolders);
      } catch (error) {
        console.error('Error loading folders:', error);
      }
    };
    
    loadFolders();
  }, []);

  // Helper function to get all folder names flat
  const getAllFolderNames = (folders: Folder[]): string[] => {
    const names: string[] = [];
    const traverse = (folderList: Folder[]) => {
      folderList.forEach(folder => {
        if (folder.name && folder.name.trim()) {
          names.push(folder.name);
        }
        if (folder.children) {
          traverse(folder.children);
        }
      });
    };
    traverse(folders);
    return names;
  };

  // Helper function to get folder by name
  const getFolderByName = (folders: Folder[], name: string): Folder | null => {
    for (const folder of folders) {
      if (folder.name === name) return folder;
      if (folder.children) {
        const found = getFolderByName(folder.children, name);
        if (found) return found;
      }
    }
    return null;
  };

  const handleMessageClick = async (message: InboxMessage) => {
    setSelectedMessage(message);
    if (!message.isRead) {
      try {
        await markMessageAsRead(message.id);
        setMessages(prev =>
          prev.map(m =>
            m.id === message.id ? { ...m, isRead: true } : m
          )
        );
      } catch (error) {
        console.error('Error marking message as read:', error);
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
    } catch (error) {
      console.error('Error fetching customer:', error);
      showDialog('Feil', 'Kunne ikke hente kundedata', 'error');
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
        showDialog('Feil', 'Kunne ikke finne tilbudet', 'error');
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
      showDialog('Feil', 'Kunne ikke hente tilbudsdata', 'error');
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
    // Prevent deletion of tilbud messages as they represent important business records
    const message = messages.find(m => m.id === messageId);
    if (message?.folder === 'tilbud') {
      showDialog('Feil', 'Tilbud-meldinger kan ikke slettes da de representerer viktige forretningsoppføringer.', 'error');
      return;
    }

    if (!confirm('Er du sikker på at du vil slette denne meldingen?')) return;

    try {
      await deleteInboxMessage(messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      showDialog('Feil', 'Kunne ikke slette meldingen. Prøv igjen.', 'error');
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

  const handleMoveToFolder = async (messageId: string, folder: string) => {
    try {
      await moveMessageToFolder(messageId, folder);
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId ? { ...m, folder } : m
        )
      );
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(prev => prev ? { ...prev, folder } : null);
      }
    } catch (error) {
      console.error('Error moving message:', error);
      showDialog('Feil', 'Kunne ikke flytte meldingen. Prøv igjen.', 'error');
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

      const outgoingInboxRef = ref(db, `users/${userId}/inbox`);
      const outgoingMessageRef = push(outgoingInboxRef);

      const outgoingMessage = {
        from: 'Deg',
        subject: newMessageSubject,
        message: newMessageContent,
        timestamp: Date.now(),
        isRead: true,
        type: 'outgoing_reply',
        isFlagged: false,
        folder: 'sendt',
        sentTo: newMessageTo,
        emailId: emailResult.messageId,
        opprettet: Date.now(),
        oppdatert: Date.now(),
      };

      await set(outgoingMessageRef, outgoingMessage);
      console.log('✅ Outgoing message log created in "sendt" folder');

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

  const filteredMessages = messages.filter(message => {
    const inCorrectFolder = (message.folder || 'innboks') === selectedFolder;
    const shouldShow = message.type !== 'outgoing_reply' || !message.relatedMessageId;
    return inCorrectFolder && shouldShow;
  });

  const unreadCount = filteredMessages.filter(m => !m.isRead).length;

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
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b bg-white">
          <div className="flex flex-col sm:flex-row h-auto justify-center sm:h-16 items-start sm:items-center px-6 py-4 sm:py-0 gap-4">
            <div className="flex items-center gap-2">
              <Inbox className="h-5 w-5" />
              <h1 className="text-xl font-semibold">Innboks</h1>
            </div>
            <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Søk i meldinger..."
                    className="pl-10 pr-4"
                  />
                </div>
              </div>
            <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-2 flex-1">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button onClick={handleCreateNewMessage} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ny melding
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row overflow-hidden h-full">
          {/* Sidebar - Folders */}
          <div className="w-full lg:w-48 border-r lg:block">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Mapper</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreatingFolder(true)}
                  className="h-6 w-6 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-1">
                {folders.map((folder) => (
                  <FolderItem key={folder.id} folder={folder} />
                ))}
              </div>
            </div>
          </div>

          {/* Message List and Detail */}
          <div className="flex-1 flex flex-col lg:flex-row min-h-0">
            {/* Message List */}
            <div className="lg:w-2/5 border-r flex flex-col min-h-0 min-w-[430px]">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold capitalize">{selectedFolder}</h2>
                  {unreadCount > 0 && (
                    <Badge variant="secondary">
                      {unreadCount} ulest
                    </Badge>
                  )}
                </div>
              </div>

              <ScrollArea className="flex-1 max-h-[calc(100vh-200px)]">
                {filteredMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <Inbox className="h-12 w-12 mb-4" />
                    <p className="text-lg font-medium">Ingen meldinger</p>
                    <p className="text-sm">Nye meldinger vil dukke opp her</p>
                  </div>
                ) : (
                  <div className="p-3 grid grid-cols-1 gap-2 w-full">
                    {filteredMessages.map((message) => (
                      <Card
                        key={message.id}
                        className={`cursor-pointer transition-all w-full hover:shadow-md ${
                          selectedMessage?.id === message.id
                            ? 'ring-2 ring-primary bg-background'
                            : !message.isRead
                            ? 'bg-background'
                            : ''
                        }`}
                        onClick={() => handleMessageClick(message)}
                      >
                        <CardContent className="p-3 h-34">
                          <div className="flex items-start gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {message.type === 'outgoing_reply' ? (
                                  <Building2 className="h-4 w-4" />
                                ) : (
                                  <User className="h-4 w-4" />
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  {message.type === 'outgoing_reply' ? (
                                    <span className="text-sm font-medium">
                                      Til: {message.customerName || message.from}
                                    </span>
                                  ) : (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (message.customerId) {
                                          handleCustomerClick(message.customerId);
                                        }
                                      }}
                                      className="text-sm font-medium hover:text-primary transition-colors truncate"
                                    >
                                      {message.customerName || message.from}
                                    </button>
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    {getMessageTypeLabel(message.type)}
                                  </Badge>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                      {/*getMessageTypeIcon(message.type)*/}
                                      {message.isFlagged && <Flag className="h-3 w-3 text-yellow-500" />}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {formatDate(message.timestamp)}
                                </div>
                              </div>
                              <p className={`text-sm truncate ${
                                !message.isRead ? 'font-medium' : ''
                              }`}>
                                {message.subject}
                              </p>
                              <p className="text-xs text-muted-foreground truncate hidden sm:block">
                                {message.message}
                              </p>
                              {message.quoteTitle && (
                                <div className="flex items-center gap-1 mt-1">
                                  <FileText className="h-3 w-3 text-muted-foreground" />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (message.quoteId) {
                                        handleQuoteClick(message.quoteId);
                                      }
                                    }}
                                    className="text-xs text-primary hover:underline"
                                  >
                                    {message.quoteTitle}
                                  </button>
                                </div>
                              )}
                              <div className="flex items-center float-right justify-between">
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleFlag(message.id, message.isFlagged || false);
                                    }}
                                    className="h-8 w-8 p-0"
                                  >
                                    {!message.isFlagged ? (
                                      <Flag className="h-4 w-4 text-yellow-500" />
                                    ) : (
                                      <FlagOff className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteMessage(message.id);
                                    }}
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Message Detail */}
            <div className={`flex-1 flex flex-col ${selectedMessage || isCreatingMessage ? 'block' : 'hidden lg:block'}`}>
              {isCreatingMessage ? (
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
              ) : selectedMessage ? (
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
                        <Select
                          value={(selectedMessage.folder && selectedMessage.folder.trim()) || 'innboks'}
                          onValueChange={(value) => handleMoveToFolder(selectedMessage.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getAllFolderNames(folders).filter(name => name && name.trim()).map((folderName) => (
                              <SelectItem key={folderName} value={folderName}>
                                {folderName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleFlag(selectedMessage.id, selectedMessage.isFlagged || false)}
                          className={!selectedMessage.isFlagged ? 'text-yellow-500' : ''}
                        >
                          {!selectedMessage.isFlagged ? <Flag className="h-4 w-4" /> : <FlagOff className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMessage(selectedMessage.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
              ) : (
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

      {/* Create Folder Dialog */}
      <Dialog open={isCreatingFolder} onOpenChange={setIsCreatingFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Opprett ny mappe</DialogTitle>
            <DialogDescription>
              Legg til en ny mappe for å organisere meldingene dine.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Mappenavn</label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Skriv inn mappenavn"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Overordnet mappe (valgfritt)</label>
              <Select value={newFolderParent} onValueChange={setNewFolderParent}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg overordnet mappe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ingen (rotmappe)</SelectItem>
                  {getAllFolderNames(folders).filter(name => name && name.trim()).map((folderName) => (
                    <SelectItem key={folderName} value={folderName}>
                      {folderName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatingFolder(false)}>
              Avbryt
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Opprett mappe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialogType === 'error' ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              {dialogTitle}
            </DialogTitle>
            <DialogDescription>{dialogMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setDialogOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}