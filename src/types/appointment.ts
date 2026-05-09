export interface Appointment {
  id: string;
  familyMemberId: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  location: string;
  notes?: string;
}