import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const QUERY_KEYS = {
  familyMembers: ["familyMembers"] as const,
  medicines: ["medicines"] as const,
  doseLogs: ["doseLogs"] as const,
  doseLogsForDate: (date: string) => ["doseLogs", date] as const,
  labResults: ["labResults"] as const,
  vitals: ["vitals"] as const,
  symptoms: ["symptoms"] as const,
  moodLogs: ["moodLogs"] as const,
  appointments: ["appointments"] as const,
  prescriptions: ["prescriptions"] as const,
};