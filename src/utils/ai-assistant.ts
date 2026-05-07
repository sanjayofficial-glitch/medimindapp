import { GoogleGenerativeAI } from "@google/generative-ai";
import { getMedicines, getDoseLogs, Medicine, DoseLog } from "./storage";
import { medicineDatabase } from "@/data/medicineDatabase";

const SETTINGS_KEY = "medimind_ai_settings";

export interface AISettings {
  apiKey: string;
  provider: "gemini";
  model?: string;
}

export const getAISettings = (): AISettings | null => {
  const settings = localStorage.getItem(SETTINGS_KEY);
  return settings ? JSON.parse(settings) : null;
};

export const saveAISettings = (settings: AISettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

const DEFAULT_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash-002",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro",
  "gemini-pro"
];

export const getAvailableModels = () => DEFAULT_MODELS;

export const askAIAssistant = async (query: string): Promise<string> => {
  const settings = getAISettings();
  if (!settings || !settings.apiKey) {
    throw new Error("API key not found. Please configure it in settings.");
  }

  try {
    const genAI = new GoogleGenerativeAI(settings.apiKey);
    const modelName = settings.model || "gemini-2.0-flash";
    const model = genAI.getGenerativeModel({ model: modelName });

    const medicines: Medicine[] = await getMedicines();
    const doseLogs: DoseLog[] = await getDoseLogs();
    
    const context = {
      userMedicines: medicines.map(m => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        times: m.times,
        notes: m.additionalText
      })),
      recentHistory: doseLogs.slice(-15).map(l => ({
        name: l.medicineName,
        status: l.status,
        scheduled: l.scheduledTime,
        actual: l.actualTime,
        date: l.date
      })),
      referenceDatabase: medicineDatabase.filter(db => 
        medicines.some(m => 
          m.name.toLowerCase().includes(db.brand_name.toLowerCase()) || 
          db.brand_name.toLowerCase().includes(m.name.toLowerCase()) ||
          m.dosage.toLowerCase().includes(db.generic_name.toLowerCase())
        )
      ).slice(0, 5)
    };

    const prompt = `
      You are MediMind AI, a professional medical assistant. 
      
      USER DATA:
      - Current Medications: ${JSON.stringify(context.userMedicines)}
      - Recent History: ${JSON.stringify(context.recentHistory)}
      - Reference Info: ${JSON.stringify(context.referenceDatabase)}
      
      USER QUESTION: "${query}"
      
      GUIDELINES:
      1. If the user missed a dose: Check the "Reference Info" for specific guidance. If not found, suggest taking it as soon as remembered unless it's nearly time for the next dose.
      2. Food interactions: Use the "Reference Info" (guidance/cautions) to answer if it should be taken before or after food.
      3. Safety: Mention specific cautions from the database if relevant.
      4. Tone: Be empathetic, clear, and concise.
      5. MANDATORY DISCLAIMER: End every response with "Disclaimer: I am an AI, not a doctor. Consult a healthcare professional for medical advice."
      
      Response:
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    if (!text) {
      throw new Error("The AI returned an empty response.");
    }
    
    return text;
  } catch (error) {
    console.error("AI Assistant Error:", error);
    throw error;
  }
};