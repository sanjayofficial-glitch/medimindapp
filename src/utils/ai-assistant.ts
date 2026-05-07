import { getMedicines, getDoseLogs, Medicine, DoseLog } from "./storage";
import { medicineDatabase } from "@/data/medicineDatabase";

const DEMO_RESPONSES = [
  "Based on your medication schedule, remember to take your doses at consistent times each day for best results. Disclaimer: I'm an AI assistant, not a doctor. Please consult a healthcare professional for medical advice.",
  "Great question! Regular medication adherence is key to effective treatment. Keep tracking your doses and note any side effects you experience. Disclaimer: I'm an AI assistant, not a doctor. Please consult a healthcare professional for medical advice.",
  "I recommend setting daily reminders for your medications. Consistency helps maintain steady levels of medication in your body for optimal effect. Disclaimer: I'm an AI assistant, not a doctor. Please consult a healthcare professional for medical advice.",
];

const getDemoResponse = () => {
  return DEMO_RESPONSES[Math.floor(Math.random() * DEMO_RESPONSES.length)];
};

const systemPrompt = `You are MediMind AI, a friendly medical assistant helping users manage their medications. Be helpful, empathetic, and concise (2-3 sentences max). If asking about missed dose: suggest taking it soon unless it's nearly time for the next dose. If asking about side effects: mention common ones but always recommend consulting a doctor. IMPORTANT: End your response with: "Disclaimer: I'm an AI assistant, not a doctor. Please consult a healthcare professional for medical advice."`;

export const askAIAssistant = async (query: string): Promise<string> => {
  const apiKey = import.meta.env.VITE_AI_API_KEY;
  
  if (!apiKey || apiKey.length < 10) {
    return getDemoResponse();
  }

  try {
    let medicines: Medicine[] = [];
    let doseLogs: DoseLog[] = [];
    
    try {
      medicines = await getMedicines();
      doseLogs = await getDoseLogs();
    } catch (dbError) {
      console.warn("Could not fetch user data:", dbError);
    }
    
    const matchedMeds = medicineDatabase.filter(db => 
      medicines.some(m => 
        m.name.toLowerCase().includes(db.brand_name.toLowerCase()) || 
        db.brand_name.toLowerCase().includes(m.name.toLowerCase())
      )
    ).slice(0, 5);

    const userContext = `
User Context:
- Medications: ${medicines.length > 0 ? medicines.map(m => `${m.name} (${m.dosage}) ${m.frequency}`).join(", ") : "No medications added yet"}
- Recent adherence: ${doseLogs.length > 0 ? `${doseLogs.filter(l => l.status === "taken").length}/${doseLogs.length} doses taken` : "No history yet"}

${matchedMeds.length > 0 ? `Medicine Database Reference: ${matchedMeds.map(m => `${m.brand_name}: ${m.guidance || "General guidance available"}`).join("; ")}` : ""}

User Question: ${query}
`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContext },
        ],
        temperature: 0.7,
        max_tokens: 512,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Groq API Error:", response.status, errorData);
      return getDemoResponse();
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]?.message?.content) {
      return getDemoResponse();
    }

    const text = data.choices[0].message.content.trim();
    if (!text || text.length === 0) {
      return getDemoResponse();
    }
    
    return text;
  } catch (error) {
    console.error("AI Assistant Error:", error);
    return getDemoResponse();
  }
};