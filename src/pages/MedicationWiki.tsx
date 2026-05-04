import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Search, Pill, AlertTriangle, Info, ChevronLeft, Coffee, Wine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { medicineDatabase, MedicineDBEntry } from "@/data/medicineDatabase";
import { useNavigate } from "react-router-dom";

const MedicationWiki = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedMed, setSelectedMed] = useState<MedicineDBEntry | null>(null);

  const filteredMeds = medicineDatabase.filter(m => 
    m.brand_name.toLowerCase().includes(search.toLowerCase()) || 
    m.generic_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 pb-32 p-6"
    >
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Medication Wiki</h1>
          <p className="text-gray-600 mt-1">Learn about your medications, interactions, and safety</p>
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
          <Input 
            placeholder="Search 100+ medications..." 
            className="pl-12 h-12 text-lg rounded-2xl shadow-sm border-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-2 max-h-[600px] overflow-y-auto pr-2">
            {filteredMeds.map(med => (
              <button
                key={med.brand_name}
                onClick={() => setSelectedMed(med)}
                className={`w-full text-left p-4 rounded-2xl transition-all ${
                  selectedMed?.brand_name === med.brand_name 
                    ? "bg-emerald-600 text-white shadow-lg" 
                    : "bg-white hover:bg-emerald-50 text-gray-900"
                }`}
              >
                <p className="font-bold">{med.brand_name}</p>
                <p className={`text-xs ${selectedMed?.brand_name === med.brand_name ? "text-emerald-100" : "text-gray-500"}`}>
                  {med.generic_name}
                </p>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2">
            {selectedMed ? (
              <motion.div 
                key={selectedMed.brand_name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <Card className="border-none shadow-lg overflow-hidden">
                  <div className="h-2 bg-emerald-600" />
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                        <Pill className="w-6 h-6" />
                      </div>
                      <CardTitle className="text-2xl">{selectedMed.brand_name}</CardTitle>
                    </div>
                    <CardDescription className="text-lg font-medium text-emerald-700">
                      {selectedMed.generic_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                        <h4 className="font-bold text-blue-900 flex items-center gap-2 mb-2">
                          <Info className="w-4 h-4" /> Usage Guidance
                        </h4>
                        <p className="text-sm text-blue-800 leading-relaxed">{selectedMed.guidance}</p>
                      </div>
                      <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                        <h4 className="font-bold text-rose-900 flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4" /> Cautions
                        </h4>
                        <p className="text-sm text-rose-800 leading-relaxed">{selectedMed.cautions}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-bold text-gray-900">Interactions & Lifestyle</h4>
                      <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700">
                          <Coffee className="w-4 h-4" /> Caffeine: Moderate
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700">
                          <Wine className="w-4 h-4" /> Alcohol: Avoid
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-2xl">
                      <h4 className="font-bold text-gray-900 mb-2">Missed Dose Instructions</h4>
                      <p className="text-sm text-gray-600">
                        Take the missed dose as soon as you remember. If it is almost time for your next dose, skip the missed dose and return to your regular schedule. Do not double the dose to catch up.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-white rounded-3xl border-2 border-dashed p-12">
                <BookOpen className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-medium">Select a medication to view details</p>
                <p className="text-sm">Search from our clinical database of 100+ drugs</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MedicationWiki;