import { useNavigate, useLocation } from "react-router-dom";
import { Home, History, PlusCircle, Users, BarChart3 } from "lucide-react";
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
    { name: "Progress", path: "/progress", icon: BarChart3 },
    { name: "Family", path: "/family-members", icon: Users },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-emerald-600 px-2 pb-4 pt-2 flex justify-around items-end z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.2)] pr-20">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        const Icon = tab.icon;
        return (
          <button
            key={tab.name}
            onClick={() => navigate(tab.path)}
            className={cn(
              "flex flex-col items-center justify-center transition-all duration-300",
              tab.isMain 
                ? "bg-white text-emerald-600 -mt-8 shadow-xl hover:scale-110 rounded-full w-14 h-14 border-4 border-emerald-600" 
                : cn(
                    "pb-1 px-3 py-1.5 rounded-xl",
                    isActive 
                      ? "bg-white/20 text-white shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]" 
                      : "text-emerald-100 hover:text-white hover:bg-white/10"
                  )
            )}
          >
            <Icon className={cn("w-6 h-6", tab.isMain && "w-7 h-7")} />
            {!tab.isMain && (
              <span className={cn(
                "text-[10px] mt-1 font-bold uppercase tracking-wider",
                isActive ? "opacity-100" : "opacity-80"
              )}>
                {tab.name}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default BottomTabBar;