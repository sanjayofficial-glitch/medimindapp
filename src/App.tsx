import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NotificationHandler } from "./components/NotificationHandler";
// import { Medicine } from "./utils/storage"; // Removed unused import

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<NotificationHandler />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;