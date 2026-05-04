"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, AlertTriangle, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { getMedicines, updateMedicine, Medicine } from "@/utils/storage";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

const RefillManagement = () => {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [editingMed, setEditingMed] = useState<Medicine | null>(null);
  const [stock, setStock] = useState("");
  const [refillAt, setRefillAt] = useState("");

  useEffect(() => {
    setMedicines(getMedicines());
  }, []);

  const handleUpdateStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMed || !stock) return;

    const updatedMed: Medicine = {
      ...editingMed,
      stock: parseInt(stock),
      refillAt: parseInt(refillAt) || 5
    };

    updateMedicine(updatedMed);
    setMedicines(getMedicines());
    setEditingMed(null);
    setStock("");
    setRefillAt("");
    toast.success(`Stock updated for ${updatedMed.name}`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gray-50 pb-32 p-6"
    >
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Refill Management</h1>
          <p className="text-gray-600 mt-1">Track your medication stock and get refill alerts</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {medicines.length === 0 ? (
              <Card className="p-12 text-center">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No medicines added yet.</p>
              </Card>
            ) : (
              medicines.map((med) => {
                const isLow = med.stock !== undefined && med.stock <= (med.refillAt || 5);
                const percentage = med.stock !== undefined ? Math.min(100, (med.stock / 30) * 100) : 0;

                return (
                  <Card key={med.id} className={isLow ? "border-rose-200 bg-rose-50/30" : ""}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isLow ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"}`}>
                            <Package className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">{med.name}</h3>
                            <p className="text-xs text-gray-500">{med.dosage}</p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setEditingMed(med);
                            setStock(med.stock?.toString() || "");
                            setRefillAt(med.refillAt?.toString() || "5");
                          }}
                        >
                          Update Stock
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Current Stock</span>
                          <span className={`font-bold ${isLow ? "text-rose-600" : "text-emerald-600"}`}>
                            {med.stock ?? "Not tracked"} doses
                          </span>
                        </div>
                        {med.stock !== undefined && (
                          <Progress value={percentage} className={isLow ? "bg-rose-100" : "bg-emerald-100"} />
                        )}
                        {isLow && (
                          <p className="text-xs text-rose-600 flex items-center gap-1 mt-2">
                            <AlertTriangle className="w-3 h-3" /> Low stock! Time to refill.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          <div className="lg:col-span-1">
            {editingMed ? (
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Update Stock</CardTitle>
                  <CardDescription>Set current quantity for {editingMed.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateStock} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Current Quantity (Doses)</Label>
                      <Input 
                        type="number" 
                        value={stock} 
                        onChange={(e) => setStock(e.target.value)}
                        placeholder="e.g., 30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Alert at (Doses)</Label>
                      <Input 
                        type="number" 
                        value={refillAt} 
                        onChange={(e) => setRefillAt(e.target.value)}
                        placeholder="e.g., 5"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => setEditingMed(null)}>Cancel</Button>
                      <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700">Save</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-emerald-50 border-emerald-100">
                <CardHeader>
                  <CardTitle className="text-emerald-800">Refill Tips</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-emerald-700 space-y-2">
                  <p>• Update your stock whenever you buy new medicine.</p>
                  <p>• MediMind automatically deducts one dose every time you mark a medication as "Taken".</p>
                  <p>• Set alerts to 5-7 days before you run out to ensure you have time to visit the pharmacy.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RefillManagement;