import React from "react";  
import { useNavigate } from "react-router-dom";  

const BottomTabBar = () => {  
  const navigate = useNavigate();  
  return (  
    <div className="fixed bottom-0 w-full bg-white shadow-md">  
      <div className="flex items-center space-x-4 p-4">  
        <div onClick={() => navigate("index")}>  
          <span className="text-sm">Home</span>  
        </div>  
        <div onClick={() => navigate("dashboard")}>  
          <span className="text-sm">Dashboard</span>  
        </div>  
        <div onClick={() => navigate("add-medicine")}>  
          <span className="text-sm">Add Medicine</span>  
        </div>  
        <div onClick={() => navigate("history")}>  
          <span className="text-sm">History</span>  
        </div>  
        <div onClick={() => navigate("family-members")}>  
          <span className="text-sm">Family</span>  
        </div>  
      </div>  
    </div>  
  );  
};  

export default BottomTabBar;