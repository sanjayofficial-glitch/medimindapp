import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NotificationHandler } from "./components/NotificationHandler";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import AddMedicine from "./pages/AddMedicine";
import FamilyMembers from "./pages/FamilyMembers";
import History from "./pages/History";
import Progress from "./pages/Progress";
import MedicationHistory from "./pages/MedicationHistory";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./context/AuthContext";

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/add-medicine" element={<AddMedicine />} />
          <Route path="/family" element={<FamilyMembers />} />
          <Route path="/history" element={<History />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/medication-history" element={<MedicationHistory />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/notification" element={<NotificationHandler />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;