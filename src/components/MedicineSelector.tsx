import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { medicineDatabase, MedicineDBEntry } from "@/data/medicineDatabase";

interface MedicineSelectorProps {
  onSelect: (med: MedicineDBEntry) => void;
  onCustom: () => void;
}

export const MedicineSelector = ({ onSelect, onCustom }: MedicineSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-11 bg-white hover:bg-gray-50"
        >
          {value ? medicineDatabase.find((med) => med.brand_name === value)?.brand_name : "Search medicine database..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 max-h-[400px]">
        <Command>
          <CommandInput placeholder="Type to search medicines..." className="h-11" />
          <CommandList>
            <CommandEmpty>No medicine found.</CommandEmpty>
            <CommandGroup heading="Medicines">
              {medicineDatabase.map((med) => (
                <CommandItem
                  key={med.brand_name}
                  value={med.brand_name}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue);
                    onSelect(med);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === med.brand_name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{med.brand_name}</span>
                    <span className="text-xs text-gray-500">{med.generic_name}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup>
              <CommandItem onSelect={() => { onCustom(); setOpen(false); }} className="cursor-pointer text-emerald-600 hover:text-emerald-700">
                <Plus className="mr-2 h-4 w-4" />
                Add Custom Medicine
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};