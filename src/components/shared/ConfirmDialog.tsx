import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ConfirmDialogState } from '@/hooks/useConfirmDialog';

interface ConfirmDialogProps {
  dialogState: ConfirmDialogState | null;
}

export function ConfirmDialog({ dialogState }: ConfirmDialogProps) {
  if (!dialogState) return null;

  return (
    <AlertDialog open={dialogState.isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dialogState.title}</AlertDialogTitle>
          <AlertDialogDescription>{dialogState.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={dialogState.onCancel}>
            {dialogState.cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={dialogState.onConfirm}
            className={
              dialogState.variant === 'destructive'
                ? 'bg-red-600 hover:bg-red-700'
                : ''
            }
          >
            {dialogState.confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
