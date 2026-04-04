import { useNavigate, useLocation } from "react-router-dom";
import { Home, History, PlusCircle, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const BottomTabBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide on auth and landing pages
  if (["/", "/login", "/signup"].includes(location.pathname)) {
    return null;
  }

  const tabs = [
    { name: "Home", path: "/dashboard", icon: Home },
    { name: "History", path: "/history", icon: History },
    { name: "Add", path: "/add-medicine", icon: PlusCircle, isMain: true },
    { name: "Family", path: "/family-members", icon: Users },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex justify-around items-center z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        const Icon = tab.icon;
        return (
          <button
            key={tab.name}
            onClick={() => navigate(tab.path)}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200",
              tab.isMain 
                ? "bg-emerald-600 text-white -mt-8 shadow-lg hover:bg-emerald-700 rounded-full w-14 h-14" 
                : isActive 
                  ? "text-emerald-600" 
                  : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Icon className={cn("w-6 h-6", tab.isMain && "w-7 h-7")} />
            {!tab.isMain && <span className="text-xs mt-1 font-medium">{tab.name}</span>}
          </button>
        );
      })}
    </div>
  );
};

export default BottomTabBar;