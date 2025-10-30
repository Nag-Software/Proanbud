'use client';

import { useState, useEffect, useCallback } from 'react';
import { InboxMessage, Folder, Kunde, Tilbud } from '@/lib/types';
import {
  markMessageAsRead,
  deleteInboxMessage,
  flagMessage,
  unflagMessage,
  moveMessageToFolder,
  getFolders,
  createFolder,
  deleteFolder
} from '@/lib/services/inboxService';
import { getCustomer } from '@/lib/services/customerService';
import { getTilbudById } from '@/lib/services/tilbudService';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase';

export function useInbox() {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState('innboks');
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load folders
  const loadFolders = useCallback(async () => {
    try {
      const loadedFolders = await getFolders();
      setFolders(loadedFolders);
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  }, []);

  // Setup real-time listener for messages
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
    loadFolders();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [loadFolders]);

  // Filter messages based on selected folder
  const filteredMessages = messages.filter(message => {
    const inCorrectFolder = (message.folder || 'innboks') === selectedFolder;
    // Fix: Don't filter out sent messages that don't have relatedMessageId
    return inCorrectFolder;
  });

  const unreadCount = filteredMessages.filter(m => !m.isRead).length;

  // Actions
  const handleMessageClick = useCallback(async (message: InboxMessage) => {
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
  }, []);

  const handleToggleFlag = useCallback(async (messageId: string, isCurrentlyFlagged: boolean) => {
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
      throw error;
    }
  }, [selectedMessage]);

  const handleMoveToFolder = useCallback(async (messageId: string, folder: string) => {
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
      throw error;
    }
  }, [selectedMessage]);

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    // Prevent deletion of tilbud messages as they represent important business records
    const message = messages.find(m => m.id === messageId);
    if (message?.folder === 'tilbud') {
      throw new Error('Tilbud-meldinger kan ikke slettes da de representerer viktige forretningsoppføringer.');
    }

    try {
      await deleteInboxMessage(messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }, [messages, selectedMessage]);

  const handleCreateFolder = useCallback(async (name: string, parentId?: string) => {
    try {
      await createFolder(name, parentId);
      await loadFolders();
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }, [loadFolders]);

  const handleDeleteFolder = useCallback(async (folderId: string, folderName: string) => {
    try {
      await deleteFolder(folderId);
      await loadFolders();
      // If deleted folder was selected, switch to inbox
      if (selectedFolder === folderName) {
        setSelectedFolder('innboks');
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
      throw error;
    }
  }, [loadFolders, selectedFolder]);

  const handleCustomerClick = useCallback(async (customerId: string): Promise<Kunde> => {
    try {
      const customer = await getCustomer(customerId);
      if (!customer) {
        throw new Error('Kunne ikke finne kunden');
      }
      return customer;
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  }, []);

  const handleQuoteClick = useCallback(async (quoteId: string): Promise<Tilbud> => {
    try {
      const quote = await getTilbudById(quoteId);
      if (!quote) {
        throw new Error('Kunne ikke finne tilbudet');
      }
      return quote;
    } catch (error) {
      console.error('Error fetching quote:', error);
      throw error;
    }
  }, []);

  return {
    // State
    messages: filteredMessages,
    allMessages: messages,
    folders,
    selectedFolder,
    selectedMessage,
    isLoading,
    error,
    unreadCount,

    // Actions
    setSelectedFolder,
    setSelectedMessage,
    handleMessageClick,
    handleToggleFlag,
    handleMoveToFolder,
    handleDeleteMessage,
    handleCreateFolder,
    handleDeleteFolder,
    handleCustomerClick,
    handleQuoteClick,
  };
}