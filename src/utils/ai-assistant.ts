import { GoogleGenerativeAI } from "@google/generative-ai";
import { getMedicines, getDoseLogs, Medicine, DoseLog } from "./storage";
import { medicineDatabase } from "@/data/medicineDatabase";

const SETTINGS_KEY = "medimind_ai_settings";

export interface AISettings {
  apiKey: string;
  provider: "gemini";
}

export const getAISettings = (): AISettings | null => {
  const settings = localStorage.getItem(SETTINGS_KEY);
  return settings ? JSON.parse(settings) : null;
};

export const saveAISettings = (settings: AISettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const askAIAssistant = async (query: string): Promise<string> => {
  const settings = getAISettings();
  if (!settings || !settings.apiKey) {
    throw new Error("Please set your Google Gemini API key in settings first.");
  }

  const genAI = new GoogleGenerativeAI(settings.apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const medicines = getMedicines();
  const doseLogs = await getDoseLogs();
  
  // Prepare context for the AI
  const context = {
    userMedicines: medicines.map(m => ({
      name: m.name,
      dosage: m.dosage,
      frequency: m.frequency,
      times: m.times,
      notes: m.additionalText
    })),
    recentHistory: doseLogs.slice(-10).map(l => ({
      name: l.medicineName,
      status: l.status,
      scheduled: l.scheduledTime,
      actual: l.actualTime,
      date: l.date
    })),
    referenceDatabase: medicineDatabase.filter(db => 
      medicines.some(m => m.name.toLowerCase().includes(db.brand_name.toLowerCase()) || 
                         db.brand_name.toLowerCase().includes(m.name.toLowerCase()))
    )
  };

  const prompt = `
    You are MediMind AI, a helpful and professional medical assistant. 
    Your goal is to help the user manage their medications safely based on their schedule and history.
    
    USER CONTEXT:
    - Current Medications: ${JSON.stringify(context.userMedicines)}
    - Recent Dose History: ${JSON.stringify(context.recentHistory)}
    - Reference Info (Guidance/Cautions): ${JSON.stringify(context.referenceDatabase)}
    
    USER QUERY: "${query}"
    
    INSTRUCTIONS:
    1. Analyze if the user has missed any doses recently based on the history.
    2. If they ask about a missed dose, provide guidance based on the reference info or general best practices (e.g., "take it as soon as you remember, but skip if it's almost time for the next dose").
    3. Answer questions about food interactions (before/after food) using the reference database guidance.
    4. Mention specific cautions or side effects if relevant to the query.
    5. ALWAYS include a disclaimer: "I am an AI assistant, not a doctor. Please consult your healthcare provider for medical advice."
    6. Keep the tone empathetic and clear.
    
    Response:
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("AI Assistant Error:", error);
    if (error.message?.includes("API_KEY_INVALID")) {
      throw new Error("Invalid API Key. Please check your settings.");
    }
    throw new Error("Failed to get a response from the AI. Please try again later.");
  }
};