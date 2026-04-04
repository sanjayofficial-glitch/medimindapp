import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDoseLogs, DoseLog } from "@/utils/storage";
import { CheckCircle, XCircle, AlertCircle, TrendingUp } from "lucide-react";

const Progress = () => {
  const [stats, setStats] = useState({
    taken: 0,
    missed: 0,
    late: 0,
    rate: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const logs = await getDoseLogs();
      
      // Calculate overall stats
      const taken = logs.filter(l => l.status === "taken").length;
      const missed = logs.filter(l => l.status === "missed").length;
      const late = logs.filter(l => l.status === "partial").length;
      const total = logs.length;
      const rate = total > 0 ? Math.round((taken / total) * 100) : 0;

      setStats({ taken, missed, late, rate });

      // Prepare chart data for last 7 days
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
      });

      const dailyData = last7Days.map(date => {
        const dayLogs = logs.filter(l => l.date === date);
        const dayTaken = dayLogs.filter(l => l.status === "taken").length;
        const dayTotal = dayLogs.length;
        const dayRate = dayTotal > 0 ? Math.round((dayTaken / dayTotal) * 100) : 0;
        
        return {
          name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          rate: dayRate,
          fullDate: date
        };
      });

      setChartData(dailyData);
    };

    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Progress</h1>
          <p className="text-gray-600 mt-1">Track your medication adherence and health trends</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-emerald-50 border-emerald-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-800">Adherence Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">{stats.rate}%</div>
              <p className="text-xs text-emerald-600 mt-1 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" /> Overall
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Taken</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" /> {stats.taken}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Missed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-600 flex items-center gap-2">
                <XCircle className="w-5 h-5" /> {stats.missed}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Late</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> {stats.late}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Weekly Adherence</CardTitle>
            <CardDescription>Percentage of doses taken on time over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} unit="%" />
                <Tooltip 
                  cursor={{fill: '#f3f4f6'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
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

        <Card>
          <CardHeader>
            <CardTitle>Health Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <h4 className="font-semibold text-blue-900 mb-1">Consistency is Key</h4>
                <p className="text-sm text-blue-700">You've taken {stats.taken} doses this month. Keeping a consistent schedule helps maintain the effectiveness of your medications.</p>
              </div>
              {stats.missed > 0 && (
                <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
                  <h4 className="font-semibold text-rose-900 mb-1">Missed Doses Alert</h4>
                  <p className="text-sm text-rose-700">You missed {stats.missed} doses recently. Try setting up more frequent reminders or using the MediMind AI for tips on staying on track.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Progress;