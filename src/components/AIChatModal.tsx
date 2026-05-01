import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, Settings, Bot, User, Loader2 } from "lucide-react";
import { askAIAssistant, getAISettings, saveAISettings } from "@/utils/ai-assistant";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AIChatModal = ({ open, onOpenChange }: AIChatModalProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      const settings = getAISettings();
      if (settings) {
        setApiKey(settings.apiKey);
      }
    }
  }, [open]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const settings = getAISettings();
    if (!settings?.apiKey) {
      setShowSettings(true);
      toast.error("Please configure your Gemini API key first.");
      return;
    }

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await askAIAssistant(userMessage.content);
      const assistantMessage: Message = { role: "assistant", content: response };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get response from AI";
      toast.error(message);
      setMessages(prev => [...prev, { role: "assistant", content: `Sorry, I encountered an error: ${message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast.error("API key is required");
      return;
    }
    saveAISettings({ apiKey: apiKey.trim(), provider: "gemini" });
    toast.success("AI settings saved successfully");
    setShowSettings(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b bg-emerald-50/50">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-emerald-800">
                <Bot className="w-5 h-5" />
                MediMind AI Assistant
              </DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)} className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-white">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-12 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <Bot className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">How can I help you today?</p>
                  <p className="text-sm mt-1">Ask me about your medication schedule, potential side effects, or general health guidance.</p>
                </div>
                <div className="grid grid-cols-1 gap-2 max-w-xs mx-auto pt-4">
                  <Button variant="outline" size="sm" className="text-xs justify-start" onClick={() => setInput("What are the side effects of Metformin?")}>
                    "What are the side effects of Metformin?"
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs justify-start" onClick={() => setInput("I missed my morning dose, what should I do?")}>
                    "I missed my morning dose, what should I do?"
                  </Button>
                </div>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex items-start gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                    msg.role === "user" ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-600"
                  }`}>
                    {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                    msg.role === "user" 
                      ? "bg-emerald-600 text-white rounded-tr-none" 
                      : "bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200"
                  }`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-none px-4 py-2.5 shadow-sm">
                  <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                  <span className="text-sm text-gray-500 italic">MediMind is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-gray-50">
            <div className="flex w-full gap-2">
              <Input
                placeholder="Type your question here..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                disabled={isLoading}
                className="flex-1 bg-white border-gray-200 focus-visible:ring-emerald-500"
              />
              <Button 
                onClick={handleSend} 
                disabled={isLoading || !input.trim()} 
                className="bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-600" />
              AI Configuration
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">Google Gemini API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste your API key here"
                className="focus-visible:ring-emerald-500"
              />
              <p className="text-[11px] text-gray-500 leading-tight">
                Your key is stored locally on your device. Get one for free at the 
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline ml-1">
                  Google AI Studio
                </a>.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>Cancel</Button>
            <Button onClick={handleSaveApiKey} className="bg-emerald-600 hover:bg-emerald-700">Save Settings</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AIChatModal;