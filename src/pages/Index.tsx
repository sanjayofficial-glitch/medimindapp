import { Link } from "react-router-dom";
import { Calendar, ArrowRight } from "lucide-react";
import { MadeWithDyad } from "@/components/made-with-dyad";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">MediMind</h1>
          <p className="text-xl text-gray-600">Your smart medication companion</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Link
            to="/history"
            className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">History</h2>
            <p className="text-gray-600">View your medication adherence with color-coded calendar tracking</p>
          </Link>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 opacity-60">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-gray-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Reminders</h2>
            <p className="text-gray-600">Coming soon - Set up your medication schedule</p>
          </div>
        </div>
        
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Index;