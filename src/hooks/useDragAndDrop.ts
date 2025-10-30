'use client';

import { useState, useCallback } from 'react';
import { InboxMessage } from '@/lib/types';

export function useDragAndDrop(onMoveMessage: (messageId: string, folderName: string) => Promise<void>) {
  const [draggedMessage, setDraggedMessage] = useState<InboxMessage | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);

  const handleDragStart = useCallback((message: InboxMessage) => {
    setDraggedMessage(message);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedMessage(null);
    setDragOverFolder(null);
  }, []);

  const handleDragOver = useCallback((folderName: string) => {
    setDragOverFolder(folderName);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverFolder(null);
  }, []);

  const handleDrop = useCallback(async (folderName: string) => {
    if (draggedMessage && draggedMessage.folder !== folderName) {
      try {
        await onMoveMessage(draggedMessage.id, folderName);
      } catch (error) {
        console.error('Error moving message:', error);
      }
    }
    setDraggedMessage(null);
    setDragOverFolder(null);
  }, [draggedMessage, onMoveMessage]);

  return {
    draggedMessage,
    dragOverFolder,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}