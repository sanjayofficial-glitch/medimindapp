"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

interface SnoozeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSnooze: (minutes: number) => void;
  medicineName: string;
  snoozeCount: number;
}

export default function SnoozeDialog({ open, onOpenChange, onSnooze, medicineName, snoozeCount }: SnoozeDialogProps) {
  const showEscalation = snoozeCount >= 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-[#4CAF50]/10 p-2 rounded-lg">
              <Clock className="w-5 h-5 text-[#4CAF50]" />
            </div>
            <DialogTitle className="text-xl font-bold text-gray-800">Snooze Reminder</DialogTitle>
          </div>
        </DialogHeader>

        {showEscalation ? (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
            <p className="text-orange-700 font-medium text-center">
              ⚠️ You've snoozed twice. Please take your medicine now.
            </p>
          </div>
        ) : (
          <p className="text-gray-600 mb-4">How long should we remind you again for {medicineName}?</p>
        )}

        <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button 
            onClick={() => onSnooze(10)} 
            className="flex-1 bg-[#4CAF50] hover:bg-[#43A047] text-white rounded-xl h-11"
          >
            10 minutes
          </Button>
          <Button 
            onClick={() => onSnooze(30)} 
            className="flex-1 bg-[#4CAF50] hover:bg-[#43A047] text-white rounded-xl h-11"
          >
            30 minutes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}