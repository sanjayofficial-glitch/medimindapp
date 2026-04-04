import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import { useNavigate } from "react-router-dom";
import BottomTabBar from "./components/BottomTabBar";
import AIButton from "./components/AIButton";

const App = () => {
  const navigate = useNavigate();

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
};

export default App;