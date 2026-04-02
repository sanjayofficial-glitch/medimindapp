"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Pill } from "lucide-react";

const medicineSchema = z.object({
  name: z.string().min(2, "Medicine name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
  frequency: z.enum(["Daily", "Twice Daily", "As Needed", "Weekly"]),
  instructions: z.string().optional(),
});

type MedicineFormValues = z.infer<typeof medicineSchema>;

interface AddMedicineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (medicine: Omit<MedicineFormValues, "id" | "taken">) => void;
}

export default function AddMedicineDialog({ open, onOpenChange, onAdd }: AddMedicineDialogProps) {
  const form = useForm<MedicineFormValues>({
    resolver: zodResolver(medicineSchema),
    defaultValues: {
      name: "",
      dosage: "",
      time: "08:00",
      frequency: "Daily",
      instructions: "",
    },
  });

  const onSubmit = async (data: MedicineFormValues) => {
    onAdd(data);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-[#4CAF50]/10 p-2 rounded-lg">
              <Pill className="w-5 h-5 text-[#4CAF50]" />
            </div>
            <DialogTitle className="text-xl font-bold text-gray-800">Add Medicine</DialogTitle>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medicine Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Metformin" {...field} className="rounded-lg" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dosage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dosage</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 500mg" {...field} className="rounded-lg" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} className="rounded-lg" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-lg">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Daily">Daily</SelectItem>
                      <SelectItem value="Twice Daily">Twice Daily</SelectItem>
                      <SelectItem value="As Needed">As Needed</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Instructions (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Take with food, avoid sunlight" {...field} className="rounded-lg resize-none" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-lg">
                Cancel
              </Button>
              <Button type="submit" className="bg-[#4CAF50] hover:bg-[#43A047] text-white rounded-lg">
                Add Medicine
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}