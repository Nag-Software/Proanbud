import {
  ref,
  push,
  set,
  get,
  update,
  remove,
  query,
  orderByChild,
  limitToLast,
  equalTo,
  DataSnapshot,
  serverTimestamp,
  Database
} from 'firebase/database';
import { db, testFirebaseConnection } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import { InboxMessage } from '@/lib/types';

export interface RealtimeInboxMessage extends Omit<InboxMessage, 'id' | 'timestamp'> {
  timestamp: number; // Unix timestamp in milliseconds
  opprettet: number;
  oppdatert: number;
}

export interface RealtimeInboxMessageInput extends Omit<InboxMessage, 'id' | 'timestamp'> {
  timestamp: number | object; // For server timestamps during creation
  opprettet: number | object;
  oppdatert: number | object;
}

// Helper function to get user-scoped path
const getUserPath = (userId: string, collection: string) => `users/${userId}/${collection}`;

// Helper function to ensure user is authenticated
const getCurrentUserId = (): string => {
  if (!auth.currentUser) {
    throw new Error('User not authenticated. Please log in.');
  }
  return auth.currentUser.uid;
};

// Convert Realtime Database data to InboxMessage type
const convertRealtimeInboxMessage = (key: string, data: RealtimeInboxMessage): InboxMessage => {
  if (!data) {
    throw new Error('Invalid inbox message data');
  }

  return {
    id: key,
    from: data.from,
    subject: data.subject,
    message: data.message,
    timestamp: new Date(data.timestamp).toISOString().slice(0, 16).replace('T', ' '), // Format as YYYY-MM-DD HH:MM
    isRead: data.isRead,
    quoteId: data.quoteId,
    customerId: data.customerId,
    type: data.type,
    customerName: data.customerName,
    quoteTitle: data.quoteTitle,
    isFlagged: data.isFlagged || false,
    folder: data.folder || 'innboks',
  };
};

// Convert single snapshot to InboxMessage type
const convertSingleRealtimeInboxMessage = (snapshot: DataSnapshot): InboxMessage => {
  const data = snapshot.val() as RealtimeInboxMessage;

  if (!data || !snapshot.exists()) {
    throw new Error('Invalid inbox message data');
  }

  return {
    id: snapshot.key!,
    from: data.from,
    subject: data.subject,
    message: data.message,
    timestamp: new Date(data.timestamp).toISOString().slice(0, 16).replace('T', ' '), // Format as YYYY-MM-DD HH:MM
    isRead: data.isRead,
    quoteId: data.quoteId,
    customerId: data.customerId,
    type: data.type,
    customerName: data.customerName,
    quoteTitle: data.quoteTitle,
    isFlagged: data.isFlagged || false,
    folder: data.folder || 'innboks',
  };
};

// Enhanced error handling function for Realtime Database
const handleDatabaseError = (error: any, operation: string): Error => {
  console.error(`Firebase Realtime Database ${operation} error:`, error);
  console.error('Error details:', {
    code: error.code,
    message: error.message,
    stack: error.stack
  });

  if (error.code) {
    switch (error.code) {
      case 'PERMISSION_DENIED':
        return new Error(`Ingen tilgang: Du har ikke tilgang til å ${operation}. Sjekk Database security rules.`);

      case 'NETWORK_ERROR':
        return new Error(`Nettverksfeil: Sjekk internettforbindelsen.`);

      case 'DISCONNECTED':
        return new Error(`Frakoblet: Database er midlertidig utilgjengelig.`);

      case 'DATA_STALE':
        return new Error(`Utdaterte data: Prøv å laste inn siden på nytt.`);

      case 'USER_CODE_EXCEPTION':
        return new Error(`Ugyldig input: Sjekk data som sendes inn.`);

      case 'INVALID_DATA':
        return new Error(`Ugyldig data: Data formatet er ikke støttet.`);

      default:
        return new Error(`Firebase feil (${error.code}): ${error.message || `Kunne ikke ${operation}`}`);
    }
  }

  // Check for network/connection issues
  if (error.message?.includes('network') || error.message?.includes('offline')) {
    return new Error(`Nettverksproblem: Sjekk internettforbindelsen og Firebase-konfigurasjonen.`);
  }

  // Generic error with more details
  return new Error(`Kunne ikke ${operation}: ${error.message || 'Ukjent feil'}`);
};

// Test connection before operations
const ensureConnection = async (): Promise<void> => {
  console.log('🔍 Checking Firebase Realtime Database connection...');

  const isConnected = await testFirebaseConnection();
  if (!isConnected) {
    console.error('❌ Firebase connection test failed');
    throw new Error('Firebase tilkobling feilet. Sjekk:\n1. Internettforbindelse\n2. Realtime Database er aktivert i Firebase Console\n3. Database security rules tillater tilgang\n4. Database URL er korrekt');
  }

  console.log('✅ Firebase connection verified');
};

// Create a new inbox message
export const createInboxMessage = async (messageData: Omit<InboxMessage, 'id'>): Promise<string> => {
  try {
    // Test connection first
    await ensureConnection();

    // Get current user ID
    const userId = getCurrentUserId();

    const now = serverTimestamp();
    const newMessage: Omit<RealtimeInboxMessageInput, 'id'> = {
      from: messageData.from.trim(),
      subject: messageData.subject.trim(),
      message: messageData.message.trim(),
      timestamp: now,
      isRead: messageData.isRead || false,
      quoteId: messageData.quoteId,
      customerId: messageData.customerId,
      type: messageData.type,
      customerName: messageData.customerName,
      quoteTitle: messageData.quoteTitle,
      isFlagged: messageData.isFlagged || false,
      folder: messageData.folder || 'innboks',
      opprettet: now,
      oppdatert: now,
    };

    // Add to user's Realtime Database path
    const messagesRef = ref(db, getUserPath(userId, 'inbox'));
    const newMessageRef = push(messagesRef);
    await set(newMessageRef, newMessage);

    return newMessageRef.key!;
  } catch (error) {
    throw handleDatabaseError(error, 'opprette innboks melding');
  }
};

// Get all inbox messages
export const getInboxMessages = async (): Promise<InboxMessage[]> => {
  try {
    // Test connection first
    await ensureConnection();

    // Get current user ID
    const userId = getCurrentUserId();

    const messagesRef = ref(db, getUserPath(userId, 'inbox'));

    const snapshot = await get(messagesRef);

    if (!snapshot.exists()) {
      return [];
    }

    const messages: InboxMessage[] = [];
    const messageData = snapshot.val() as Record<string, RealtimeInboxMessage>;

    // Convert to array and sort by timestamp (descending - newest first)
    Object.entries(messageData)
      .sort(([, a], [, b]) => b.timestamp - a.timestamp)
      .forEach(([key, data]) => {
        try {
          messages.push(convertRealtimeInboxMessage(key, data));
        } catch (error) {
          console.warn('Skipping invalid inbox message data:', key, error);
        }
      });

    return messages;
  } catch (error) {
    throw handleDatabaseError(error, 'hente innboks meldinger');
  }
};

// Get a single inbox message by ID
export const getInboxMessage = async (messageId: string): Promise<InboxMessage | null> => {
  try {
    // Test connection first
    await ensureConnection();

    // Get current user ID
    const userId = getCurrentUserId();

    const messageRef = ref(db, `${getUserPath(userId, 'inbox')}/${messageId}`);
    const snapshot = await get(messageRef);

    if (!snapshot.exists()) {
      return null;
    }

    return convertSingleRealtimeInboxMessage(snapshot);
  } catch (error) {
    throw handleDatabaseError(error, 'hente innboks melding');
  }
};

// Update an inbox message (e.g., mark as read/unread)
export const updateInboxMessage = async (messageId: string, updates: Partial<Omit<InboxMessage, 'id' | 'timestamp'>>): Promise<void> => {
  try {
    // Test connection first
    await ensureConnection();

    // Get current user ID
    const userId = getCurrentUserId();

    const now = serverTimestamp();
    const updateData: Partial<RealtimeInboxMessageInput> = {
      oppdatert: now,
    };

    // Map the updates to Firebase format
    if (updates.from !== undefined) updateData.from = updates.from.trim();
    if (updates.subject !== undefined) updateData.subject = updates.subject.trim();
    if (updates.message !== undefined) updateData.message = updates.message.trim();
    if (updates.isRead !== undefined) updateData.isRead = updates.isRead;
    if (updates.quoteId !== undefined) updateData.quoteId = updates.quoteId;
    if (updates.customerId !== undefined) updateData.customerId = updates.customerId;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.customerName !== undefined) updateData.customerName = updates.customerName;
    if (updates.quoteTitle !== undefined) updateData.quoteTitle = updates.quoteTitle;
    if (updates.isFlagged !== undefined) updateData.isFlagged = updates.isFlagged;
    if (updates.folder !== undefined) updateData.folder = updates.folder;

    const messageRef = ref(db, `${getUserPath(userId, 'inbox')}/${messageId}`);
    await update(messageRef, updateData);
  } catch (error) {
    throw handleDatabaseError(error, 'oppdatere innboks melding');
  }
};

// Delete an inbox message
export const deleteInboxMessage = async (messageId: string): Promise<void> => {
  try {
    // Test connection first
    await ensureConnection();

    // Get current user ID
    const userId = getCurrentUserId();

    const messageRef = ref(db, `${getUserPath(userId, 'inbox')}/${messageId}`);
    await remove(messageRef);
  } catch (error) {
    throw handleDatabaseError(error, 'slette innboks melding');
  }
};

// Mark message as read
export const markMessageAsRead = async (messageId: string): Promise<void> => {
  await updateInboxMessage(messageId, { isRead: true });
};

// Mark message as unread
export const markMessageAsUnread = async (messageId: string): Promise<void> => {
  await updateInboxMessage(messageId, { isRead: false });
};

// Get unread message count
export const getUnreadMessageCount = async (): Promise<number> => {
  try {
    const messages = await getInboxMessages();
    return messages.filter(message => !message.isRead).length;
  } catch (error) {
    console.error('Error getting unread message count:', error);
    return 0;
  }
};

// Flag/unflag messages
export const flagMessage = async (messageId: string): Promise<void> => {
  await updateInboxMessage(messageId, { isFlagged: true });
};

export const unflagMessage = async (messageId: string): Promise<void> => {
  await updateInboxMessage(messageId, { isFlagged: false });
};

// Move message to folder
export const moveMessageToFolder = async (messageId: string, folder: string): Promise<void> => {
  await updateInboxMessage(messageId, { folder });
};

// Get messages by folder
export const getMessagesByFolder = async (folder: string): Promise<InboxMessage[]> => {
  try {
    const messages = await getInboxMessages();
    return messages.filter(message => (message.folder || 'innboks') === folder);
  } catch (error) {
    throw handleDatabaseError(error, 'hente meldinger fra mappe');
  }
};

// Get all folders
export const getFolders = async (): Promise<string[]> => {
  try {
    const messages = await getInboxMessages();
    const folders = new Set<string>(['innboks']);
    messages.forEach(message => {
      if (message.folder) {
        folders.add(message.folder);
      }
    });
    return Array.from(folders).sort();
  } catch (error) {
    throw handleDatabaseError(error, 'hente mapper');
  }
};