"use client";

import React from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import DailyProgress from "@/components/DailyProgress";
import MedicineList from "@/components/MedicineList";
import FamilySelector from "@/components/FamilySelector";
import Navigation from "@/components/Navigation";
import { useFamily } from "@/context/FamilyContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { selectedFamilyMember } = useFamily();

  const { data: medicines, isLoading } = useQuery({
    queryKey: ["medicines", selectedFamilyMember?.id],
    queryFn: async () => {
      let query = supabase.from("medicines").select("*");
      if (selectedFamilyMember) {
        query = query.eq("family_member_id", selectedFamilyMember.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Header />
      
      <main className="container max-w-md mx-auto px-4 pt-4 space-y-6">
        <FamilySelector />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <DailyProgress />
        </motion.div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Today's Schedule</h2>
          </div>
          
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
            </div>
          ) : (
            <MedicineList medicines={medicines || []} />
          )}
        </div>
      </main>

      <Navigation />
    </div>
  );
};

export default Index;