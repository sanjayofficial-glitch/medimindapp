import { Medicine, DoseLog, FamilyMember } from "./storage";
import { addDays, format, parseISO } from "date-fns";

export const getDosesPerDay = (frequency: string): number => {
  if (!frequency) return 1;
  const freq = frequency.toLowerCase();
  if (freq.includes("once") || freq.includes("1x") || freq.includes("daily")) return 1;
  if (freq.includes("twice") || freq.includes("2x")) return 2;
  if (freq.includes("three")) return 3;
  if (freq.includes("four")) return 4;
  return 1;
};

export const calculateDaysRemaining = (stock: number | undefined, frequency: string): number => {
  if (stock === undefined || stock === null || stock <= 0) return 0;
  const dosesPerDay = getDosesPerDay(frequency);
  return Math.floor(stock / dosesPerDay);
};

export const getPredictedRefillDate = (stock: number | undefined, frequency: string): Date | null => {
  if (stock === undefined || stock === null || stock <= 0) return new Date();
  const daysRemaining = calculateDaysRemaining(stock, frequency);
  return addDays(new Date(), daysRemaining);
};

export const getRefillAlertLevel = (daysRemaining: number): 'critical' | 'warning' | 'ok' => {
  if (daysRemaining <= 3) return 'critical';
  if (daysRemaining <= 7) return 'warning';
  return 'ok';
};

export const calculateMemberAdherence = (logs: DoseLog[], days: number = 7): number => {
  if (logs.length === 0) return 100;
  const cutoffDate = format(addDays(new Date(), -days), 'yyyy-MM-dd');
  const recentLogs = logs.filter(l => l.date >= cutoffDate);
  if (recentLogs.length === 0) return 100;
  const taken = recentLogs.filter(l => l.status === 'taken').length;
  return Math.round((taken / recentLogs.length) * 100);
};

export const getAdherenceColor = (percentage: number): string => {
  if (percentage >= 80) return 'text-emerald-600';
  if (percentage >= 60) return 'text-amber-500';
  return 'text-rose-500';
};

export const getAdherenceBgColor = (percentage: number): string => {
  if (percentage >= 80) return 'bg-emerald-500';
  if (percentage >= 60) return 'bg-amber-500';
  return 'bg-rose-500';
};

export const getMedicinesForMember = (medicines: Medicine[], memberId: string): Medicine[] => {
  return medicines.filter(m => m.familyMemberId === memberId);
};

export const getLowStockMedicines = (medicines: Medicine[]): Medicine[] => {
  return medicines.filter(m => {
    const daysRemaining = calculateDaysRemaining(m.stock, m.frequency || 'Once daily');
    return daysRemaining <= 7;
  }).sort((a, b) => {
    const aDays = calculateDaysRemaining(a.stock, a.frequency || 'Once daily');
    const bDays = calculateDaysRemaining(b.stock, b.frequency || 'Once daily');
    return aDays - bDays;
  });
};

export const getMissedDosesLast24h = (logs: DoseLog[]): DoseLog[] => {
  const today = format(new Date(), 'yyyy-MM-dd');
  return logs.filter(l => l.date === today && l.status === 'missed');
};

export const getTodaysDoseLogsForMember = (logs: DoseLog[], memberId: string): DoseLog[] => {
  const today = format(new Date(), 'yyyy-MM-dd');
  return logs.filter(l => l.date === today && l.familyMemberId === memberId);
};

export const getNextDoseForMember = (logs: DoseLog[], memberId: string): DoseLog | null => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const memberLogs = logs.filter(l => 
    l.date === today && 
    l.familyMemberId === memberId && 
    l.status === 'pending'
  );
  if (memberLogs.length === 0) return null;
  return memberLogs.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))[0];
};

export const formatRefillDate = (date: Date | null): string => {
  if (!date) return 'Now';
  return format(date, 'MMM d, yyyy');
};