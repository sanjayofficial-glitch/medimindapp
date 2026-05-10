"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Package, ChevronLeft, Sparkles, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useMedicines, useUpdateMedicine, useFamilyMembers } from "@/hooks/use-queries";
import { Medicine } from "@/utils/storage";
import { toast } from "sonner";
import { 
  calculateDaysRemaining, 
  getPredictedRefillDate, 
  getRefillAlertLevel,
  formatRefillDate
} from "@/utils/medicine-utils";

const RefillManagement = () => {
  const navigate = useNavigate();
  const { data: medicines = [], isLoading } = useMedicines();
  const { data: familyMembers = [] } = useFamilyMembers();
  const updateMedicine = useUpdateMedicine();
  
  const [editingMed, setEditingMed] = useState<Medicine | null>(null);
  const [stock, setStock] = useState("");
  const [refillThreshold, setRefillThreshold] = useState("");

  const getMemberName = (id: string | null) => {
    if (!id) return "Self";
    return familyMembers.find(m => m.id === id)?.name || "Unknown";
  };

  const medicinesWithPredictions = useMemo(() => {
    return medicines.map(med => {
      const daysRemaining = calculateDaysRemaining(med.stock, med.frequency || 'Once daily');
      const predictedDate = getPredictedRefillDate(med.stock, med.frequency || 'Once daily');
      const alertLevel = getRefillAlertLevel(daysRemaining);
      const percentage = med.stock ? Math.min(100, (med.stock / 30) * 100) : 0;
      
      return {
        ...med,
        daysRemaining,
        predictedDate,
        alertLevel,
        percentage
      };
    }).sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [medicines]);

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMed || !stock) return;

    try {
      await updateMedicine.mutateAsync({
        ...editingMed,
        stock: parseInt(stock),
        refillAt: parseInt(refillThreshold) || 5
      });
      toast.success(`Stock updated for ${editingMed.name}`);
      setEditingMed(null);
      setStock("");
      setRefillThreshold("");
    } catch (error) {
      toast.error("Failed to update stock");
    }
  };

  const getAlertBadge = (level: string) => {
    switch (level) {
      case 'critical':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Critical</Badge>;
      case 'warning':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Low</Badge>;
      default:
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> OK</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

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
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Refill Management</h1>
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
              <Sparkles className="w-3 h-3 mr-1" /> AI Predictions
            </Badge>
          </div>
          <p className="text-gray-600 mt-1">Monitor medication stock and predicted refill dates</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {medicinesWithPredictions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Medications</h3>
                  <p className="text-gray-500 mb-4">Add medications to track their stock levels</p>
                  <Button onClick={() => navigate('/add-medicine')} className="bg-emerald-600">
                    Add Medication
                  </Button>
                </CardContent>
              </Card>
            ) : (
              medicinesWithPredictions.map((med) => (
                <Card 
                  key={med.id} 
                  className={med.alertLevel === 'critical' ? "border-rose-200 bg-rose-50/30" : med.alertLevel === 'warning' ? "border-amber-200 bg-amber-50/30" : ""}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          med.alertLevel === 'critical' ? 'bg-rose-100' : med.alertLevel === 'warning' ? 'bg-amber-100' : 'bg-emerald-100'
                        }`}>
                          <Package className={`w-5 h-5 ${
                            med.alertLevel === 'critical' ? 'text-rose-600' : med.alertLevel === 'warning' ? 'text-amber-600' : 'text-emerald-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{med.name}</h3>
                          <p className="text-xs text-gray-500">{med.dosage} • {getMemberName(med.familyMemberId)}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getAlertBadge(med.alertLevel)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-white rounded-lg p-3 border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Stock</p>
                        <p className="text-lg font-bold text-gray-900">{med.stock || 0} pills</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Days Remaining</p>
                        <p className={`text-lg font-bold ${
                          med.alertLevel === 'critical' ? 'text-rose-600' : med.alertLevel === 'warning' ? 'text-amber-600' : 'text-emerald-600'
                        }`}>{med.daysRemaining} days</p>
                      </div>
                    </div>

                    {med.predictedDate && (
                      <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-100 mb-4">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-gray-600">AI Prediction:</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          Refill by {formatRefillDate(med.predictedDate)}
                        </span>
                      </div>
                    )}

                    <Progress value={med.percentage} className={`h-2 ${
                      med.alertLevel === 'critical' ? '[&>div]:bg-rose-500' : med.alertLevel === 'warning' ? '[&>div]:bg-amber-500' : '[&>div]:bg-emerald-500'
                    }`} />

                    <div className="mt-4 flex justify-end">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setEditingMed(med);
                          setStock(med.stock?.toString() || "");
                          setRefillThreshold(med.refillAt?.toString() || "5");
                        }}
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      >
                        Update Stock
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="lg:col-span-1">
            {editingMed && (
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Update Stock
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateStock} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Medicine</Label>
                      <p className="text-sm font-semibold text-gray-900">{editingMed.name}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Current Stock (pills)</Label>
                      <Input 
                        type="number" 
                        value={stock} 
                        onChange={(e) => setStock(e.target.value)}
                        placeholder="Enter quantity"
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Refill Alert Threshold</Label>
                      <Input 
                        type="number" 
                        value={refillThreshold} 
                        onChange={(e) => setRefillThreshold(e.target.value)}
                        placeholder="Alert when stock below..."
                        min="1"
                      />
                      <p className="text-xs text-gray-500">Alert user when stock falls below this number</p>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      disabled={updateMedicine.isPending}
                    >
                      {updateMedicine.isPending ? "Saving..." : "Save"}
                    </Button>
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