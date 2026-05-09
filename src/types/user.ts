export interface FamilyMember {
  id: string;
  user_id: string;
  name: string;
  relationship: string;
  created_at: string;
}

export interface EmergencyProfile {
  bloodType: string;
  allergies: string[];
  conditions: string[];
  emergencyContacts: { name: string; relationship: string; phone: string }[];
}