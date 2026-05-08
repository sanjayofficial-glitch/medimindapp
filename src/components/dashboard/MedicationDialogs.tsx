"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Medicine } from "@/utils/storage";
import { normalizeTime, toDisplayTime } from "@/utils/datetime";

interface MedicationDialogsProps {
  editingMedicine: Medicine | null;
  setEditingMedicine: (med: Medicine | null) => void;
  medicineToDelete: Medicine | null;
  setMedicineToDelete: (med: Medicine | null) => void;
  onSaveSchedule: (times: string[]) => Promise<void>;
  onDeleteMedicine: () => Promise<void>;
  isUpdating: boolean;
  isDeleting: boolean;
}

const MedicationDialogs = ({
  editingMedicine,
  setEditingMedicine,
  medicineToDelete,
  setMedicineToDelete,
  onSaveSchedule,
  onDeleteMedicine,
  isUpdating,
  isDeleting
}: MedicationDialogsProps) => {
  const [editTimes, setEditTimes] = useState<string[]>([]);
  const [newEditTime, setNewEditTime] = useState("");

  useEffect(() => {
    if (editingMedicine) {
      setEditTimes((editingMedicine.times || []).map(normalizeTime).sort());
    }
  }, [editingMedicine]);

  const addEditTime = () => {
    if (!newEditTime) return;
    const normalized = normalizeTime(newEditTime);
    setEditTimes((prev) => Array.from(new Set([...prev, normalized])).sort());
    setNewEditTime("");
  };

  const removeEditTime = (time: string) => {
    setEditTimes((prev) => prev.filter((item) => item !== time));
  };

  return (
    <>
      <Dialog open={!!editingMedicine} onOpenChange={(open) => !open && setEditingMedicine(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Reminder Times</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-foreground">{editingMedicine?.name}</p>
              <p className="text-xs text-muted-foreground">{editingMedicine?.dosage}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-reminder-time">Add time</Label>
              <div className="flex gap-2">
                <Input
                  id="new-reminder-time"
                  type="time"
                  value={newEditTime}
                  onChange={(event) => setNewEditTime(event.target.value)}
                />
                <Button type="button" onClick={addEditTime}>Add</Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {editTimes.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => removeEditTime(time)}
                  className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                  title="Remove this reminder time"
                >
                  {toDisplayTime(time)} x
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditingMedicine(null)}>
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={() => onSaveSchedule(editTimes)} 
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!medicineToDelete} onOpenChange={(open) => !open && setMedicineToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this medicine reminder?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes {medicineToDelete?.name || "this medicine"} and its dose reminders. Use this when the course is completed or no longer needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                onDeleteMedicine();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MedicationDialogs;