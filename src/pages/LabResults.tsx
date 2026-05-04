"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Beaker, TrendingUp, Plus, ChevronLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { getLabResults, addLabResult, getFamilyMembers, FamilyMember, LabResult } from "@/utils/storage";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const LabResults = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<LabResult[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string>("Cholesterol (LDL)");

  const [formData, setFormData] = useState({
    testName: "Cholesterol (LDL)",
    value: "",
    unit: "mg/dL",
    date: new Date().toISOString().split('T')[0],
    normalRange: "70-130",
    familyMemberId: ""
  });

  useEffect(() => {
    setResults(getLabResults());
    setFamilyMembers(getFamilyMembers());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.value || !formData.familyMemberId) return toast.error("Please fill in all fields");

    addLabResult({ ...formData, id: `lab_${Date.now()}` });
    setResults(getLabResults());
    setShowAdd(false);
    toast.success("Lab result recorded!");
  };

  const chartData = results
    .filter(r => r.testName === selectedTest)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(r => ({ date: r.date, value: parseFloat(r.value) }));

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
            <p className="text-gray-600 mt-1">Track biomarkers and clinical data trends</p>
          </div>
          <Button onClick={() => setShowAdd(!showAdd)} className="bg-emerald-600">
            {showAdd ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> Add Result</>}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Trend Chart */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Biomarker Trends</CardTitle>
                  <CardDescription>Visualizing changes over time</CardDescription>
                </div>
                <Select value={selectedTest} onValueChange={setSelectedTest}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cholesterol (LDL)">Cholesterol (LDL)</SelectItem>
                    <SelectItem value="Blood Sugar (A1C)">Blood Sugar (A1C)</SelectItem>
                    <SelectItem value="Vitamin D">Vitamin D</SelectItem>
                    <SelectItem value="Hemoglobin">Hemoglobin</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="h-[300px]">
                {chartData.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                      <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{ r: 6, fill: '#10b981' }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <TrendingUp className="w-12 h-12 mb-2 opacity-20" />
                    <p>Add at least 2 results to see trends</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* History List */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900">Recent Results</h3>
              {results.slice().reverse().map(res => (
                <Card key={res.id} className="border-none shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                        <Beaker className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{res.testName}</p>
                        <p className="text-xs text-gray-500">{res.date} • {familyMembers.find(m => m.id === res.familyMemberId)?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-600">{res.value} <span className="text-xs text-gray-400 font-normal">{res.unit}</span></p>
                      {res.normalRange && (
                        <p className="text-[10px] text-gray-400">Range: {res.normalRange}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            {showAdd ? (
              <Card className="sticky top-24">
                <CardHeader><CardTitle>Log Result</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Family Member</Label>
                      <Select onValueChange={v => setFormData({...formData, familyMemberId: v})}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {familyMembers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Test Name</Label>
                      <Input value={formData.testName} onChange={e => setFormData({...formData, testName: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label>Value</Label>
                        <Input type="number" step="0.1" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Unit</Label>
                        <Input value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Normal Range</Label>
                      <Input value={formData.normalRange} onChange={e => setFormData({...formData, normalRange: e.target.value})} placeholder="e.g. 70-130" />
                    </div>
                    <Button type="submit" className="w-full bg-emerald-600">Save Result</Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-blue-50 border-blue-100">
                <CardHeader>
                  <CardTitle className="text-blue-800 flex items-center gap-2">
                    <Info className="w-5 h-5" /> Understanding Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-blue-700 space-y-3">
                  <p>• <strong>LDL Cholesterol:</strong> Lower is generally better for heart health.</p>
                  <p>• <strong>A1C:</strong> Measures average blood sugar over 3 months. Target is usually below 7% for diabetics.</p>
                  <p>• <strong>Vitamin D:</strong> Essential for bone health and immunity.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LabResults;