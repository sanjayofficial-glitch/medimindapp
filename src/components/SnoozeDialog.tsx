"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, AlertTriangle } from "lucide-react";

interface SnoozeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicineName: string;
  snoozeCount: number;
  onSnooze: (minutes: number) => void;
}

export default function SnoozeDialog({ open, onOpenChange, medicineName, snoozeCount, onSnooze }: SnoozeDialogProps) {
  const isEscalated = snoozeCount >= 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#4CAF50]" />
            Snooze Reminder
          </DialogTitle>
        </DialogHeader>

        {isEscalated ? (
          <div className="space-y-4 py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-800">⚠️ You've snoozed twice</p>
                <p className="text-sm text-amber-700 mt-1">Please take your {medicineName} now. Your health matters!</p>
              </div>
            </div>
            <Button 
              onClick={() => onSnooze(10)} 
              className="w-full bg-[#4CAF50] hover:bg-[#43A047] text-white rounded-xl h-11"
            >
              I'll take it now (10 min reminder)
            </Button>
          </div>
        ) : (
          <div className="space-y-3 py-4">
            <p className="text-gray-600">When should we remind you again for {medicineName}?</p>
            <div className="grid gap-3">
              <Button 
                variant="outline" 
                onClick={() => onSnooze(10)} 
                className="w-full justify-start h-12 rounded-xl border-2 hover:border-[#4CAF50] hover:bg-[#4CAF50]/5"
              >
                <Clock className="w-4 h-4 mr-3 text-[#4CAF50]" />
                <div className="text-left">
                  <div className="font-medium">10 minutes</div>
                  <div className="text-xs text-gray-500">Quick reminder</div>
                </div>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => onSnooze(30)} 
                className="w-full justify-start h-12 rounded-xl border-2 hover:border-[#4CAF50] hover:bg-[#4CAF50]/5"
              >
                <Clock className="w-4 h-4 mr-3 text-[#4CAF50]" />
                <div className="text-left">
                  <div className="font-medium">30 minutes</div>
                  <div className="text-xs text-gray-500">Extended reminder</div>
                </div>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}