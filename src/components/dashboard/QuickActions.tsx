"use client";

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Activity, Sparkles, Package, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { iconPop, cardInteractive, chevronSlide } from "@/lib/animations";

const QuickActions = () => {
  const actions = [
    { to: "/appointments", icon: Calendar, title: "Appointments", sub: "Next: Dr. Smith", color: "bg-blue-500/10 text-blue-500" },
    { to: "/lab-results", icon: Activity, title: "Lab Results", sub: "Track biomarkers", color: "bg-primary/10 text-primary" },
    { to: "/mood", icon: Sparkles, title: "Mood Journal", sub: "Mental health", color: "bg-indigo-500/10 text-indigo-500" },
    { to: "/wallet", icon: Package, title: "Rx Wallet", sub: "Digital documents", color: "bg-purple-500/10 text-purple-500" }
  ];

  return (
    <section className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">Quick Actions</h3>
      <div className="grid grid-cols-1 gap-3">
        {actions.map((action, i) => (
          <Link key={i} to={action.to}>
            <motion.div 
              variants={cardInteractive}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
            >
              <Card className="group hover:border-primary/50 transition-all cursor-pointer border-none shadow-sm bg-card overflow-hidden">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      variants={iconPop}
                      initial="rest"
                      whileHover="hover"
                      whileTap="tap"
                      className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", action.color, "group-hover:bg-primary group-hover:text-primary-foreground")}
                    >
                      <action.icon className="w-5 h-5" />
                    </motion.div>
                    <div>
                      <p className="font-bold text-foreground">{action.title}</p>
                      <p className="text-xs text-muted-foreground">{action.sub}</p>
                    </div>
                  </div>
                  <motion.div variants={chevronSlide} initial="rest" whileHover="hover">
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default QuickActions;