"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import {
  ShieldAlert,
  ChevronLeft,
  QrCode,
  Plus,
  X,
  Heart,
  Phone,
  Pill,
  Stethoscope,
  FileText,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { getEmergencyProfile, saveEmergencyProfile, EmergencyProfile } from "@/utils/storage";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

const EmergencyID = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<EmergencyProfile>({
    bloodType: "",
    allergies: [],
    conditions: [],
    emergencyContacts: [],
    medications: [],
    doctors: [],
    organDonor: "unspecified",
    medicalNotes: "",
    height: "",
    weight: "",
    insuranceProvider: "",
    insurancePolicy: "",
    medicalDevices: [],
  });
  const [isEditing, setIsEditing] = useState(false);
  const [newAllergy, setNewAllergy] = useState("");
  const [newCondition, setNewCondition] = useState("");
  const [newMedication, setNewMedication] = useState({ name: "", dosage: "", frequency: "" });
  const [newDoctor, setNewDoctor] = useState({ name: "", specialty: "", phone: "" });
  const [newContact, setNewContact] = useState({ name: "", relationship: "", phone: "" });

  useEffect(() => {
    const loadProfile = async () => {
      const p = await getEmergencyProfile();
      setProfile(p);
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    await saveEmergencyProfile(profile);
    setIsEditing(false);
    toast.success("Emergency profile saved");
  };

  const addAllergy = () => {
    if (newAllergy.trim()) {
      setProfile({ ...profile, allergies: [...profile.allergies, newAllergy.trim()] });
      setNewAllergy("");
    }
  };

  const removeAllergy = (idx: number) => {
    setProfile({ ...profile, allergies: profile.allergies.filter((_, i) => i !== idx) });
  };

  const addCondition = () => {
    if (newCondition.trim()) {
      setProfile({ ...profile, conditions: [...profile.conditions, newCondition.trim()] });
      setNewCondition("");
    }
  };

  const removeCondition = (idx: number) => {
    setProfile({ ...profile, conditions: profile.conditions.filter((_, i) => i !== idx) });
  };

  const addMedication = () => {
    if (newMedication.name.trim()) {
      setProfile({ ...profile, medications: [...profile.medications, { ...newMedication }] });
      setNewMedication({ name: "", dosage: "", frequency: "" });
    }
  };

  const removeMedication = (idx: number) => {
    setProfile({ ...profile, medications: profile.medications.filter((_, i) => i !== idx) });
  };

  const addDoctor = () => {
    if (newDoctor.name.trim()) {
      setProfile({ ...profile, doctors: [...profile.doctors, { ...newDoctor }] });
      setNewDoctor({ name: "", specialty: "", phone: "" });
    }
  };

  const removeDoctor = (idx: number) => {
    setProfile({ ...profile, doctors: profile.doctors.filter((_, i) => i !== idx) });
  };

  const addContact = () => {
    if (newContact.name.trim() && newContact.phone.trim()) {
      setProfile({ ...profile, emergencyContacts: [...profile.emergencyContacts, { ...newContact }] });
      setNewContact({ name: "", relationship: "", phone: "" });
    }
  };

  const removeContact = (idx: number) => {
    setProfile({ ...profile, emergencyContacts: profile.emergencyContacts.filter((_, i) => i !== idx) });
  };

  const qrData = JSON.stringify(profile);

  const SectionCard = ({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) => (
    <Card className="border-rose-200 shadow-md">
      <CardHeader className="bg-rose-50 pb-3">
        <CardTitle className="text-rose-900 flex items-center gap-2 text-lg">
          <Icon className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">{children}</CardContent>
    </Card>
  );

  const TagList = ({ items, onRemove, color = "rose" }: { items: string[]; onRemove: (i: number) => void; color?: string }) => (
    <div className="flex flex-wrap gap-2">
      {items.map((item, idx) => (
        <Badge key={idx} variant="secondary" className={`bg-${color}-100 text-${color}-700 px-3 py-1`}>
          {item}
          {isEditing && <button onClick={() => onRemove(idx)} className="ml-2 hover:text-red-500"><X className="w-3 h-3" /></button>}
        </Badge>
      ))}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-rose-50 pb-32">
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-rose-700">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="text-xl font-bold text-rose-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6" /> Emergency Medical ID
          </h1>
          <Button variant={isEditing ? "destructive" : "outline"} onClick={() => isEditing ? handleSave() : setIsEditing(true)}>
            {isEditing ? "Save" : "Edit"}
          </Button>
        </div>

        <div className="space-y-4">
          <Card className="border-rose-300 shadow-lg overflow-hidden">
            <CardHeader className="bg-rose-600 text-white py-3">
              <CardTitle className="flex items-center gap-2 text-lg"><QrCode className="w-5 h-5" /> Emergency QR Code</CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center justify-center bg-white">
              <QRCodeSVG value={qrData} size={180} />
              <p className="text-xs text-gray-500 mt-2 text-center">Scan for instant access to your medical info</p>
            </CardContent>
          </Card>

          <SectionCard icon={Heart} title="Allergies">
            {isEditing ? (
              <div className="flex gap-2">
                <Input placeholder="Add allergy" value={newAllergy} onChange={e => setNewAllergy(e.target.value)} onKeyDown={e => e.key === "Enter" && addAllergy()} />
                <Button onClick={addAllergy} size="sm" className="bg-rose-600"><Plus className="w-4 h-4" /></Button>
              </div>
            ) : null}
            <TagList items={profile.allergies} onRemove={removeAllergy} color="red" />
            {profile.allergies.length === 0 && !isEditing && <p className="text-gray-400 text-sm">No allergies recorded</p>}
          </SectionCard>

          <SectionCard icon={FileText} title="Medical Conditions">
            {isEditing ? (
              <div className="flex gap-2">
                <Input placeholder="Add condition" value={newCondition} onChange={e => setNewCondition(e.target.value)} onKeyDown={e => e.key === "Enter" && addCondition()} />
                <Button onClick={addCondition} size="sm" className="bg-rose-600"><Plus className="w-4 h-4" /></Button>
              </div>
            ) : null}
            <TagList items={profile.conditions} onRemove={removeCondition} color="orange" />
            {profile.conditions.length === 0 && !isEditing && <p className="text-gray-400 text-sm">No conditions recorded</p>}
          </SectionCard>

          <SectionCard icon={Pill} title="Current Medications">
            {isEditing && (
              <div className="space-y-2 pb-3 border-b">
                <Input placeholder="Medication name" value={newMedication.name} onChange={e => setNewMedication({ ...newMedication, name: e.target.value })} />
                <div className="flex gap-2">
                  <Input placeholder="Dosage" value={newMedication.dosage} onChange={e => setNewMedication({ ...newMedication, dosage: e.target.value })} />
                  <Input placeholder="Frequency" value={newMedication.frequency} onChange={e => setNewMedication({ ...newMedication, frequency: e.target.value })} />
                </div>
                <Button onClick={addMedication} size="sm" className="bg-rose-600"><Plus className="w-4 h-4" /> Add</Button>
              </div>
            )}
            {profile.medications.map((med, idx) => (
              <div key={idx} className="flex justify-between items-center p-2 bg-rose-50 rounded-lg">
                <div>
                  <span className="font-semibold">{med.name}</span>
                  <span className="text-sm text-gray-600"> - {med.dosage}, {med.frequency}</span>
                </div>
                {isEditing && <button onClick={() => removeMedication(idx)}><X className="w-4 h-4 text-red-500" /></button>}
              </div>
            ))}
            {profile.medications.length === 0 && !isEditing && <p className="text-gray-400 text-sm">No medications recorded</p>}
          </SectionCard>

          <SectionCard icon={Stethoscope} title="Doctors & Specialists">
            {isEditing && (
              <div className="space-y-2 pb-3 border-b">
                <Input placeholder="Doctor name" value={newDoctor.name} onChange={e => setNewDoctor({ ...newDoctor, name: e.target.value })} />
                <Input placeholder="Specialty" value={newDoctor.specialty} onChange={e => setNewDoctor({ ...newDoctor, specialty: e.target.value })} />
                <Input placeholder="Phone" value={newDoctor.phone} onChange={e => setNewDoctor({ ...newDoctor, phone: e.target.value })} />
                <Button onClick={addDoctor} size="sm" className="bg-rose-600"><Plus className="w-4 h-4" /> Add</Button>
              </div>
            )}
            {profile.doctors.map((doc, idx) => (
              <div key={idx} className="flex justify-between items-center p-2 bg-rose-50 rounded-lg">
                <div>
                  <span className="font-semibold">{doc.name}</span>
                  <span className="text-sm text-gray-600"> ({doc.specialty})</span>
                  <div className="text-sm text-rose-700">{doc.phone}</div>
                </div>
                {isEditing && <button onClick={() => removeDoctor(idx)}><X className="w-4 h-4 text-red-500" /></button>}
              </div>
            ))}
            {profile.doctors.length === 0 && !isEditing && <p className="text-gray-400 text-sm">No doctors recorded</p>}
          </SectionCard>

          <SectionCard icon={Phone} title="Emergency Contacts">
            {isEditing && (
              <div className="space-y-2 pb-3 border-b">
                <Input placeholder="Name" value={newContact.name} onChange={e => setNewContact({ ...newContact, name: e.target.value })} />
                <Input placeholder="Relationship" value={newContact.relationship} onChange={e => setNewContact({ ...newContact, relationship: e.target.value })} />
                <Input placeholder="Phone" value={newContact.phone} onChange={e => setNewContact({ ...newContact, phone: e.target.value })} />
                <Button onClick={addContact} size="sm" className="bg-rose-600"><Plus className="w-4 h-4" /> Add</Button>
              </div>
            )}
            {profile.emergencyContacts.map((contact, idx) => (
              <div key={idx} className="flex justify-between items-center p-2 bg-rose-50 rounded-lg">
                <div>
                  <span className="font-semibold">{contact.name}</span>
                  <span className="text-sm text-gray-600"> ({contact.relationship})</span>
                  <div className="text-sm text-rose-700">{contact.phone}</div>
                </div>
                {isEditing && <button onClick={() => removeContact(idx)}><X className="w-4 h-4 text-red-500" /></button>}
              </div>
            ))}
            {profile.emergencyContacts.length === 0 && !isEditing && <p className="text-gray-400 text-sm">No emergency contacts</p>}
          </SectionCard>

          <SectionCard icon={FileText} title="Medical Notes">
            {isEditing ? (
              <textarea
                className="w-full p-3 border rounded-md min-h-[100px]"
                placeholder="Any additional medical information important for emergencies..."
                value={profile.medicalNotes}
                onChange={e => setProfile({ ...profile, medicalNotes: e.target.value })}
              />
            ) : (
              <div className="p-3 bg-rose-50 rounded-lg min-h-[60px]">
                {profile.medicalNotes || "No notes"}
              </div>
            )}
          </SectionCard>

          <SectionCard icon={Shield} title="Insurance">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-rose-700">Provider</Label>
                {isEditing ? (
                  <Input placeholder="Insurance company" value={profile.insuranceProvider} onChange={e => setProfile({ ...profile, insuranceProvider: e.target.value })} />
                ) : (
                  <div className="p-2 bg-rose-50 rounded-lg">{profile.insuranceProvider || "—"}</div>
                )}
              </div>
              <div>
                <Label className="text-rose-700">Policy Number</Label>
                {isEditing ? (
                  <Input placeholder="Policy #" value={profile.insurancePolicy} onChange={e => setProfile({ ...profile, insurancePolicy: e.target.value })} />
                ) : (
                  <div className="p-2 bg-rose-50 rounded-lg">{profile.insurancePolicy || "—"}</div>
                )}
              </div>
            </div>
          </SectionCard>

          {isEditing && (
            <div className="flex gap-3 pt-4">
              <Button className="flex-1 bg-rose-600 hover:bg-rose-700 h-12 text-lg" onClick={handleSave}>
                Save Emergency Profile
              </Button>
              <Button variant="outline" className="h-12" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default EmergencyID;