import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import BottomTabBar from "./components/BottomTabBar";
import AIButton from "./components/AIButton";
import AddMedicine from "./pages/AddMedicine";
import MedicationHistory from "./pages/MedicationHistory";
import FamilyMembers from "./pages/FamilyMembers";

const App = () => {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/add-medicine" element={<AddMedicine />} />
        <Route path="/history" element={<MedicationHistory />} />
        <Route path="/family-members" element={<FamilyMembers />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <AIButton />
    </BrowserRouter>
  );
};

export default App;