import { getMedicines, getDoseLogs, getVitalLogs, getAppointments, Medicine, DoseLog, VitalLog, Appointment } from "./storage";
import { medicineDatabase } from "@/data/medicineDatabase";

const getFallbackResponse = (query: string): string => {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes("side effect")) {
    return "I can look up side effects for your specific medications. Please check your Medication Wiki for detailed information about each medicine's side effects and guidance. Disclaimer: I'm an AI assistant, not a doctor. Please consult a healthcare professional for medical advice.";
  }
  
  if (lowerQuery.includes("miss") || lowerQuery.includes("forgot")) {
    return "If you miss a dose, take it as soon as you remember unless it's nearly time for your next dose. Never double up on doses. Check your medication schedule in the dashboard for your timing. Disclaimer: I'm an AI assistant, not a doctor. Please consult a healthcare professional for medical advice.";
  }
  
  if (lowerQuery.includes("interact") || lowerQuery.includes("combination")) {
    return "For medication interactions, please consult your doctor or pharmacist. You can also check the Interaction Checker on your dashboard for known interactions between your current medications. Disclaimer: I'm an AI assistant, not a doctor. Please consult a healthcare professional for medical advice.";
  }
  
  if (lowerQuery.includes("when") || lowerQuery.includes("time") || lowerQuery.includes("schedule")) {
    return "You can view your complete medication schedule on your Dashboard. It shows your daily doses, timings, and which you've taken. The Bottom Tab Bar gives you quick access from anywhere. Disclaimer: I'm an AI assistant, not a doctor. Please consult a healthcare professional for medical advice.";
  }
  
  const fallback = [
    "I need more information about your medications to help you better. Try asking about your specific medicine's side effects, timing, or interactions.",
    "Based on your health data, I recommend checking your Medication Wiki for detailed information about your prescribed medicines.",
    "Your medication adherence looks good! Keep tracking your doses for the best treatment outcomes. Check your progress page for trends.",
  ];
  return fallback[Math.floor(Math.random() * fallback.length)] + " Disclaimer: I'm an AI assistant, not a doctor. Please consult a healthcare professional for medical advice.";
};

const systemPrompt = `You are MediMind AI, a helpful medical assistant. You have access to the user's health data including:
- Their medications (name, dosage, frequency, schedule)
- Their dose history and adherence
- Their vital readings (blood pressure, heart rate, etc.)
- Their upcoming appointments

Use this data to give personalized answers. Be concise (2-3 sentences). Always be empathetic and supportive. If discussing medications, mention specific medicines from their data when relevant. IMPORTANT: End EVERY response with: "Disclaimer: I'm an AI assistant, not a doctor. Please consult a healthcare professional for medical advice."`;

export const askAIAssistant = async (query: string): Promise<string> => {
  const apiKey = import.meta.env.VITE_AI_API_KEY;
  
  if (!apiKey || apiKey.length < 10) {
    return getFallbackResponse(query);
  }

  try {
    let medicines: Medicine[] = [];
    let doseLogs: DoseLog[] = [];
    let vitalLogs: VitalLog[] = [];
    let appointments: Appointment[] = [];
    
    try {
      const results = await Promise.allSettled([
        getMedicines(),
        getDoseLogs(),
        getVitalLogs(),
        getAppointments()
      ]);
      
      if (results[0].status === 'fulfilled') medicines = results[0].value;
      if (results[1].status === 'fulfilled') doseLogs = results[1].value;
      if (results[2].status === 'fulfilled') vitalLogs = results[2].value;
      if (results[3].status === 'fulfilled') appointments = results[3].value;
    } catch (dbError) {
      console.warn("Could not fetch user data:", dbError);
    }
    
    const recentDoseLogs = doseLogs.slice(-20);
    const takenCount = recentDoseLogs.filter(l => l.status === "taken").length;
    const adherenceRate = recentDoseLogs.length > 0 ? Math.round((takenCount / recentDoseLogs.length) * 100) : 0;
    
    const latestVitals = vitalLogs.length > 0 ? vitalLogs.slice(-5) : [];
    const upcomingAppointments = appointments.filter(a => new Date(a.date) >= new Date()).slice(0, 3);
    
    const matchedMeds = medicineDatabase.filter(db => 
      medicines.some(m => 
        m.name.toLowerCase().includes(db.brand_name.toLowerCase()) || 
        db.brand_name.toLowerCase().includes(m.name.toLowerCase())
      )
    );

    const medicationInfo = medicines.map(m => {
      const dbMed = matchedMeds.find(dm => 
        dm.brand_name.toLowerCase().includes(m.name.toLowerCase()) || 
        m.name.toLowerCase().includes(dm.brand_name.toLowerCase())
      );
      return {
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        times: m.times?.join(", "),
        guidance: dbMed?.guidance || "Check prescription",
        cautions: dbMed?.cautions || ""
      };
    });

    const userContext = `
USER PROFILE:
- Name: ${medicines[0]?.familyMemberId ? "Family Member" : "User"}

MEDICATIONS (${medicines.length}):
${medicationInfo.map(m => `- ${m.name} ${m.dosage} ${m.frequency} (Times: ${m.times || "Not set"}) - ${m.guidance}`).join("\n") || "No medications added"}

ADHERENCE:
- Recent doses: ${takenCount}/${recentDoseLogs.length} taken (${adherenceRate}% adherence rate)
- Last taken: ${recentDoseLogs.find(l => l.status === "taken")?.date || "No recent data"}

VITALS (Latest):
${latestVitals.map(v => `- ${v.type}: ${v.value} ${v.unit} (${v.date})`).join("\n") || "No vitals recorded"}

UPCOMING APPOINTMENTS:
${upcomingAppointments.map(a => `- ${a.doctorName} (${a.specialty}) on ${a.date} at ${a.time}`).join("\n") || "No upcoming appointments"}

USER QUESTION: ${query}
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
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Groq API Error:", response.status, errorData);
      return getFallbackResponse(query);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]?.message?.content) {
      return getFallbackResponse(query);
    }

    const text = data.choices[0].message.content.trim();
    if (!text || text.length === 0) {
      return getFallbackResponse(query);
    }
    
    return text;
  } catch (error) {
    console.error("AI Assistant Error:", error);
    return getFallbackResponse(query);
  }
};