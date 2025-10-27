import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface ProgressModalProps {
  open: boolean;
  progress: number; // 0-100
  text?: string;
}

export const ProgressModal: React.FC<ProgressModalProps> = ({ open, progress, text }) => (
  <Dialog open={open}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{text || "Genererer PDF..."}</DialogTitle>
      </DialogHeader>
      <div className="w-full mt-4">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-500 h-3 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-center text-xs text-gray-500 mt-2">{progress}%</div>
      </div>
    </DialogContent>
  </Dialog>
);
