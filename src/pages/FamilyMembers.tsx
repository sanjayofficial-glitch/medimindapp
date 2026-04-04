import React from "react";  
import { User } from "lucide-react";  
import { Button } from "@/components/ui/button";  

const FamilyMembers = () => {  
  return (  
    <div className="p-6">  
      <h2 className="text-2xl font-bold mb-4">Family Members</h2>  
      <div className="flex items-center justify-between mb-4">  
        <div className="flex items-center gap-2">  
          <User className="w-8 h-8 text-gray-600" />  
          <span className="text-sm">John Doe (Spouse)</span>  
        </div>  
      </div>  
      <div className="mt-4">  
        <p className="text-gray-600">Add family members to track their medications.</p>  
      </div>  
    </div>  
  );  
};  

export default FamilyMembers;