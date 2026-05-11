"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Users, AlertTriangle, Package, ChevronRight, Pill, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useFamilyMembers, useMedicines, useDoseLogsForDate } from "@/hooks/use-queries";
import { getLocalDateString } from "@/utils/datetime";
import { 
  calculateMemberAdherence, 
  getAdherenceColor, 
  getAdherenceBgColor,
  getMedicinesForMember,
  getLowStockMedicines,
  getTodaysDoseLogsForMember,
  getNextDoseForMember,
  calculateDaysRemaining
} from "@/utils/medicine-utils";
import { toDisplayTime } from "@/utils/datetime";

const CaregiverDashboard = () => {
  const navigate = useNavigate();
  const today = getLocalDateString();
  
  const { data: familyMembers = [], isLoading: membersLoading } = useFamilyMembers();
  const { data: medicines = [], isLoading: medicinesLoading } = useMedicines();
  const { data: todayLogs = [], isLoading: logsLoading } = useDoseLogsForDate(today);

  const isLoading = membersLoading || medicinesLoading || logsLoading;

  const memberData = useMemo(() => {
    return familyMembers.map(member => {
      const memberMeds = getMedicinesForMember(medicines, member.id);
      const memberLogs = getTodaysDoseLogsForMember(todayLogs, member.id);
      const adherence = calculateMemberAdherence(memberLogs, 1);
      const nextDose = getNextDoseForMember(todayLogs, member.id);
      const lowStock = getLowStockMedicines(memberMeds);
      const missedToday = memberLogs.filter(l => l.status === 'missed').length;
      
      return {
        ...member,
        medicationCount: memberMeds.length,
        adherence,
        nextDose,
        lowStockCount: lowStock.length,
        missedToday
      };
    });
  }, [familyMembers, medicines, todayLogs]);

  const allLowStock = useMemo(() => getLowStockMedicines(medicines), [medicines]);
  const atRiskMembers = useMemo(() => memberData.filter(m => m.missedToday > 0), [memberData]);

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
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Caregiver Dashboard</h1>
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
              <Users className="w-3 h-3 mr-1" /> Family View
            </Badge>
          </div>
          <p className="text-gray-600">Monitor all family members' medication adherence and stock</p>
        </div>

        <Card className="mb-8 border-emerald-200 bg-emerald-50/50 cursor-pointer hover:bg-emerald-50 transition-colors" onClick={() => navigate('/family-members')}>
          <CardContent className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Add Family Member</p>
                <p className="text-xs text-gray-500">Add a new family member to monitor</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </CardContent>
        </Card>

        {familyMembers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Family Members</h3>
              <p className="text-gray-500 mb-4">Add family members to monitor their medications</p>
              <Button onClick={() => navigate('/family-members')} className="bg-emerald-600">
                Add Family Members
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* At Risk Section */}
            {atRiskMembers.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                  Needs Attention
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {atRiskMembers.map(member => (
                    <Card key={member.id} className="border-rose-200 bg-rose-50/30">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-rose-600">{member.name.charAt(0)}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{member.name}</p>
                              <p className="text-xs text-gray-500">{member.relationship}</p>
                            </div>
                          </div>
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {member.missedToday} missed
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Low Stock Section */}
            {allLowStock.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-500" />
                  Low Stock Alert
                </h2>
                <div className="space-y-3">
                  {allLowStock.slice(0, 5).map(med => {
                    const daysRemaining = calculateDaysRemaining(med.stock, med.frequency || 'Once daily');
                    const member = familyMembers.find(m => m.id === med.familyMemberId);
                    return (
                      <Card key={med.id} className="border-amber-200 bg-amber-50/30">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                                <Pill className="w-4 h-4 text-amber-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{med.name}</p>
                                <p className="text-xs text-gray-500">{member?.name || 'Unknown'}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm font-bold ${daysRemaining <= 3 ? 'text-rose-600' : 'text-amber-600'}`}>
                                {daysRemaining} days left
                              </p>
                              <p className="text-xs text-gray-500">{med.stock} pills</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                {allLowStock.length > 5 && (
                  <Button variant="outline" onClick={() => navigate('/refills')} className="mt-3 w-full border-amber-200 text-amber-700">
                    View All {allLowStock.length} Low Stock Items
                  </Button>
                )}
              </div>
            )}

            {/* Family Members Summary */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                Family Members
              </h2>
              <div className="space-y-4">
                {memberData.map(member => (
                  <Card 
                    key={member.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate('/family-members')}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <span className="text-lg font-bold text-emerald-600">{member.name.charAt(0)}</span>
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">{member.name}</h3>
                            <p className="text-sm text-gray-500">{member.relationship}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Adherence</p>
                          <p className={`text-lg font-bold ${getAdherenceColor(member.adherence)}`}>
                            {member.adherence}%
                          </p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Medications</p>
                          <p className="text-lg font-bold text-gray-900">{member.medicationCount}</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Next Dose</p>
                          {member.nextDose ? (
                            <p className="text-sm font-bold text-emerald-600">{toDisplayTime(member.nextDose.scheduledTime)}</p>
                          ) : (
                            <p className="text-sm text-gray-400">None</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Today's Progress</span>
                          <span className="font-medium text-gray-900">{member.adherence}%</span>
                        </div>
                        <Progress value={member.adherence} className={`h-2 ${getAdherenceBgColor(member.adherence)}`} />
                      </div>

                      {member.lowStockCount > 0 && (
                        <div className="mt-4 flex items-center gap-2 text-amber-600 text-sm">
                          <Package className="w-4 h-4" />
                          <span>{member.lowStockCount} medication{member.lowStockCount > 1 ? 's' : ''} running low</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/add-medicine')}
                className="h-12 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                <Pill className="w-4 h-4 mr-2" />
                Add Medication
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/refills')}
                className="h-12 border-amber-200 text-amber-700 hover:bg-amber-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Manage Refills
              </Button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default CaregiverDashboard;