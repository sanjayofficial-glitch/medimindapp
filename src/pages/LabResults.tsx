"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, ChevronLeft, Upload, FileText, Calendar, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { getLabResults, getFamilyMembers, LabResult, FamilyMember, addLabResult } from "@/utils/storage";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const LabResults = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<LabResult[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string>("Cholesterol (LDL)");
  
  const [formData, setFormData] = useState({
    familyMemberId: "",
    testName: "",
    value: "",
    unit: "",
    date: new Date().toISOString().split('T')[0],
    normalRange: ""
  });

  const loadData = async () => {
    const res = await getLabResults();
    const members = await getFamilyMembers();
    setResults(res);
    setFamilyMembers(members);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.familyMemberId || !formData.testName || !formData.value) {
      return toast.error("Please fill in required fields");
    }

    await addLabResult(formData);
    await loadData();
    setShowAdd(false);
    setFormData({
      familyMemberId: "",
      testName: "",
      value: "",
      unit: "",
      date: new Date().toISOString().split('T')[0],
      normalRange: ""
    });
    toast.success("Lab result added!");
  };

  const chartData = results
    .filter(r => r.testName === selectedTest)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(r => ({ date: r.date, value: parseFloat(r.value) }));

  const testOptions = [
    "Cholesterol (LDL)",
    "Cholesterol (HDL)",
    "Cholesterol (Total)",
    "Triglycerides",
    "Blood Sugar (Fasting)",
    "Blood Sugar (Random)",
    "Hemoglobin A1c",
    "Blood Pressure",
    "Liver Function (ALT)",
    "Liver Function (AST)",
    "Kidney Function (Creatinine)",
    "Thyroid (TSH)",
    "Vitamin D",
    "Iron",
    "Vitamin B12"
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 pb-32 p-6"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Lab Results</h1>
          </div>
          <Button onClick={() => setShowAdd(!showAdd)} className="bg-emerald-600">
            {showAdd ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> Add Result</>}
          </Button>
        </div>

        {showAdd && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-600" />
                Upload Lab Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Family Member</Label>
                  <Select onValueChange={v => setFormData({...formData, familyMemberId: v})}>
                    <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                    <SelectContent>
                      {familyMembers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Test Name</Label>
                  <Select onValueChange={v => setFormData({...formData, testName: v})}>
                    <SelectTrigger><SelectValue placeholder="Select test" /></SelectTrigger>
                    <SelectContent>
                      {testOptions.map(test => <SelectItem key={test} value={test}>{test}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="e.g., 120"
                    value={formData.value}
                    onChange={e => setFormData({...formData, value: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input 
                    placeholder="e.g., mg/dL, mmol/L"
                    value={formData.unit}
                    onChange={e => setFormData({...formData, unit: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input 
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Normal Range</Label>
                  <Input 
                    placeholder="e.g., 100-200"
                    value={formData.normalRange}
                    onChange={e => setFormData({...formData, normalRange: e.target.value})}
                  />
                </div>
                <Button type="submit" className="md:col-span-2 bg-emerald-600">Add Result</Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  Biomarker Trends
                </CardTitle>
                <Select value={selectedTest} onValueChange={setSelectedTest}>
                  <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {testOptions.map(test => <SelectItem key={test} value={test}>{test}</SelectItem>)}
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="h-[300px]">
                {chartData.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <FileText className="w-12 h-12 mb-4 opacity-30" />
                    <p>Add more results to see trends</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  Recent Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.slice().reverse().slice(0, 5).map((result) => (
                    <div key={result.id} className="p-3 bg-white rounded-lg border border-gray-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{result.testName}</p>
                          <p className="text-xs text-gray-500">{familyMembers.find(m => m.id === result.familyMemberId)?.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-600">{result.value} {result.unit}</p>
                          <p className="text-xs text-gray-500">{result.date}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {results.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No results yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LabResults;