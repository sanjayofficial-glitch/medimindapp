"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2, Info, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { askAIAssistant } from "@/utils/ai-assistant";
import { Button } from "@/components/ui/button";
import { useAI } from "@/context/AIContext";

const DynamicAIInsight = () => {
  const { aiEnabled } = useAI();
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsight = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await askAIAssistant("Analyze my recent medication adherence and health logs. Give me one short, punchy, encouraging insight or tip (max 2 sentences).");
      const cleanInsight = response.split("Disclaimer:")[0].trim();
      setInsight(cleanInsight);
    } catch (err) {
      setError("Failed to generate insight");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (aiEnabled) {
      generateInsight();
    }
  }, [aiEnabled]);

  if (!aiEnabled) {
    return null;
  }

  return (
    <Card className="bg-primary text-primary-foreground border-none shadow-xl shadow-primary/20 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Sparkles className="w-24 h-24" />
      </div>
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          AI Health Insight
        </CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-primary-foreground/50 hover:text-primary-foreground hover:bg-white/10"
          onClick={generateInsight}
          disabled={isLoading}
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <p className="text-sm opacity-80">Analyzing your health data...</p>
          </div>
        ) : error ? (
          <p className="text-sm opacity-80 italic">{error}</p>
        ) : (
          <p className="text-sm opacity-90 leading-relaxed font-medium">
            {insight || "Keep tracking your doses to unlock personalized AI insights!"}
          </p>
        )}
        <div className="flex items-center gap-2 bg-white/10 p-2 rounded-lg text-[10px] font-medium">
          <Info className="w-3 h-3" />
          <span>Tip: Consistency improves treatment efficacy by 40%.</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default DynamicAIInsight;