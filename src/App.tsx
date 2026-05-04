import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import BottomTabBar from "./components/BottomTabBar";
import AIButton from "./components/AIButton";

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

const Loading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const App = () => {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <BottomTabBar />
      <AIButton />
    </BrowserRouter>
  );
};

export default App;