import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Pill, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

// Family Members
export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
}

export interface Medicine {
  id: string;
  familyMemberId: string;
  name: string;
  dosage: string;
  times: string[];  // Changed from single time to array of times
  frequency: string;
  additionalText?: string;
}

// Dose Logs
export interface DoseLog {
  id: string;
  medicineId: string;
  medicineName: string;
  scheduledTime: string;
  actualTime?: string;
  date: string;
  status: "taken" | "missed" | "partial";
}

const DOSE_LOGS_KEY = "medimind_dose_logs";
const FAMILY_MEMBERS_KEY = "medimind_family_members";
const MEDICINES_KEY = "medimind_medicines";

// Dose Logs
export const getDoseLogs = async (): Promise<DoseLog[]> => {
  try {
    const logs = localStorage.getItem(DOSE_LOGS_KEY);
    return logs ? JSON.parse(logs) : [];
  } catch (error) {
    console.error("Failed to load dose logs:", error);
    return [];
  }
};

export const saveDoseLog = async (log: DoseLog): Promise<void> => {
  try {
    const logs = await getDoseLogs();
    const existingIndex = logs.findIndex(
      (l) => l.medicineId === log.medicineId && l.date === log.date && l.scheduledTime === log.scheduledTime
    );
    
    if (existingIndex >= 0) {
      logs[existingIndex] = log;
    } else {
      logs.push(log);
    }
    
    localStorage.setItem(DOSE_LOGS_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error("Failed to save dose log:", error);
    toast.error("Failed to save dose log");
  }
};

export const getDoseLogsForDate = async (date: string): Promise<DoseLog[]> => {
  const logs = await getDoseLogs();
  return logs.filter((log) => log.date === date);
};

export const getDoseLogsForMonth = async (
  year: number,
  month: number
): Promise<DoseLog[]> => {
  const logs = await getDoseLogs();
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  return logs.filter((log) => log.date.startsWith(monthPrefix));
};

export const generateMockData = async (): Promise<void> => {
  const mockLogs: DoseLog[] = [];
  const medicines = [
    { id: "med1", name: "Vitamin D", times: ["08:00"] },
    { id: "med2", name: "Metformin", times: ["12:00", "18:00"] },
    { id: "med3", name: "Lisinopril", times: ["08:00", "12:00", "20:00"] },
  ];
  
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    if (date > today) break;
    
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    
    medicines.forEach((med) => {
      med.times.forEach((time) => {
        const rand = Math.random();
        let status: "taken" | "missed" | "partial" = "taken";
        let actualTime = time;
        
        if (rand > 0.85) {
          status = "missed";
          actualTime = undefined;
        } else if (rand > 0.7) {
          status = "partial";
          const [h, m] = time.split(":").map(Number);
          actualTime = `${String(h).padStart(2, "0")}:${String(m + 15).padStart(2, "0")}`;
        }
        
        mockLogs.push({
          id: `${med.id}-${dateStr}-${time}`,
          medicineId: med.id,
          medicineName: med.name,
          scheduledTime: time,
          actualTime,
          date: dateStr,
          status,
        });
      });
    });
  }
  
  localStorage.setItem(DOSE_LOGS_KEY, JSON.stringify(mockLogs));
  toast.success("Mock data generated for testing");
};

// Family Members
export const getFamilyMembers = (): FamilyMember[] => {
  try {
    const members = localStorage.getItem(FAMILY_MEMBERS_KEY);
    return members ? JSON.parse(members) : [];
  } catch (error) {
    console.error("Failed to load family members:", error);
    toast.error("Failed to load family members");
    return [];
  }
};

export const addFamilyMember = (member: FamilyMember): void => {
  const members = getFamilyMembers();
  members.push(member);
  localStorage.setItem(FAMILY_MEMBERS_KEY, JSON.stringify(members));
};

export const updateFamilyMember = (updatedMember: FamilyMember): void => {
  const members = getFamilyMembers().map(m => 
    m.id === updatedMember.id ? updatedMember : m
  );
  localStorage.setItem(FAMILY_MEMBERS_KEY, JSON.stringify(members));
};

export const removeFamilyMember = (id: string): void => {
  const members = getFamilyMembers().filter(m => m.id !== id);
  localStorage.setItem(FAMILY_MEMBERS_KEY, JSON.stringify(members));
};

// Medicines
export const getMedicines = (): Medicine[] => {
  try {
    const meds = localStorage.getItem(MEDICINES_KEY);
    if (!meds) return [];
    const parsed = JSON.parse(meds);
    return parsed.map((med: { time?: string; times?: string[] } & Record<string, unknown>) => {
      if (med.time && !med.times) {
        return { ...med, times: [med.time] };
      }
      return med;
    });
  } catch (error) {
    console.error("Failed to load medicines:", error);
    toast.error("Failed to load medicines");
    return [];
  }
};

export const addMedicine = (medicine: Medicine): void => {
  const meds = getMedicines();
  meds.push(medicine);
  localStorage.setItem(MEDICINES_KEY, JSON.stringify(meds));
};

export const removeMedicine = (id: string): void => {
  const meds = getMedicines().filter(m => m.id !== id);
  localStorage.setItem(MEDICINES_KEY, JSON.stringify(meds));
};