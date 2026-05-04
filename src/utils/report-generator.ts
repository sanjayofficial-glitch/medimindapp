import { getDoseLogs, getVitalLogs, getSymptomLogs, getMedicines, getFamilyMembers, DoseLog, VitalLog, SymptomLog, Medicine, FamilyMember } from "./storage";

export const generateHealthReport = async () => {
  const logs: DoseLog[] = await getDoseLogs();
  const vitals: VitalLog[] = await getVitalLogs();
  const symptoms: SymptomLog[] = await getSymptomLogs();
  const medicines: Medicine[] = await getMedicines();
  const members: FamilyMember[] = await getFamilyMembers();

  let report = `MEDIMIND HEALTH REPORT\n`;
  report += `Generated on: ${new Date().toLocaleString()}\n`;
  report += `==========================================\n\n`;

  report += `FAMILY MEMBERS & MEDICATIONS\n`;
  report += `----------------------------\n`;
  members.forEach(member => {
    report += `Member: ${member.name} (${member.relationship})\n`;
    const memberMeds = medicines.filter(m => m.familyMemberId === member.id);
    if (memberMeds.length === 0) {
      report += `  - No active medications\n`;
    } else {
      memberMeds.forEach(med => {
        report += `  - ${med.name}: ${med.dosage} (${med.frequency})\n`;
      });
    }
    report += `\n`;
  });

  report += `RECENT ADHERENCE (Last 30 Days)\n`;
  report += `------------------------------\n`;
  const taken = logs.filter(l => l.status === "taken").length;
  const missed = logs.filter(l => l.status === "missed").length;
  const total = logs.length;
  const rate = total > 0 ? Math.round((taken / total) * 100) : 0;
  report += `Overall Adherence Rate: ${rate}%\n`;
  report += `Total Doses: ${total} (Taken: ${taken}, Missed: ${missed})\n\n`;

  report += `RECENT VITALS\n`;
  report += `-------------\n`;
  if (vitals.length === 0) {
    report += `No vitals recorded.\n`;
  } else {
    vitals.slice(-10).forEach(v => {
      const member = members.find(m => m.id === v.familyMemberId)?.name || "Unknown";
      report += `${v.date} ${v.time} - ${member}: ${v.type.replace('_', ' ')}: ${v.value} ${v.unit}\n`;
    });
  }
  report += `\n`;

  report += `RECENT SYMPTOMS\n`;
  report += `---------------\n`;
  if (symptoms.length === 0) {
    report += `No symptoms recorded.\n`;
  } else {
    symptoms.slice(-10).forEach(s => {
      const member = members.find(m => m.id === s.familyMemberId)?.name || "Unknown";
      report += `${s.date} ${s.time} - ${member}: ${s.symptom} (${s.severity})\n`;
      if (s.notes) report += `  Notes: ${s.notes}\n`;
    });
  }

  report += `\n==========================================\n`;
  report += `Disclaimer: This report is for informational purposes only. Please consult a healthcare professional.`;

  const blob = new Blob([report], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `MediMind_Health_Report_${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};