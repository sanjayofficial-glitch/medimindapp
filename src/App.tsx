// Add bottom tab bar component
const BottomTabBar = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(tab);
  };

  return (
    <div className="fixed bottom-0 w-full bg-white shadow-md">
      <div className="flex items-center space-x-4 p-4">
        <div onClick={() => handleTabChange("index")}>
          <Home className="w-6 h-6" />
          <span className="text-sm">Home</span>
        </div>
        <div onClick={() => handleTabChange("dashboard")}>
          <DashboardIcon className="w-6 h-6" /> {/* Add appropriate icon */}
          <span className="text-sm">Dashboard</span>
        </div>
        <div onClick={() => handleTabChange("add-medicine")}>
          <Plus className="w-6 h-6" />
          <span className="text-sm">Add Medicine</span>
        </div>
        <div onClick={() => handleTabChange("history")}>
          <Calendar className="w-6 h-6" />
          <span className="text-sm">History</span>
        </div>
        <div onClick={() => handleTabChange("family-members")}>
          <Family className="w-6 h-6" />
          <span className="text-sm">Family</span>
        </div>
      </div>
    </div>
  );
};

// Re-add AI toggle button
const AIButton = () => (
  <Button 
    size="lg" 
    className="fixed bottom-4 right-4 z-50 bg-emerald-600 hover:bg-emerald-700 rounded-full shadow-lg"
    onClick={() => setIsOpen(true)}
  >
    <AI className="w-6 h-6" />
  </Button>
);

// Update App component to include tab bar and AI button
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BottomTabBar />
        <AIButton />
        <BrowserRouter>
          <Routes>
            {/* Existing routes */}
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);