import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NotificationHandler } from "./components/NotificationHandler";
import { AITipModal } from "./components/AITipModal";
import { Medicine } from "./utils/storage";
import { useState, useEffect } from "react";

const App = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [showAITip, setShowAITip] = useState(false);
  const [currentMedicine, setCurrentMedicine] = useState<Medicine | null>(null);

  useEffect(() => {
    const fetchMedicines = async () => {
      const response = await fetch("/api/medicines");
      const data = await response.json();
      setMedicines(data);
    };
    fetchMedicines();
  }, []);

  const handleMedicineClick = (medicine: Medicine) => {
    setCurrentMedicine(medicine);
    setShowAITip(true);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<NotificationHandler /> />}
      </Routes>
    </BrowserRouter>
  );
};

export default App;