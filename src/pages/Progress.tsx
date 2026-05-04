"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDoseLogs, getVitalLogs, getSymptomLogs, DoseLog, VitalLog, SymptomLog } from "@/utils/storage";
import { CheckCircle, XCircle, AlertCircle, TrendingUp, Activity, Thermometer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateHealthReport } from "@/utils/report-generator";
import { toast } from "sonner";

const Progress = () => {
  const [stats, setStats] = useState({
    taken: 0,
    missed: 0,
    late: 0,
    rate: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [vitalData, setVitalData] = useState<any[]>([]);
  const [symptomStats, setSymptomStats] = useState({ mild: 0, moderate: 0, severe: 0 });
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const logs: DoseLog[] = await getDoseLogs();
      const vitals: VitalLog[] = await getVitalLogs();
      const symptoms: SymptomLog[] = await getSymptomLogs();
      
      const taken = logs.filter(l => l.status === "taken").length;
      const missed = logs.filter(l => l.status === "missed").length;
      const late = logs.filter(l => l.status === "partial").length;
      const total = logs.length;
      const rate = total > 0 ? Math.round((taken / total) * 100) : 0;
      setStats({ taken, missed, late, rate });

      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
      });

      const dailyData = last7Days.map(date => {
        const dayLogs = logs.filter(l => l.date === date);
        const dayTaken = dayLogs.filter(l => l.status === "taken").length;
        const dayTotal = dayLogs.length;
        return {
          name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          rate: dayTotal > 0 ? Math.round((dayTaken / dayTotal) * 100) : 0,
        };
      });
      setChartData(dailyData);

      const weightLogs = vitals.filter(v => v.type === "weight");
      const vData = weightLogs.slice(-7).map(v => ({
        name: v.date.split('-').slice(1).join('/'),
        value: parseFloat(v.value)
      }));
      setVitalData(vData);

      const sStats = {
        mild: symptoms.filter(s => s.severity === "mild").length,
        moderate: symptoms.filter(s => s.severity === "moderate").length,
        severe: symptoms.filter(s => s.severity === "severe").length,
      };
      setSymptomStats(sStats);
    };

    loadData();
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await generateHealthReport();
      toast.success("Report generated successfully!");
    } catch (error) {
      toast.error("Failed to generate report.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Health Progress</h1>
          </div>
          <Button onClick={handleExport} disabled={isExporting} className="bg-emerald-600">
            {isExporting ? <Activity className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Export Health Report
          </Button>
        </div>

        <Tabs defaultValue="medication" className="space-y-6">
          <TabsList className="bg-card border border-border p-1 rounded-xl">
            <TabsTrigger value="medication">Medication</TabsTrigger>
            <TabsTrigger value="vitals">Vitals</TabsTrigger>
            <TabsTrigger value="symptoms">Symptoms</TabsTrigger>
          </TabsList>

          <TabsContent value="medication" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-emerald-50 dark:bg-emerald-900/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Adherence Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-600">{stats.rate}%</div>
                </CardContent>
              </Card>
              <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-emerald-600 flex items-center gap-2"><CheckCircle className="w-5 h-5" /> {stats.taken} Taken</div></CardContent></Card>
              <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-rose-600 flex items-center gap-2"><XCircle className="w-5 h-5" /> {stats.missed} Missed</div></CardContent></Card>
              <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-amber-600 flex items-center gap-2"><AlertCircle className="w-5 h-5" /> {stats.late} Late</div></CardContent></Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Adherence</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis unit="%" />
                    <Tooltip />
                    <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.rate >= 80 ? '#10b981' : entry.rate >= 50 ? '#fbbf24' : '#f43f5e'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vitals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  Weight Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {vitalData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={vitalData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis domain={['auto', 'auto']} />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{ r: 6, fill: '#10b981' }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">No weight data to display.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="symptoms" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-rose-50 dark:bg-rose-900/20">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Severe</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-bold text-rose-600">{symptomStats.severe}</div></CardContent>
              </Card>
              <Card className="bg-amber-50 dark:bg-amber-900/20">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Moderate</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-bold text-amber-600">{symptomStats.moderate}</div></CardContent>
              </Card>
              <Card className="bg-emerald-50 dark:bg-emerald-900/20">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Mild</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-bold text-emerald-600">{symptomStats.mild}</div></CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Progress;