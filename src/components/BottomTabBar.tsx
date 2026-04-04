import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Dashboard, Plus, Calendar, Users } from "lucide-react";

const BottomTabBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const tabs = [
    { path: "/", label: "Home", icon: Home },
    { path: "/dashboard", label: "Dashboard", icon: Dashboard },
    { path: "/add-medicine", label: "Add Medicine", icon: Plus },
    { path: "/history", label: "History", icon: Calendar },
    { path: "/family-members", label: "Family", icon: Users }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-gray-200 shadow-md z-50">
      <div className="flex h-full items-center justify-around px-2">
        {tabs.map((tab) => (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center gap-1 p-2 rounded-md hover:bg-gray-50 transition-colors ${
              location.pathname === tab.path
                ? "text-emerald-600 bg-emerald-50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomTabBar;