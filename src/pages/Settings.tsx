"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { User, ChevronLeft, LogOut, ShieldCheck, Camera, Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { saveProfilePicture, getProfilePicture } from "@/utils/storage";
import { useOneSignal } from "@/hooks/use-one-signal";

const Settings = () => {
  const navigate = useNavigate();
  const { user, updateProfile, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState(user?.user_metadata?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [isSaving, setIsSaving] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  const { isEnabled: notificationsEnabled, isLoading: isCheckingNotifications, isSubscribing, isSupported, isConfigured, subscribe, unsubscribe } = useOneSignal();

  useEffect(() => {
    setMounted(true);
    const saved = getProfilePicture();
    if (saved) {
      setProfilePicture(saved);
    }
  }, []);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      saveProfilePicture(base64);
      setProfilePicture(base64);
      toast.success("Profile picture updated!");
    };
    reader.onerror = () => {
      toast.error("Failed to read image");
    };
    reader.readAsDataURL(file);
  };

  const getInitials = () => {
    if (name) {
      return name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "U";
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const success = await updateProfile(name, email);
    if (success) {
      toast.success("Profile updated successfully");
    } else {
      toast.error("Failed to update profile");
    }
    setIsSaving(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    toast.success("Logged out successfully");
  };

  if (!mounted) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-32 p-6"
    >
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        </div>

        <div className="space-y-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardContent className="pt-6 flex flex-col items-center">
              <div className="relative">
                <button onClick={handleAvatarClick} className="relative group">
                  <Avatar className="w-24 h-24 border-2 border-gray-200 dark:border-slate-700">
                    {profilePicture ? (
                      <AvatarImage src={profilePicture} alt="Profile" className="object-cover" />
                    ) : (
                      <AvatarFallback className="text-2xl bg-emerald-100 text-emerald-700">
                        {getInitials()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                </button>
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1.5 rounded-full shadow-md">
                  <Camera className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-slate-400">Tap to change photo</p>
            </CardContent>
          </Card>

          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <User className="w-5 h-5 text-emerald-600" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your personal details and account email.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="dark:text-slate-300">Full Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="dark:text-slate-300">Email Address</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <Button type="submit" className="bg-emerald-600" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {!isConfigured ? (
            <Card className="dark:bg-slate-900 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  <BellOff className="w-5 h-5 text-gray-400" />
                  Push Notifications
                </CardTitle>
                <CardDescription>Receive reminders when it's time to take your medicine</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Setup Required:</strong> Push notifications are not configured. Please add your OneSignal App ID to the environment variables.
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                    Add <code>VITE_ONESIGNAL_APP_ID</code> to your .env file
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : isSupported ? (
            <Card className="dark:bg-slate-900 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  {notificationsEnabled ? <Bell className="w-5 h-5 text-emerald-600" /> : <BellOff className="w-5 h-5 text-gray-400" />}
                  Push Notifications
                </CardTitle>
                <CardDescription>Receive reminders when it's time to take your medicine</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">Medication Reminders</p>
                      <p className="text-xs text-gray-500">
                        {notificationsEnabled 
                          ? "You'll receive push notifications" 
                          : "Enable to get notified when it's time for your meds"}
                      </p>
                    </div>
                  </div>
                  {isCheckingNotifications ? (
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  ) : (
                    <Switch
                      checked={notificationsEnabled}
                      disabled={isSubscribing}
                      onCheckedChange={async (checked) => {
                        if (checked) {
                          const success = await subscribe();
                          if (success) {
                            toast.success("Notifications enabled! You'll receive medication reminders.");
                          } else {
                            toast.error("Failed to enable notifications. Please check your browser settings.");
                          }
                        } else {
                          const success = await unsubscribe();
                          if (success) {
                            toast.info("Notifications disabled.");
                          }
                        }
                      }}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Security & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/privacy")}>
                View Privacy Policy
              </Button>
              <Button variant="outline" className="w-full justify-start text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" /> Log Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;