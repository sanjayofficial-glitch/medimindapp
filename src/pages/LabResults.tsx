"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Beaker, Plus, ChevronLeft, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useFamilyMembers, useLabResults, useAddLabResult } from "@/hooks/use-queries";
import { toast } from "sonner";

const LabResults = () => {
  const navigate = useNavigate();
  const [showAdd, setShowAdd] = useState(false);

  const { data: familyMembers = [], isLoading: membersLoading } = useFamilyMembers();
  const { data: labResults = [], isLoading: resultsLoading, refetch } = useLabResults();
  const addLabResult = useAddLabResult();

  const [formData, setFormData] = useState({
    familyMemberId: "",
    testName: "",
    value: "",
    unit: "",
    date: new Date().toISOString().split('T')[0],
    normalRange: "",
    attachment: null as File | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.familyMemberId || !formData.testName || !formData.value) {
      return toast.error("Please fill in required fields");
    }

    try {
      let fileUrl = "";
      if (formData.attachment) {
        toast.info("File upload not implemented yet - saving text data only");
      }

      await addLabResult.mutateAsync({
        familyMemberId: formData.familyMemberId,
        testName: formData.testName,
        value: formData.value,
        unit: formData.unit,
        date: formData.date,
        normalRange: formData.normalRange,
        file_url: fileUrl,
      });

      await refetch();
      setShowAdd(false);
      setFormData({
        familyMemberId: "",
        testName: "",
        value: "",
        unit: "",
        date: new Date().toISOString().split('T')[0],
        normalRange: "",
        attachment: null,
      });
      toast.success("Lab result added successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to add lab result");
      console.error("Error adding lab result:", error);
    }
  };

  const isLoading = membersLoading || resultsLoading;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gray-50 pb-32 p-6"
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Lab Results</h1>
          </div>
          <Button onClick={() => setShowAdd(!showAdd)} className="bg-emerald-600" disabled={isLoading}>
            {showAdd ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> Add Result</>}
          </Button>
        </div>

        {showAdd && (
          <Card className="mb-8">
            <CardHeader><CardTitle>Add New Lab Result</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Family Member</Label>
                  <Select onValueChange={v => setFormData({...formData, familyMemberId: v})} value={formData.familyMemberId}>
                    <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                    <SelectContent>
                      {familyMembers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Test Name</Label>
                  <Input value={formData.testName} onChange={e => setFormData({...formData, testName: e.target.value})} placeholder="e.g. HbA1c" />
                </div>
                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} placeholder="e.g. 6.5" />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} placeholder="e.g. %" />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Normal Range</Label>
                  <Input value={formData.normalRange} onChange={e => setFormData({...formData, normalRange: e.target.value})} placeholder="e.g. 4.0 - 5.6" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Attachment (PDF/Image)</Label>
                  <Input type="file" onChange={e => setFormData({...formData, attachment: e.target.files?.[0] || null})} />
                </div>
                <Button type="submit" className="md:col-span-2 bg-emerald-600" disabled={addLabResult.isPending}>
                  {addLabResult.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Result"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : labResults.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed">
              <Beaker className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No lab results recorded yet.</p>
            </div>
          ) : (
            labResults.map(result => (
              <Card key={result.id}>
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <Beaker className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{result.testName}</h3>
                      <p className="text-sm text-emerald-600 font-medium">{result.value} {result.unit}</p>
                      <p className="text-xs text-gray-500">{familyMembers.find(m => m.id === result.familyMemberId)?.name} - {result.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-4 hidden sm:block">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Normal Range</p>
                      <p className="text-xs font-medium text-gray-600">{result.normalRange}</p>
                    </div>
                    {result.file_url && (
                      <Button variant="outline" size="icon" asChild>
                        <a href={result.file_url} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default LabResults;