"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDoseLogs, getVitalLogs, getSymptomLogs } from "@/utils/storage";
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
      const logs = await getDoseLogs();
      const vitals = getVitalLogs();
      const symptoms = getSymptomLogs();
      
      // Medication Stats
      const taken = logs.filter(l => l.status === "taken").length;
      const missed = logs.filter(l => l.status === "missed").length;
      const late = logs.filter(l => l.status === "partial").length;
      const total = logs.length;
      const rate = total > 0 ? Math.round((taken / total) * 100) : 0;
      setStats({ taken, missed, late, rate });

      // Weekly Adherence Chart
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

      // Vitals Chart (Weight trend for demo)
      const weightLogs = vitals.filter(v => v.type === "weight");
      const vData = weightLogs.slice(-7).map(v => ({
        name: v.date.split('-').slice(1).join('/'),
        value: parseFloat(v.value)
      }));
      setVitalData(vData);

      // Symptom Stats
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
            <p className="text-muted-foreground mt-1">Comprehensive overview of your health journey</p>
          </div>
          <Button 
            onClick={handleExport} 
            disabled={isExporting}
            className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-none"
          >
            {isExporting ? <Activity className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Export Health Report
          </Button>
        </div>

        <Tabs defaultValue="medication" className="space-y-6">
          <TabsList className="bg-card border border-border p-1 rounded-xl">
            <TabsTrigger value="medication" className="rounded-lg">Medication</TabsTrigger>
            <TabsTrigger value="vitals" className="rounded-lg">Vitals</TabsTrigger>
            <TabsTrigger value="symptoms" className="rounded-lg">Symptoms</TabsTrigger>
          </TabsList>

          <TabsContent value="medication" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-400">Adherence Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-600">{stats.rate}%</div>
                  <p className="text-xs text-emerald-600 mt-1 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" /> Overall
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border"><CardContent className="pt-6"><div className="text-2xl font-bold text-emerald-600 flex items-center gap-2"><CheckCircle className="w-5 h-5" /> {stats.taken} Taken</div></CardContent></Card>
              <Card className="bg-card border-border"><CardContent className="pt-6"><div className="text-2xl font-bold text-rose-600 flex items-center gap-2"><XCircle className="w-5 h-5" /> {stats.missed} Missed</div></CardContent></Card>
              <Card className="bg-card border-border"><CardContent className="pt-6"><div className="text-2xl font-bold text-amber-600 flex items-center gap-2"><AlertCircle className="w-5 h-5" /> {stats.late} Late</div></CardContent></Card>
            </div>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Weekly Adherence</CardTitle>
                <CardDescription className="text-muted-foreground">Percentage of doses taken on time</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'currentColor'}} className="text-muted-foreground" />
                    <YAxis axisLine={false} tickLine={false} unit="%" tick={{fill: 'currentColor'}} className="text-muted-foreground" />
                    <Tooltip 
                      cursor={{fill: 'currentColor', opacity: 0.1}} 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Activity className="w-5 h-5 text-emerald-600" />
                    Weight Trend
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">Your weight changes over the last 7 entries</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {vitalData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={vitalData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'currentColor'}} className="text-muted-foreground" />
                        <YAxis axisLine={false} tickLine={false} domain={['auto', 'auto']} tick={{fill: 'currentColor'}} className="text-muted-foreground" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                          itemStyle={{ color: 'hsl(var(--foreground))' }}
                        />
                        <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{ r: 6, fill: '#10b981' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">No weight data to display.</div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30">
                <CardHeader>
                  <CardTitle className="text-emerald-800 dark:text-emerald-400">Health Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-emerald-700 dark:text-emerald-300">
                  <p>• Your adherence rate is {stats.rate}%. Keep it up!</p>
                  <p>• Regular vital monitoring helps your doctor adjust your treatment plan more effectively.</p>
                  <p>• Try to log your vitals at the same time each day for the most accurate trends.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="symptoms" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-rose-800 dark:text-rose-400">Severe Symptoms</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-rose-600">{symptomStats.severe}</div>
                </CardContent>
              </Card>
              <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-400">Moderate Symptoms</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-600">{symptomStats.moderate}</div>
                </CardContent>
              </Card>
              <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-400">Mild Symptoms</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-600">{symptomStats.mild}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Thermometer className="w-5 h-5 text-rose-500" />
                  Symptom Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  You have logged {symptomStats.mild + symptomStats.moderate + symptomStats.severe} symptoms this month. 
                  Sharing this log with your doctor can help identify if any medications are causing side effects.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Progress;