"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Bell, Shield, ChevronLeft, Save, LogOut, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "next-themes";
import { toast } from "sonner";

const Settings = () => {
  const navigate = useNavigate();
  const { user, updateProfile, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [notifications, setNotifications] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

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
          <p className="text-gray-600 dark:text-slate-400 mt-1">Manage your profile and app preferences</p>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <User className="w-5 h-5 text-emerald-600" />
                Profile Information
              </CardTitle>
              <CardDescription className="dark:text-slate-400">Update your personal details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="dark:text-slate-300">Full Name</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="John Doe"
                    className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="dark:text-slate-300">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="john@example.com"
                    className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Preferences Section */}
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Bell className="w-5 h-5 text-blue-600" />
                Preferences
              </CardTitle>
              <CardDescription className="dark:text-slate-400">Customize your app experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="dark:text-slate-300">Push Notifications</Label>
                  <p className="text-xs text-gray-500 dark:text-slate-500">Receive reminders for your medications</p>
                </div>
                <Switch checked={notifications} onCheckedChange={setNotifications} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="dark:text-slate-300">Dark Mode</Label>
                  <p className="text-xs text-gray-500 dark:text-slate-500">Switch to a darker color theme</p>
                </div>
                <Switch 
                  checked={theme === "dark"} 
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} 
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Section */}
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Shield className="w-5 h-5 text-amber-600" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:border-slate-700 dark:hover:bg-rose-950/30">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </CardContent>
          </Card>

          {/* Logout Button */}
          <Button 
            variant="ghost" 
            className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 h-12"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;