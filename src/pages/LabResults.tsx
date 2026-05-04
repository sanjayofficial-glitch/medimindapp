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
    if (!formData.value || !formData.familyMemberId) return toast.error("Please fill in all fields");

    await addLabResult(formData);
    await loadData();
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
          </div>
          <Button onClick={() => setShowAdd(!showAdd)} className="bg-emerald-600">
            {showAdd ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> Add Result</>}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Biomarker Trends</CardTitle>
                <Select value={selectedTest} onValueChange={setSelectedTest}>
                  <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cholesterol (LDL)">Cholesterol (LDL)</SelectItem>
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
                  <div className="h-full flex items-center justify-center text-gray-400">Add more results to see trends</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LabResults;