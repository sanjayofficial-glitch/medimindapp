"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, ChevronLeft, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { getEmergencyProfile, saveEmergencyProfile, EmergencyProfile } from "@/utils/storage";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

const EmergencyID = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<EmergencyProfile>({ bloodType: "", allergies: [], conditions: [], emergencyContacts: [] });
  const [isEditing, setIsEditing] = useState(false);

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
    toast.success("Emergency profile updated");
  };

  const qrData = JSON.stringify(profile);

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
          <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? "Cancel" : "Edit"}
          </Button>
        </div>

        <div className="space-y-6">
          <Card className="border-rose-200 shadow-lg">
            <CardHeader className="bg-rose-600 text-white">
              <CardTitle className="flex items-center gap-2"><QrCode className="w-5 h-5" /> Emergency QR Code</CardTitle>
            </CardHeader>
            <CardContent className="p-8 flex flex-col items-center justify-center bg-white">
              <QRCodeSVG value={qrData} size={200} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Critical Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Blood Type</Label>
                {isEditing ? (
                  <Input value={profile.bloodType} onChange={e => setProfile({...profile, bloodType: e.target.value})} />
                ) : (
                  <div className="p-3 bg-rose-50 rounded-xl font-bold text-rose-900">{profile.bloodType || "Not set"}</div>
                )}
              </div>
            </CardContent>
          </Card>

          {isEditing && (
            <Button className="w-full bg-rose-600 hover:bg-rose-700" onClick={handleSave}>
              Save Emergency Profile
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default EmergencyID;