import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { X } from "lucide-react";

interface HistoryPopupProps {
  isOpen: boolean;
  onClose: () => void;
  data: Array<{ time_added: string; value: number }>;
  fieldName: string;
}

export function HistoryPopup({ isOpen, onClose, data, fieldName }: HistoryPopupProps) {
  const formattedData = data.map(item => ({
    date: format(new Date(item.time_added), 'MMM d, yyyy'),
    //@ts-ignore

    value: item[fieldName]
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {fieldName.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-4 bg-gray-100 p-4 rounded-t-md">
            <div className="font-semibold">Date</div>
            <div className="font-semibold">{fieldName.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</div>
          </div>
          <div className="space-y-2">
            {formattedData.map((item, index) => (
              <div key={index} className="grid grid-cols-2 gap-4 p-4 border-b">
                <div>{item.date}</div>
                <div>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 