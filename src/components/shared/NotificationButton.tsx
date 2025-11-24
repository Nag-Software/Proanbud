'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { InboxMessage } from '@/lib/types';
import { getInboxMessages, markMessageAsRead } from '@/lib/services/inboxService';
import { ref, onValue, off } from 'firebase/database';
import { db, auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

const formatTimeAgo = (dateInput: number | string) => {
  const date = typeof dateInput === 'number' ? new Date(dateInput) : new Date(dateInput);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'Nå';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min siden`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} timer siden`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} dager siden`;
  
  return date.toLocaleDateString('nb-NO', { day: '2-digit', month: '2-digit' });
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

const msgTimestampForSort = (message: InboxMessage) => {
  if (message.lastMessageAt) {
    return message.lastMessageAt;
  }

  const parsed = Date.parse(message.timestamp);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const NotificationButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState<InboxMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupRealtimeListener = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.log('No authenticated user');
          return;
        }

        const messagesRef = ref(db, `users/${user.uid}/inbox`);

        unsubscribe = onValue(
          messagesRef,
          (snapshot) => {
            const data = snapshot.val();
            if (!data) {
              setUnreadMessages([]);
              setUnreadCount(0);
              return;
            }

            const messagesArray: InboxMessage[] = Object.entries(data)
              .map(([key, value]: [string, any]) => {
                const activityTimestamp = value.lastMessageAt || value.oppdatert || value.timestamp;
                const formattedTimestamp = activityTimestamp
                  ? new Date(activityTimestamp).toISOString().slice(0, 16).replace('T', ' ')
                  : new Date().toISOString().slice(0, 16).replace('T', ' ');

                return {
                  id: key,
                  from: value.from,
                  subject: value.subject,
                  message: value.message,
                  timestamp: formattedTimestamp,
                  isRead: value.isRead,
                  quoteId: value.quoteId,
                  customerId: value.customerId,
                  type: value.type,
                  customerName: value.customerName,
                  quoteTitle: value.quoteTitle,
                  isFlagged: value.isFlagged || false,
                  folder: value.folder || 'innboks',
                  lastMessageAt: value.lastMessageAt,
                };
              })
              .filter(msg => !msg.isRead && (msg.folder === 'innboks' || msg.folder === 'tilbud'))
              .sort((a, b) => {
                const timeA = msgTimestampForSort(a);
                const timeB = msgTimestampForSort(b);
                return timeB - timeA;
              })
              .slice(0, 5); // Show only latest 5 unread messages

            setUnreadMessages(messagesArray);
            setUnreadCount(messagesArray.length);
          },
          (error) => {
            console.error('Error listening to inbox messages:', error);
          }
        );
      } catch (error) {
        console.error('Error setting up inbox listener:', error);
      }
    };

    setupRealtimeListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = async (message: InboxMessage) => {
    try {
      if (!message.isRead) {
        await markMessageAsRead(message.id);
      }
      setIsOpen(false);
      router.push('/innboks');
    } catch (error) {
      console.error('Error marking message as read:', error);
      router.push('/innboks');
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    router.push('/innboks');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-muted-text hover:text-text hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div>
          {/* Mobile: Full screen overlay */}
          <div className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999]" onClick={() => setIsOpen(false)} />
          
          {/* Notification dropdown */}
          <div className="fixed lg:absolute left-2 right-2 lg:left-0 lg:right-auto top-16 lg:top-auto mt-0 lg:mt-2 w-auto lg:w-80 max-w-md lg:max-w-none bg-white rounded-lg shadow-lg border border-gray-200 z-[9999]">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-text">Varsler</h3>
                {unreadCount > 0 && (
                  <span className="text-xs text-muted-text">
                    {unreadCount} ulest{unreadCount !== 1 ? 'e' : ''}
                  </span>
                )}
              </div>
            </div>

          <div className="max-h-96 overflow-y-auto">
            {unreadMessages.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-muted-text">Ingen nye varsler</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {unreadMessages.map((message) => (
                  <button
                    key={message.id}
                    onClick={() => handleNotificationClick(message)}
                    className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-primary">
                            {getMessageTypeLabel(message.type)}
                          </span>
                          <span className="text-xs text-muted-text">
                            {formatTimeAgo(message.lastMessageAt ?? message.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-text truncate mb-1">
                          {message.subject}
                        </p>
                        {message.customerName && (
                          <p className="text-xs text-muted-text truncate">
                            Fra: {message.customerName}
                          </p>
                        )}
                      </div>
                      {!message.isRead && (
                        <div className="h-2 w-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {unreadMessages.length > 0 && (
            <div className="p-3 border-t border-gray-200">
              <button
                onClick={handleViewAll}
                className="w-full py-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Se alle meldinger
              </button>
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  );
};
