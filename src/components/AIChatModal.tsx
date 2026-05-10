"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askAIAssistant } from "@/utils/ai-assistant";
import { useMedicines } from "@/hooks/use-queries";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: medicines = [] } = useMedicines();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: "Hello! I'm your MediMind AI assistant. I can help you with your medications, health questions, schedule reminders, and more. What would you like to know?",
        },
      ]);
    }
  }, [open]);

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;
    const userMessage: Message = { role: "user", content: messageText.trim() };
    setMessages((prev) => [...prev, userMessage]);
    if (!text) setInput("");
    setIsLoading(true);
    try {
      const response = await askAIAssistant(userMessage.content);
      const assistantMessage: Message = { role: "assistant", content: response };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get response from AI";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Sorry, I encountered an error: ${message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getQuickActions = () => {
    const actions = [
      {
        icon: "Pill",
        label: "My medications",
        query: "What are my current medications and their schedules?",
      },
    ];
    if (medicines.length > 0) {
      const firstMed = medicines[0].name;
      actions.push({
        icon: "Activity",
        label: `${firstMed} side effects`,
        query: `What are the side effects of ${firstMed}?`,
      });
    }
    actions.push({
      icon: "Calendar",
      label: "Missed dose",
      query: "What should I do if I miss a dose?",
    });
    actions.push({
      icon: "Heart",
      label: "Medication tips",
      query: "Give me tips for taking my medications correctly",
    });
    return actions;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] h-[700px] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-emerald-50 to-teal-50">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-emerald-800">
              <Bot className="w-5 h-5" />
              MediMind AI Assistant
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearChat}
              className="text-gray-400 hover:text-rose-600 hover:bg-rose-50"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-white">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex items-start gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                    msg.role === "user"
                      ? "bg-emerald-600 text-white"
                      : "bg-emerald-100 text-emerald-600"
                  }`}
                >
                  {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                    msg.role === "user"
                      ? "bg-emerald-600 text-white rounded-tr-none"
                      : "bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-none px-4 py-2.5 shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span className="text-sm text-gray-500 italic">MediMind is thinking...</span>
              </div>
            </div>
          )}
          {messages.length <= 1 && !isLoading && (
            <div className="grid grid-cols-1 gap-2 pt-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Try asking about:</p>
              {getQuickActions().map((action, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="justify-start text-left h-auto py-3 px-4 hover:bg-emerald-50 hover:border-emerald-200"
                  onClick={() => handleSend(action.query)}
                >
                  <action.icon className="w-4 h-4 mr-3 text-emerald-600 shrink-0" />
                  <span className="text-sm">{action.label}</span>
                </Button>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex w-full gap-2">
            <Input
              placeholder="Ask about your medications, health..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              disabled={isLoading}
              className="flex-1 bg-white border-gray-200 focus-visible:ring-emerald-500"
            />
            <Button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIChatModal;