import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy, useState, useEffect } from "react";
import BottomTabBar from "./components/BottomTabBar";
import Sidebar from "./components/Sidebar";
import NotificationPermissionPrompt from "./components/NotificationPermissionPrompt";
import MedicationNotificationScheduler from "./components/MedicationNotificationScheduler";
import NotificationClickHandler from "./components/NotificationClickHandler";
import { AIProvider } from "./context/AIContext";
import { useAuth } from "./context/AuthContext";
import SplashScreen from "./components/SplashScreen";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const SignUp = lazy(() => import("./pages/SignUp"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AddMedicine = lazy(() => import("./pages/AddMedicine"));
const MedicationHistory = lazy(() => import("./pages/MedicationHistory"));
const FamilyMembers = lazy(() => import("./pages/FamilyMembers"));
const Progress = lazy(() => import("./pages/Progress"));
const VitalsTracker = lazy(() => import("./pages/VitalsTracker"));
const RefillManagement = lazy(() => import("./pages/RefillManagement"));
const SymptomLogger = lazy(() => import("./pages/SymptomLogger"));
const EmergencyID = lazy(() => import("./pages/EmergencyID"));
const Appointments = lazy(() => import("./pages/Appointments"));
const LabResults = lazy(() => import("./pages/LabResults"));
const MedicationWiki = lazy(() => import("./pages/MedicationWiki"));
const MoodJournal = lazy(() => import("./pages/MoodJournal"));
const PrescriptionWallet = lazy(() => import("./pages/PrescriptionWallet"));
const More = lazy(() => import("./pages/More"));
const Settings = lazy(() => import("./pages/Settings"));
const About = lazy(() => import("./pages/About"));
const FAQ = lazy(() => import("./pages/FAQ"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const HealthHub = lazy(() => import("./pages/HealthHub"));
const Reminders = lazy(() => import("./pages/Reminders"));
const CaregiverDashboard = lazy(() => import("./pages/CaregiverDashboard"));

const Loading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
  </div>
);

const App = () => {
  return (
    <AIProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <div className="flex min-h-screen bg-background">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Suspense fallback={<Loading />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/add-medicine" element={<AddMedicine />} />
                <Route path="/history" element={<MedicationHistory />} />
                <Route path="/family-members" element={<FamilyMembers />} />
                <Route path="/progress" element={<Progress />} />
                <Route path="/vitals" element={<VitalsTracker />} />
                <Route path="/refills" element={<RefillManagement />} />
                <Route path="/symptoms" element={<SymptomLogger />} />
                <Route path="/emergency-id" element={<EmergencyID />} />
                <Route path="/appointments" element={<Appointments />} />
                <Route path="/lab-results" element={<LabResults />} />
                <Route path="/wiki" element={<MedicationWiki />} />
                <Route path="/mood" element={<MoodJournal />} />
                <Route path="/wallet" element={<PrescriptionWallet />} />
                <Route path="/more" element={<More />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/about" element={<About />} />
                <Route path="/help" element={<FAQ />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
<Route path="/hub" element={<HealthHub />} />
                <Route path="/reminders" element={<Reminders />} />
                <Route path="/caregiver" element={<CaregiverDashboard />} />
              <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </div>
        </div>
        <NotificationClickHandler />
        <MedicationNotificationScheduler />
        <NotificationPermissionPrompt />
        <BottomTabBar />
      </BrowserRouter>
    </AIProvider>
  );
};

export default App;