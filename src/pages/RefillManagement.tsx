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

  const loadMeds = async () => {
    const meds = await getMedicines();
    setMedicines(meds);
  };

  useEffect(() => {
    loadMeds();
  }, []);

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMed || !stock) return;

    const updatedMed: Medicine = {
      ...editingMed,
      stock: parseInt(stock),
      refillAt: parseInt(refillAt) || 5
    };

    await updateMedicine(updatedMed);
    await loadMeds();
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {medicines.map((med) => {
              const isLow = med.stock !== undefined && med.stock <= (med.refillAt || 5);
              const percentage = med.stock !== undefined ? Math.min(100, (med.stock / 30) * 100) : 0;

              return (
                <Card key={med.id} className={isLow ? "border-rose-200 bg-rose-50/30" : ""}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-emerald-600" />
                        <div>
                          <h3 className="font-bold text-gray-900">{med.name}</h3>
                          <p className="text-xs text-gray-500">{med.dosage}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditingMed(med);
                        setStock(med.stock?.toString() || "");
                        setRefillAt(med.refillAt?.toString() || "5");
                      }}>Update Stock</Button>
                    </div>
                    <Progress value={percentage} />
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="lg:col-span-1">
            {editingMed && (
              <Card>
                <CardHeader><CardTitle>Update Stock</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateStock} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} />
                    </div>
                    <Button type="submit" className="w-full bg-emerald-600">Save</Button>
                  </form>
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