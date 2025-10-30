'use client';

import { useState } from 'react';
import { Folder, InboxMessage } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Inbox,
  Send,
  Archive,
  Folder as FolderIcon,
  Plus,
  Trash2
} from 'lucide-react';

interface FolderSidebarProps {
  folders: Folder[];
  selectedFolder: string;
  messages: InboxMessage[];
  onFolderSelect: (folderName: string) => void;
  onCreateFolder: (name: string, parentId?: string) => Promise<void>;
  onDeleteFolder: (folderId: string, folderName: string) => Promise<void>;
  dragOverFolder?: string | null;
  onDragOver?: (folderName: string) => void;
  onDragLeave?: () => void;
  onDrop?: (folderName: string) => void;
}

const getFolderIcon = (folderName: string) => {
  switch (folderName) {
    case 'innboks':
      return <Inbox className="h-4 w-4" />;
    case 'sendt':
      return <Send className="h-4 w-4" />;
    case 'arkiv':
      return <Archive className="h-4 w-4" />;
    default:
      return <FolderIcon className="h-4 w-4" />;
  }
};

const FolderItem = ({
  folder,
  depth = 0,
  selectedFolder,
  messages,
  onFolderSelect,
  onDeleteFolder,
  dragOverFolder,
  onDragOver,
  onDragLeave,
  onDrop
}: {
  folder: Folder;
  depth?: number;
  selectedFolder: string;
  messages: InboxMessage[];
  onFolderSelect: (folderName: string) => void;
  onDeleteFolder: (folderId: string, folderName: string) => Promise<void>;
  dragOverFolder?: string | null;
  onDragOver?: (folderName: string) => void;
  onDragLeave?: () => void;
  onDrop?: (folderName: string) => void;
}) => {
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

  // Count messages in this folder (including unread)
  const folderMessages = messages.filter(m => (m.folder || 'innboks') === folder.name);
  const unreadCount = folderMessages.filter(m => !m.isRead).length;
  const totalCount = folderMessages.length;

  const isDefaultFolder = ['innboks', 'sendt', 'arkiv', 'tilbud'].includes(folder.name);

  return (
    <div>
      <div
        className="group relative"
        onContextMenu={(e) => {
          e.preventDefault();
          if (!isDefaultFolder) {
            setContextMenuPosition({ x: e.clientX, y: e.clientY });
            setContextMenuOpen(true);
          }
        }}
      >
        <button
          onClick={() => onFolderSelect(folder.name)}
          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all flex items-center justify-between hover:bg-accent hover:text-accent-foreground ${
            selectedFolder === folder.name
              ? 'bg-primary text-primary-foreground shadow-sm'
              : dragOverFolder === folder.name
              ? 'bg-accent border-2 border-dashed border-primary'
              : 'text-muted-foreground'
          }`}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            onDragOver?.(folder.name);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            onDragLeave?.();
          }}
          onDrop={(e) => {
            e.preventDefault();
            onDrop?.(folder.name);
          }}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {getFolderIcon(folder.name)}
            <span className="capitalize truncate">{folder.name}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="h-5 w-5 rounded-full p-0 text-xs font-medium"
              >
                {unreadCount}
              </Badge>
            )}
            {totalCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {totalCount}
              </span>
            )}
          </div>
        </button>

        {/* Context menu for custom folders */}
        {contextMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setContextMenuOpen(false)}
            />
            <div
              className="fixed z-50 w-48 bg-popover border border-border rounded-md shadow-lg p-1"
              style={{
                left: contextMenuPosition.x,
                top: contextMenuPosition.y,
              }}
            >
              <button
                className="flex items-center w-full px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  onFolderSelect(folder.name);
                  setContextMenuOpen(false);
                }}
              >
                <Inbox className="h-4 w-4 mr-2" />
                Åpne
              </button>
              <button
                className="flex items-center w-full px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-destructive text-destructive"
                onClick={() => {
                  onDeleteFolder(folder.id, folder.name);
                  setContextMenuOpen(false);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Slett
              </button>
            </div>
          </>
        )}
      </div>

      {/* Render children */}
      {folder.children && folder.children.map(child => (
        <FolderItem
          key={child.id}
          folder={child}
          depth={depth + 1}
          selectedFolder={selectedFolder}
          messages={messages}
          onFolderSelect={onFolderSelect}
          onDeleteFolder={onDeleteFolder}
          dragOverFolder={dragOverFolder}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        />
      ))}
    </div>
  );
};

export function FolderSidebar({
  folders,
  selectedFolder,
  messages,
  onFolderSelect,
  onCreateFolder,
  onDeleteFolder,
  dragOverFolder,
  onDragOver,
  onDragLeave,
  onDrop
}: FolderSidebarProps) {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderParent, setNewFolderParent] = useState<string>('none');

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const parentId = newFolderParent && newFolderParent !== 'none'
        ? folders.find(f => f.name === newFolderParent)?.id
        : undefined;

      await onCreateFolder(newFolderName.trim(), parentId);
      setNewFolderName('');
      setNewFolderParent('none');
      setIsCreatingFolder(false);
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const getAllFolderNames = (folderList: Folder[]): string[] => {
    const names: string[] = [];
    const traverse = (folders: Folder[]) => {
      folders.forEach(folder => {
        if (folder.name && folder.name.trim()) {
          names.push(folder.name);
        }
        if (folder.children) {
          traverse(folder.children);
        }
      });
    };
    traverse(folderList);
    return names;
  };

  return (
    <>
      <div className="w-full border-r bg-card">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Mapper</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCreatingFolder(true)}
              className="h-8 w-8 p-0 hover:bg-accent"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-1">
            {folders.map((folder) => (
              <FolderItem
                key={folder.id}
                folder={folder}
                selectedFolder={selectedFolder}
                messages={messages}
                onFolderSelect={onFolderSelect}
                onDeleteFolder={onDeleteFolder}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Create Folder Dialog */}
      <Dialog open={isCreatingFolder} onOpenChange={setIsCreatingFolder}>
        <DialogContent className="sm:max-w-md">
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateFolder();
                  }
                }}
              />
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
    </>
  );
}