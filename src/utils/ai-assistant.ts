import { GoogleGenerativeAI } from "@google/generative-ai";
import { getMedicines, getDoseLogs } from "./storage";
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
    throw new Error("API key not found. Please configure it in settings.");
  }

  try {
    const genAI = new GoogleGenerativeAI(settings.apiKey);
    // Using gemini-1.5-flash as it's fast and reliable for this use case
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const medicines = getMedicines();
    const doseLogs = await getDoseLogs();
    
    // Prepare context for the AI - limit history to keep token count low
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
      // Only include relevant database entries to save tokens
      referenceDatabase: medicineDatabase.filter(db => 
        medicines.some(m => 
          m.name.toLowerCase().includes(db.brand_name.toLowerCase()) || 
          db.brand_name.toLowerCase().includes(m.name.toLowerCase()) ||
          m.dosage.toLowerCase().includes(db.generic_name.toLowerCase())
        )
      ).slice(0, 5) // Limit to top 5 matches
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
  } catch (error: any) {
    console.error("AI Assistant Error:", error);
    
    // Provide more helpful error messages based on common API issues
    const errorMessage = error.message || "";
    if (errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("invalid api key")) {
      throw new Error("Invalid API Key. Please check your Gemini API key in settings.");
    } else if (errorMessage.includes("SAFETY")) {
      throw new Error("I cannot answer this query due to safety filters. Please consult a doctor.");
    } else if (errorMessage.includes("quota") || errorMessage.includes("429")) {
      throw new Error("API quota exceeded. Please try again later.");
    }
    
    throw new Error(`AI Error: ${errorMessage || "Failed to connect to the AI service."}`);
  }
};