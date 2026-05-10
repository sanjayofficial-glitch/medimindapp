"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Clock, Bell, Calendar, Pill, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useMedicines, useFamilyMembers } from "@/hooks/use-queries";
import { toDisplayTime } from "@/utils/datetime";
import { format } from "date-fns";

const Reminders = () => {
  const navigate = useNavigate();
  const { data: medicines = [], isLoading: medicinesLoading } = useMedicines();
  const { data: familyMembers = [], isLoading: membersLoading } = useFamilyMembers();

  const today = format(new Date(), "EEEE");
  
  const getMemberName = useMemo(() => (id: string) => familyMembers.find(m => m.id === id)?.name || "Unknown", [familyMembers]);

  const sortedByTime = useMemo(() => [...medicines].sort((a, b) => {
    const aTime = a.times?.[0] || "23:59";
    const bTime = b.times?.[0] || "23:59";
    return aTime.localeCompare(bTime);
  }), [medicines]);

  const byMember = useMemo(() => medicines.reduce((acc, med) => {
    const memberId = med.familyMemberId || "default";
    if (!acc[memberId]) {
      acc[memberId] = [];
    }
    acc[memberId].push(med);
    return acc;
  }, {} as Record<string, typeof medicines>), [medicines]);

  if (medicinesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
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
          <h1 className="text-3xl font-bold text-gray-900">My Reminders</h1>
          <p className="text-gray-600 mt-1">View all your scheduled medication reminders</p>
        </div>

        {medicines.length === 0 ? (
          <Card className="border-none">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No Reminders Set</h3>
              <p className="text-gray-500 mb-6">Add medications to see your schedule here</p>
              <Button onClick={() => navigate("/add-medicine")} className="bg-emerald-600">
                <Pill className="w-4 h-4 mr-2" /> Add Medication
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="today" className="space-y-6">
            <TabsList className="bg-white border shadow-sm">
              <TabsTrigger value="today" className="flex-1">Today's Schedule</TabsTrigger>
              <TabsTrigger value="all" className="flex-1">All Medications</TabsTrigger>
              <TabsTrigger value="by-member" className="flex-1">By Person</TabsTrigger>
            </TabsList>

            <TabsContent value="today" className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">{today}</span>
              </div>

              {sortedByTime.map((med) => (
                <Card key={med.id} className="border-none shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                        <Pill className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-gray-900">{med.name}</h4>
                          <p className="text-xs text-gray-500">{getMemberName(med.familyMemberId)}</p>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{med.dosage} • {med.frequency}</p>
                        <div className="flex flex-wrap gap-2">
                          {med.times?.map((time, timeIdx) => (
                            <div key={timeIdx} className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-full">
                              <Clock className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-sm font-bold text-emerald-700">{toDisplayTime(time)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              {medicines.map((med) => (
                <Card key={med.id} className="border-none shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                        <Pill className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-gray-900">{med.name}</h4>
                          <p className="text-xs text-gray-500">{getMemberName(med.familyMemberId)}</p>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{med.dosage} • {med.frequency}</p>
                        <div className="flex flex-wrap gap-2">
                          {med.times?.map((time, timeIdx) => (
                            <div key={timeIdx} className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-full">
                              <Bell className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-sm font-bold text-emerald-700">{toDisplayTime(time)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="by-member" className="space-y-6">
              {Object.entries(byMember).map(([memberId, memberMeds]) => (
                <div key={memberId}>
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-emerald-600">{getMemberName(memberId).charAt(0)}</span>
                    </span>
                    {getMemberName(memberId)}
                  </h3>
                  <div className="space-y-3">
                    {memberMeds.map((med) => (
                      <Card key={med.id} className="border-none shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                <Pill className="w-6 h-6 text-emerald-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{med.name}</p>
                                <p className="text-sm text-gray-500">{getMemberName(med.familyMemberId)}</p>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 mb-3">{med.dosage}</p>
                            <div className="flex flex-wrap gap-2">
                              {med.times?.map((time, timeIdx) => (
                                <div key={timeIdx} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
                                  <Clock className="w-3 h-3 text-gray-500" />
                                  <span className="text-sm font-medium text-gray-700">{toDisplayTime(time)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </motion.div>
  );
};

export default Reminders;