"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, ShieldCheck, Info, Search, Pill, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { medicineDatabase, MedicineDBEntry } from "@/data/medicineDatabase";
import { useMedicines } from "@/hooks/use-queries";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const InteractionChecker = () => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<MedicineDBEntry[]>([]);
  const [selectedMeds, setSelectedMeds] = useState<MedicineDBEntry[]>([]);
  const [interactions, setInteractions] = useState<{ type: 'warning' | 'info', message: string }[]>([]);

  const { data: medicines = [], isLoading } = useMedicines();

  useEffect(() => {
    if (medicines.length > 0) {
      const dbMeds = medicineDatabase.filter(db => 
        medicines.some(m => m.name.toLowerCase().includes(db.brand_name.toLowerCase()))
      );
      setSelectedMeds(dbMeds);
      checkInteractions(dbMeds);
    }
  }, [medicines]);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (val.length < 2) {
      setResults([]);
      return;
    }
    const filtered = medicineDatabase.filter(m => 
      m.brand_name.toLowerCase().includes(val.toLowerCase()) || 
      m.generic_name.toLowerCase().includes(val.toLowerCase())
    ).slice(0, 5);
    setResults(filtered);
  };

  const addMed = (med: MedicineDBEntry) => {
    if (!selectedMeds.find(m => m.brand_name === med.brand_name)) {
      const updated = [...selectedMeds, med];
      setSelectedMeds(updated);
      checkInteractions(updated);
    }
    setSearch("");
    setResults([]);
  };

  const removeMed = (name: string) => {
    const updated = selectedMeds.filter(m => m.brand_name !== name);
    setSelectedMeds(updated);
    checkInteractions(updated);
  };

  const checkInteractions = (meds: MedicineDBEntry[]) => {
    const newInteractions: { type: 'warning' | 'info', message: string }[] = [];
    const generics = meds.map(m => m.generic_name.toLowerCase());

    if (generics.some(g => g.includes("aspirin")) && generics.some(g => g.includes("clopidogrel"))) {
      newInteractions.push({ 
        type: 'info', 
        message: "Aspirin + Clopidogrel: This combination (DAPT) is often prescribed after heart procedures but increases bleeding risk." 
      });
    }

    if (generics.some(g => g.includes("metformin")) && generics.some(g => g.includes("glimepiride"))) {
      newInteractions.push({ 
        type: 'warning', 
        message: "Metformin + Glimepiride: Increased risk of hypoglycemia (low blood sugar)." 
      });
    }

    setInteractions(newInteractions);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Interaction Checker
          </CardTitle>
          <CardDescription>Check for potential drug-drug interactions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search medicine to add..." 
              className="pl-10"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {results.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg overflow-hidden">
                {results.map(med => (
                  <button 
                    key={med.brand_name}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex flex-col"
                    onClick={() => addMed(med)}
                  >
                    <span className="font-bold text-sm">{med.brand_name}</span>
                    <span className="text-xs text-gray-500">{med.generic_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {selectedMeds.map(med => (
                  <div key={med.brand_name} className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-medium border border-emerald-100">
                    <Pill className="w-3 h-3" />
                    {med.brand_name}
                    <button onClick={() => removeMed(med.brand_name)} className="hover:text-emerald-900">×</button>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-4">
                {interactions.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed">
                    <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No major interactions detected.</p>
                  </div>
                ) : (
                  interactions.map((inter, i) => (
                    <Alert key={i} variant={inter.type === 'warning' ? 'destructive' : 'default'}>
                      {inter.type === 'warning' ? <ShieldAlert className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                      <AlertTitle>{inter.type === 'warning' ? 'Warning' : 'Clinical Note'}</AlertTitle>
                      <AlertDescription className="text-xs">
                        {inter.message}
                      </AlertDescription>
                    </Alert>
                  ))
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InteractionChecker;