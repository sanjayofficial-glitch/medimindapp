import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomTabBar from "./components/BottomTabBar";
import AIButton from "./components/AIButton";

// Create a simple bottom tab bar component within App
const BottomTabBar = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const navigate = useNavigate();

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(tab);
  };

  return (
    <div className="fixed bottom-0 w-full bg-white shadow-md">
      <div className="flex items-center space-x-4 p-4">
        <div onClick={() => handleTabChange("index")}>
          <span className="text-sm">Home</span>
        </div>
        <div onClick={() => handleTabChange("dashboard")}>
          <span className="text-sm">Dashboard</span>
        </div>
        <div onClick={() => handleTabChange("add-medicine")}>
          <span className="text-sm">Add Medicine</span>
        </div>
        <div onClick={() => handleTabChange("history")}>
          <span className="text-sm">History</span>
        </div>
        <div onClick={() => handleTabChange("family-members")}>
          <span className="text-sm">Family</span>
        </div>
      </div>
    </div>
  );
};

// Create AI toggle button component
const AIButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const toggleAI = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button 
        size="lg" 
        className="bg-emerald-600 hover:bg-emerald-700 rounded-full shadow-lg p-2"
        onClick={toggleAI}
      >
        <AI className="w-6 h-6" />
      </Button>
      {isOpen && (
        <div className="fixed bottom-4 left-4 w-64 bg-white shadow-lg rounded-md border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AI className="w-5 h-5" />
            <span className="font-medium">MediMind AI</span>
          </div>
          <div className="text-sm text-gray-600">
            Ask questions about your medications and get personalized guidance.
          </div>
          <div className="mt-2 flex flex-col gap-1">
            <Button size="sm" className="w-full bg-gray-100 hover:bg-gray-200">
              Clear Chat
            </Button>
            <Button size="sm" className="w-full bg-gray-100 hover:bg-gray-200">
              Settings
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/add-medicine" element={<AddMedicine />} />
        <Route path="/history" element={<History />} />
        <Route path="/family-members" element={<FamilyMembers />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </BrowserRouter>
    );

    // Render bottom tab bar and AI button outside of routes
  );
};

export default App;