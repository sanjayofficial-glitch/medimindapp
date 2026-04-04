import React from "react";  
import { Button } from "@/components/ui/button";  
import { Input } from "@/components/ui/input";  
import { Label } from "@/components/ui/label";  

const AddMedicine = () => {  
  return (  
    <div className="p-6">  
      <h2 className="text-2xl font-bold mb-4">Add Medicine</h2>  
      <form>  
        <div className="mb-4">  
          <Label htmlFor="name">Medicine Name</Label>  
          <Input id="name" type="text" placeholder="e.g., Metformin" />  
        </div>  
        <div className="mb-4">  
          <Label htmlFor="dosage">Dosage</Label>  
          <Input id="dosage" type="text" placeholder="e.g., 500mg" />  
        </div>  
        <div className="mb-4">  
          <Label htmlFor="frequency">Frequency</Label>  
          <Input id="frequency" type="text" placeholder="e.g., Daily" />  
        </div>  
        <Button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded">  
          Add  
        </Button>  
      </form>  
    </div>  
  );  
};  

export default AddMedicine;