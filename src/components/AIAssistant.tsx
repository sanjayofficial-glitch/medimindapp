import React, { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Loader2, Settings, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { askAIAssistant, getAISettings, saveAISettings } from "@/utils/ai-assistant";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState(getAISettings()?.apiKey || "");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I'm your MediMind AI. How can I help you with your medications today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const settings = getAISettings();
    if (!settings?.apiKey) {
      setShowSettings(true);
      toast.error("Please enter your Gemini API key first.");
      return;
    }

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await askAIAssistant(userMessage);
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
    } catch (error: any) {
      toast.error(error.message);
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please check your API key in settings." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      toast.error("API Key is required");
      return;
    }
    saveAISettings({ apiKey: apiKey.trim(), provider: "gemini" });
    setShowSettings(false);
    toast.success("AI Settings saved!");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <Card className="w-[350px] sm:w-[400px] h-[500px] mb-4 shadow-2xl border-emerald-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <CardHeader className="bg-emerald-600 text-white p-4 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <Bot className="w-5 h-5" />
              </div>
              <CardTitle className="text-lg font-bold">MediMind AI</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20 h-8 w-8"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20 h-8 w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 overflow-hidden relative">
            {showSettings ? (
              <div className="p-6 space-y-4 bg-gray-50 h-full">
                <h3 className="font-semibold text-gray-900">AI Configuration</h3>
                <p className="text-xs text-gray-500">Enter your Google Gemini API key to enable the assistant.</p>
                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Gemini API Key</label>
                    <Input 
                      type="password" 
                      placeholder="Enter your API key..." 
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                    Save Settings
                  </Button>
                  <p className="text-[10px] text-center text-gray-400">
                    Your key is stored locally on your device.
                  </p>
                </form>
              </div>
            ) : (
              <ScrollArea className="h-full p-4" viewportRef={scrollRef}>
                <div className="space-y-4">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                        msg.role === "user" 
                          ? "bg-emerald-600 text-white rounded-tr-none" 
                          : "bg-gray-100 text-gray-800 rounded-tl-none"
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-none">
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>

          {!showSettings && (
            <CardFooter className="p-3 border-t bg-white">
              <div className="flex w-full gap-2">
                <Input 
                  placeholder="Ask about your meds..." 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button 
                  size="icon" 
                  onClick={handleSend} 
                  disabled={isLoading || !input.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
      )}

      <Button 
        size="lg" 
        className={`rounded-full w-14 h-14 shadow-xl transition-all duration-300 ${
          isOpen ? "bg-rose-500 hover:bg-rose-600 rotate-90" : "bg-emerald-600 hover:bg-emerald-700"
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
      </Button>
    </div>
  );
};

export default AIAssistant;