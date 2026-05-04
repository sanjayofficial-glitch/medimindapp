"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Phone, Droplets, AlertCircle, ChevronLeft, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { getEmergencyProfile, saveEmergencyProfile, EmergencyProfile } from "@/utils/storage";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

const EmergencyID = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<EmergencyProfile>(getEmergencyProfile());
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    saveEmergencyProfile(profile);
    setIsEditing(false);
    toast.success("Emergency profile updated");
  };

  const qrData = JSON.stringify({
    blood: profile.bloodType,
    allergies: profile.allergies,
    conditions: profile.conditions,
    contacts: profile.emergencyContacts
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-rose-50 pb-32 p-6"
    >
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-rose-700">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="text-2xl font-bold text-rose-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6" /> Emergency Medical ID
          </h1>
          <Button variant="outline" onClick={() => setIsEditing(!isEditing)} className="border-rose-200 text-rose-700">
            {isEditing ? "Cancel" : "Edit"}
          </Button>
        </div>

        <div className="space-y-6">
          {/* QR Code Section */}
          <Card className="border-rose-200 shadow-lg overflow-hidden">
            <CardHeader className="bg-rose-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" /> Emergency QR Code
              </CardTitle>
              <CardDescription className="text-rose-100">Scan for immediate medical information</CardDescription>
            </CardHeader>
            <CardContent className="p-8 flex flex-col items-center justify-center bg-white">
              <div className="p-4 bg-white border-4 border-rose-600 rounded-2xl shadow-inner">
                <QRCodeSVG value={qrData} size={200} />
              </div>
              <p className="mt-4 text-sm text-gray-500 text-center">
                First responders can scan this code to see your critical health data instantly.
              </p>
            </CardContent>
          </Card>

          {/* Critical Info */}
          <Card className="border-rose-100">
            <CardHeader>
              <CardTitle className="text-lg">Critical Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-rose-700">Blood Type</Label>
                  {isEditing ? (
                    <Input value={profile.bloodType} onChange={e => setProfile({...profile, bloodType: e.target.value})} />
                  ) : (
                    <div className="p-3 bg-rose-50 rounded-xl font-bold text-rose-900 flex items-center gap-2">
                      <Droplets className="w-4 h-4" /> {profile.bloodType || "Not set"}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-rose-700">Allergies</Label>
                {isEditing ? (
                  <Input 
                    placeholder="Comma separated" 
                    value={profile.allergies.join(", ")} 
                    onChange={e => setProfile({...profile, allergies: e.target.value.split(",").map(s => s.trim())})} 
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profile.allergies.length > 0 ? profile.allergies.map(a => (
                      <span key={a} className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm font-medium">{a}</span>
                    )) : <span className="text-gray-400 italic">None listed</span>}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-rose-700">Chronic Conditions</Label>
                {isEditing ? (
                  <Input 
                    placeholder="Comma separated" 
                    value={profile.conditions.join(", ")} 
                    onChange={e => setProfile({...profile, conditions: e.target.value.split(",").map(s => s.trim())})} 
                  />
                ) : (
                  <div className="space-y-2">
                    {profile.conditions.length > 0 ? profile.conditions.map(c => (
                      <div key={c} className="flex items-center gap-2 text-gray-700">
                        <AlertCircle className="w-4 h-4 text-rose-500" /> {c}
                      </div>
                    )) : <span className="text-gray-400 italic">None listed</span>}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contacts */}
          <Card className="border-rose-100">
            <CardHeader>
              <CardTitle className="text-lg">Emergency Contacts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.emergencyContacts.map((contact, i) => (
                <div key={i} className="p-4 bg-white border rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900">{contact.name}</p>
                    <p className="text-xs text-gray-500">{contact.relationship}</p>
                  </div>
                  <a href={`tel:${contact.phone}`} className="p-2 bg-emerald-100 text-emerald-700 rounded-full">
                    <Phone className="w-5 h-5" />
                  </a>
                </div>
              ))}
              {isEditing && (
                <Button variant="outline" className="w-full border-dashed" onClick={() => setProfile({...profile, emergencyContacts: [...profile.emergencyContacts, {name: "", phone: "", relationship: ""}]})}>
                  Add Contact
                </Button>
              )}
            </CardContent>
          </Card>

          {isEditing && (
            <Button className="w-full bg-rose-600 hover:bg-rose-700 h-12 text-lg" onClick={handleSave}>
              Save Emergency Profile
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default EmergencyID;